'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');

// Use a separate DB file for tests so dev data is untouched
const TEST_DB = path.join(__dirname, '..', 'data', 'test-quality-buddy.db');
process.env.QB_DB_PATH = TEST_DB;

function freshDb() {
  // Reset the module cache so init.js re-reads the env var
  delete require.cache[require.resolve('../src/db/init')];
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  if (fs.existsSync(TEST_DB + '-wal')) fs.unlinkSync(TEST_DB + '-wal');
  if (fs.existsSync(TEST_DB + '-shm')) fs.unlinkSync(TEST_DB + '-shm');
  return require('../src/db/init');
}

test('members: empty list', () => {
  const { getDb, closeDb } = freshDb();
  const db = getDb();
  const rows = db.prepare('SELECT * FROM team_members').all();
  assert.deepStrictEqual(rows, []);
  closeDb();
});

test('members: insert and list', () => {
  const { getDb, closeDb } = freshDb();
  const db = getDb();
  db.prepare('INSERT INTO team_members (name, sort_order) VALUES (?, ?)').run('Alice', 1);
  db.prepare('INSERT INTO team_members (name, sort_order) VALUES (?, ?)').run('Bob', 2);
  const rows = db.prepare('SELECT * FROM team_members ORDER BY sort_order').all();
  assert.strictEqual(rows.length, 2);
  assert.strictEqual(rows[0].name, 'Alice');
  assert.strictEqual(rows[1].name, 'Bob');
  closeDb();
});

test('members: unique name constraint', () => {
  const { getDb, closeDb } = freshDb();
  const db = getDb();
  const stmt = db.prepare('INSERT INTO team_members (name, sort_order) VALUES (?, ?)');
  stmt.run('Alice', 1);
  assert.throws(() => stmt.run('Alice', 2), /UNIQUE constraint failed/);
  closeDb();
});
