'use strict';

// Regression test for the SPA catch-all route.
//
// Background: Express 5 uses path-to-regexp v8, which requires named
// wildcards ('*splat', '*foo', etc.). The earlier '*' form throws at
// route-registration time, which kills the server on boot in production
// (where frontend/dist/ exists). This test boots the app with a fake
// dist and exercises the catch-all, so any regression to bare '*' (or
// any other path-to-regexp syntax error in the catch-all) will fail
// this test with the original path-to-regexp error.

const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

const { createApp } = require('../src/server');
const { closeDb } = require('../src/db/init');

const TEST_DB = path.join(__dirname, '..', 'data', 'test-spa-fallback.db');
process.env.QB_DB_PATH = TEST_DB;

test('spa fallback: catch-all route registers and serves index.html', async () => {
  for (const ext of ['', '-wal', '-shm']) {
    const p = TEST_DB + ext;
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }

  const distDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qb-spa-'));
  fs.writeFileSync(
    path.join(distDir, 'index.html'),
    '<!doctype html><title>qb-spa</title>'
  );
  fs.mkdirSync(path.join(distDir, 'assets'));
  fs.writeFileSync(
    path.join(distDir, 'assets', 'app.js'),
    'console.log("qb-spa-asset");'
  );

  const app = createApp({ distDir });
  const server = app.listen(0);
  await new Promise((r) => server.on('listening', r));
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  try {
    let r = await fetch(`${base}/api/health`);
    assert.strictEqual(r.status, 200);
    assert.deepStrictEqual(await r.json(), { ok: true });

    r = await fetch(`${base}/api/does-not-exist`);
    assert.strictEqual(r.status, 404);

    r = await fetch(`${base}/some/deep/spa/route`);
    assert.strictEqual(r.status, 200);
    const html = await r.text();
    assert.match(html, /<title>qb-spa<\/title>/);

    r = await fetch(`${base}/assets/app.js`);
    assert.strictEqual(r.status, 200);
    const js = await r.text();
    assert.match(js, /qb-spa-asset/);
  } finally {
    server.close();
    closeDb();
    fs.rmSync(distDir, { recursive: true, force: true });
  }
});
