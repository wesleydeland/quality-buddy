'use strict';

const express = require('express');
const { getDb } = require('../db/init');

const router = express.Router();

function sortOrderForNew(db) {
  const row = db.prepare('SELECT COALESCE(MAX(sort_order), 0) AS m FROM team_members').get();
  return row.m + 1;
}

router.get('/', (req, res) => {
  const db = getDb();
  const rows = db
    .prepare('SELECT id, name, sort_order FROM team_members ORDER BY sort_order, id')
    .all();
  res.json(rows);
});

router.post('/', (req, res) => {
  const name = (req.body && req.body.name || '').trim();
  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }
  const db = getDb();
  try {
    const sort_order = sortOrderForNew(db);
    const result = db
      .prepare('INSERT INTO team_members (name, sort_order) VALUES (?, ?)')
      .run(name, sort_order);
    const row = db
      .prepare('SELECT id, name, sort_order FROM team_members WHERE id = ?')
      .get(result.lastInsertRowid);
    res.status(201).json(row);
  } catch (err) {
    if (String(err.message).includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'A member with that name already exists' });
    }
    throw err;
  }
});

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'invalid id' });
  }
  const db = getDb();
  const member = db.prepare('SELECT id FROM team_members WHERE id = ?').get(id);
  if (!member) {
    return res.status(404).json({ error: 'member not found' });
  }
  const used = db
    .prepare('SELECT 1 FROM assignments WHERE member_id = ? OR buddy_id = ? LIMIT 1')
    .get(id, id);
  if (used) {
    return res
      .status(409)
      .json({ error: 'Cannot delete a member who appears in sprint history' });
  }
  db.prepare('DELETE FROM team_members WHERE id = ?').run(id);
  res.status(204).end();
});

router.patch('/reorder', (req, res) => {
  const ordered_ids = req.body && req.body.ordered_ids;
  if (!Array.isArray(ordered_ids) || !ordered_ids.every(Number.isInteger)) {
    return res.status(400).json({ error: 'ordered_ids must be an array of integers' });
  }
  const db = getDb();
  const existing = db.prepare('SELECT id FROM team_members').all().map((r) => r.id);
  const sameSet =
    existing.length === ordered_ids.length &&
    existing.every((id) => ordered_ids.includes(id));
  if (!sameSet) {
    return res.status(400).json({ error: 'ordered_ids must contain exactly all member ids' });
  }
  const txn = db.transaction((ids) => {
    const stmt = db.prepare('UPDATE team_members SET sort_order = ? WHERE id = ?');
    ids.forEach((id, idx) => stmt.run(idx + 1, id));
  });
  txn(ordered_ids);
  const rows = db
    .prepare('SELECT id, name, sort_order FROM team_members ORDER BY sort_order, id')
    .all();
  res.json(rows);
});

module.exports = router;
