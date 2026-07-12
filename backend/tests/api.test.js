'use strict';

// End-to-end smoke test: build the app, hit it with fetch, tear it down.

const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');

const TEST_DB = path.join(__dirname, '..', 'data', 'test-api.db');
process.env.QB_DB_PATH = TEST_DB;
process.env.PORT = '0';

function reset() {
  delete require.cache[require.resolve('../src/db/init')];
  delete require.cache[require.resolve('../src/server')];
  for (const ext of ['', '-wal', '-shm']) {
    const p = TEST_DB + ext;
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
}

test('integration: full sprint workflow', async () => {
  reset();
  const app = require('../src/server');
  const { closeDb } = require('../src/db/init');
  const server = app.listen(0);
  await new Promise((r) => server.on('listening', r));
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  try {
    // 1. empty member list
    let r = await fetch(`${base}/api/members`);
    let body = await r.json();
    assert.deepStrictEqual(body, []);

    // 2. add three members
    for (const name of ['Alice', 'Bob', 'Charlie']) {
      r = await fetch(`${base}/api/members`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      assert.strictEqual(r.status, 201);
    }

    // 3. duplicate name rejected
    r = await fetch(`${base}/api/members`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Alice' }),
    });
    assert.strictEqual(r.status, 409);

    // 4. create sprint
    r = await fetch(`${base}/api/sprints`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Sprint 1',
        start_date: '2026-07-24',
        end_date: '2026-08-07',
      }),
    });
    assert.strictEqual(r.status, 201);
    const sprint1 = await r.json();
    assert.strictEqual(sprint1.assignments.length, 3);
    assert.strictEqual(sprint1.rotation_offset, 1);

    // 5. creating a sprint with same name fails
    r = await fetch(`${base}/api/sprints`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Sprint 1',
        start_date: '2026-08-07',
        end_date: '2026-08-21',
      }),
    });
    assert.strictEqual(r.status, 409);

    // 6. create second sprint - offset should change to 2
    r = await fetch(`${base}/api/sprints`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Sprint 2',
        start_date: '2026-08-07',
        end_date: '2026-08-21',
      }),
    });
    const sprint2 = await r.json();
    assert.strictEqual(sprint2.rotation_offset, 2);

    // 7. buddy assignment differs sprint-to-sprint for every member
    const map1 = new Map(sprint1.assignments.map((a) => [a.member_id, a.buddy_id]));
    const map2 = new Map(sprint2.assignments.map((a) => [a.member_id, a.buddy_id]));
    for (const [mid, bid1] of map1) {
      assert.notStrictEqual(bid1, map2.get(mid), `member ${mid} got same buddy in both sprints`);
    }

    // 8. /api/sprints/current returns the latest
    r = await fetch(`${base}/api/sprints/current`);
    const current = await r.json();
    assert.strictEqual(current.id, sprint2.id);

    // 9. cannot delete a member with history
    r = await fetch(`${base}/api/members/1`, { method: 'DELETE' });
    assert.strictEqual(r.status, 409);

    // 10. slack text endpoint
    r = await fetch(`${base}/api/sprints/${sprint1.id}/slack`);
    const text = await r.text();
    assert.match(text, /📋 Sprint 1 — Quality Buddies/);
    assert.match(text, /Alice → Bob/);
    assert.match(text, /Bob → Charlie/);
    assert.match(text, /Charlie → Alice/);
  } finally {
    server.close();
    closeDb();
  }
});
