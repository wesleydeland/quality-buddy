'use strict';

const express = require('express');
const { getDb } = require('../db/init');
const { generateAssignments, formatSlackText } = require('../rotation');
const { captureServerEvent } = require('../posthog');

const router = express.Router();

function loadMembers(db) {
  return db
    .prepare('SELECT id, name FROM team_members ORDER BY sort_order, id')
    .all();
}

function loadSprintWithAssignments(db, sprintId) {
  const sprint = db
    .prepare('SELECT * FROM sprints WHERE id = ?')
    .get(sprintId);
  if (!sprint) return null;
  const assignments = db
    .prepare(
      `SELECT a.id, a.member_id, a.buddy_id,
              m.name AS member_name, b.name AS buddy_name
       FROM assignments a
       JOIN team_members m ON m.id = a.member_id
       JOIN team_members b ON b.id = a.buddy_id
       WHERE a.sprint_id = ?
       ORDER BY m.sort_order, m.id`,
    )
    .all(sprintId);
  return { ...sprint, assignments };
}

router.get('/', (req, res) => {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM sprints ORDER BY start_date DESC, id DESC')
    .all();
  res.json(rows);
});

router.get('/current', (req, res) => {
  const db = getDb();
  // "Current" = the most recently created sprint. The team usually rotates on
  // planning day, so the latest one is what they just generated.
  const latest = db
    .prepare('SELECT id FROM sprints ORDER BY id DESC LIMIT 1')
    .get();
  if (!latest) {
    return res.status(404).json({ error: 'No sprints yet' });
  }
  res.json(loadSprintWithAssignments(db, latest.id));
});

router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'invalid id' });
  }
  const db = getDb();
  const data = loadSprintWithAssignments(db, id);
  if (!data) return res.status(404).json({ error: 'sprint not found' });
  res.json(data);
});

router.post('/', (req, res) => {
  const body = req.body || {};
  const name = (body.name || '').trim();
  const start_date = (body.start_date || '').trim();
  const end_date = (body.end_date || '').trim();
  if (!name || !start_date || !end_date) {
    return res
      .status(400)
      .json({ error: 'name, start_date, and end_date are required' });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start_date) || !/^\d{4}-\d{2}-\d{2}$/.test(end_date)) {
    return res.status(400).json({ error: 'dates must be YYYY-MM-DD' });
  }
  const db = getDb();
  const members = loadMembers(db);
  if (members.length < 2) {
    return res.status(400).json({ error: 'Need at least 2 team members to create a sprint' });
  }
  const prev = db
    .prepare('SELECT rotation_offset FROM sprints ORDER BY id DESC LIMIT 1')
    .get();
  const prevOffset = prev ? prev.rotation_offset : 0;
  const { offset, assignments } = generateAssignments(members, prevOffset);

  let sprintId;
  try {
    const txn = db.transaction(() => {
      const result = db
        .prepare(
          'INSERT INTO sprints (name, start_date, end_date, rotation_offset) VALUES (?, ?, ?, ?)',
        )
        .run(name, start_date, end_date, offset);
      sprintId = Number(result.lastInsertRowid);
      const ins = db.prepare(
        'INSERT INTO assignments (sprint_id, member_id, buddy_id) VALUES (?, ?, ?)',
      );
      for (const a of assignments) ins.run(sprintId, a.memberId, a.buddyId);
    });
    txn();
  } catch (err) {
    if (String(err.message).includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'A sprint with that name already exists' });
    }
    throw err;
  }
  const sprint = loadSprintWithAssignments(db, sprintId);
  captureServerEvent(req, 'sprint_created_server', {
    assignment_count: sprint.assignments.length,
  });
  res.status(201).json(sprint);
});

router.get('/:id/slack', (req, res) => {
  const id = Number(req.params.id);
  const db = getDb();
  const data = loadSprintWithAssignments(db, id);
  if (!data) return res.status(404).json({ error: 'sprint not found' });
  const rows = data.assignments.map((a) => ({
    memberName: a.member_name,
    buddyName: a.buddy_name,
  }));
  const text = formatSlackText(data, rows);
  res.type('text/plain').send(text);
});

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'invalid id' });
  }
  const db = getDb();
  const exists = db.prepare('SELECT id FROM sprints WHERE id = ?').get(id);
  if (!exists) return res.status(404).json({ error: 'sprint not found' });
  db.prepare('DELETE FROM sprints WHERE id = ?').run(id);
  res.status(204).end();
});

module.exports = router;
