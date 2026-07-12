'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { generateAssignments, formatSlackText, formatDateRange } = require('../src/rotation');

const MEMBERS = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Charlie' },
];

test('rotation: first sprint uses offset 1 (no prev)', () => {
  const { offset, assignments } = generateAssignments(MEMBERS, 0);
  assert.strictEqual(offset, 1);
  assert.strictEqual(assignments.length, 3);
  // offset 1: A→B, B→C, C→A
  assert.deepStrictEqual(assignments, [
    { memberId: 1, buddyId: 2 },
    { memberId: 2, buddyId: 3 },
    { memberId: 3, buddyId: 1 },
  ]);
});

test('rotation: never assigns self', () => {
  for (let prev = 0; prev < 5; prev++) {
    const { assignments } = generateAssignments(MEMBERS, prev);
    for (const a of assignments) {
      assert.notStrictEqual(a.memberId, a.buddyId, `self-assign at prev=${prev}`);
    }
  }
});

test('rotation: offset changes every sprint', () => {
  const seen = [];
  let prev = 0;
  for (let i = 0; i < 6; i++) {
    const { offset } = generateAssignments(MEMBERS, prev);
    seen.push(offset);
    prev = offset;
  }
  // For N=3, offset should alternate 1, 2, 1, 2, 1, 2
  assert.deepStrictEqual(seen, [1, 2, 1, 2, 1, 2]);
});

test('rotation: no same buddy two sprints in a row (N=3)', () => {
  // Build mapping memberId -> buddyId per sprint
  const sprintBuddies = [];
  let prev = 0;
  for (let i = 0; i < 5; i++) {
    const { offset } = generateAssignments(MEMBERS, prev);
    const map = {};
    for (const a of generateAssignments(MEMBERS, prev).assignments) {
      map[a.memberId] = a.buddyId;
    }
    sprintBuddies.push(map);
    prev = offset;
  }
  for (let i = 1; i < sprintBuddies.length; i++) {
    for (const m of MEMBERS) {
      assert.notStrictEqual(
        sprintBuddies[i][m.id],
        sprintBuddies[i - 1][m.id],
        `member ${m.id} got same buddy in sprint ${i} and ${i - 1}`,
      );
    }
  }
});

test('rotation: cycles uniquely for N=4', () => {
  const FOUR = [
    { id: 1, name: 'A' },
    { id: 2, name: 'B' },
    { id: 3, name: 'C' },
    { id: 4, name: 'D' },
  ];
  const seen = new Set();
  let prev = 0;
  for (let i = 0; i < 3; i++) {
    const { offset, assignments } = generateAssignments(FOUR, prev);
    const key = assignments.map((a) => `${a.memberId}->${a.buddyId}`).sort().join(',');
    seen.add(key);
    prev = offset;
  }
  assert.strictEqual(seen.size, 3, 'three consecutive sprints produce 3 distinct configurations');
});

test('rotation: 2-member team works (always paired with each other)', () => {
  const TWO = [
    { id: 1, name: 'A' },
    { id: 2, name: 'B' },
  ];
  const r1 = generateAssignments(TWO, 0);
  const r2 = generateAssignments(TWO, r1.offset);
  assert.strictEqual(r1.assignments[0].buddyId, 2);
  assert.strictEqual(r1.assignments[1].buddyId, 1);
  assert.strictEqual(r2.assignments[0].buddyId, 2);
  assert.strictEqual(r2.assignments[1].buddyId, 1);
});

test('rotation: 1-member team returns empty', () => {
  const ONE = [{ id: 1, name: 'A' }];
  const { assignments } = generateAssignments(ONE, 0);
  assert.deepStrictEqual(assignments, []);
});

test('rotation: rejects invalid inputs', () => {
  assert.throws(() => generateAssignments(null, 0), TypeError);
  assert.throws(() => generateAssignments(MEMBERS, -1), RangeError);
  assert.throws(() => generateAssignments(MEMBERS, 1.5), RangeError);
});

test('formatDateRange: formats as "Mon D – Mon D"', () => {
  assert.strictEqual(formatDateRange('2026-07-24', '2026-08-07'), 'Jul 24 – Aug 7');
});

test('formatSlackText: produces the expected plaintext', () => {
  const out = formatSlackText(
    { name: 'Sprint 7', start_date: '2026-07-24', end_date: '2026-08-07' },
    [
      { memberName: 'Alice', buddyName: 'Bob' },
      { memberName: 'Bob', buddyName: 'Charlie' },
      { memberName: 'Charlie', buddyName: 'Alice' },
    ],
  );
  const expected = [
    '📋 Sprint 7 — Quality Buddies',
    '📅 Jul 24 – Aug 7',
    '',
    "Alice's buddy: Bob",
    "Bob's buddy: Charlie",
    "Charlie's buddy: Alice",
  ].join('\n');
  assert.strictEqual(out, expected);
});
