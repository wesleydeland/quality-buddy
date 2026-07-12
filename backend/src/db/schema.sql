-- Quality Buddy rotation schema

CREATE TABLE IF NOT EXISTS team_members (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sprints (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT    NOT NULL UNIQUE,
  start_date      TEXT    NOT NULL,
  end_date        TEXT    NOT NULL,
  rotation_offset INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT    DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS assignments (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  sprint_id INTEGER NOT NULL,
  member_id INTEGER NOT NULL,
  buddy_id  INTEGER NOT NULL,
  FOREIGN KEY (sprint_id) REFERENCES sprints(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES team_members(id),
  FOREIGN KEY (buddy_id)  REFERENCES team_members(id),
  UNIQUE(sprint_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_assignments_sprint ON assignments(sprint_id);
CREATE INDEX IF NOT EXISTS idx_members_sort ON team_members(sort_order);
