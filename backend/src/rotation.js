'use strict';

/**
 * Generate buddy assignments for a sprint.
 *
 * @param {Array<{id: number, name: string}>} members  Ordered list of team members.
 * @param {number} prevOffset  The offset used in the previous sprint (0 for the first sprint).
 * @returns {{offset: number, assignments: Array<{memberId: number, buddyId: number}>}}
 *
 * Algorithm:
 *   - new offset = (prevOffset + 1) mod N; if 0, bump to 1 (no self-assignment).
 *   - For member at index i, buddy is member at (i + offset) mod N.
 *
 * Invariant: offset never equals 0, and always changes between sprints
 *   (consecutive sprints always produce different pairings for the same team).
 */
function generateAssignments(members, prevOffset) {
  if (!Array.isArray(members)) {
    throw new TypeError('members must be an array');
  }
  const N = members.length;
  if (N < 2) {
    return { offset: 1, assignments: [] };
  }
  if (!Number.isInteger(prevOffset) || prevOffset < 0) {
    throw new RangeError('prevOffset must be a non-negative integer');
  }

  let offset = ((prevOffset % N) + 1) % N;
  if (offset === 0) offset = 1;

  const assignments = members.map((m, i) => ({
    memberId: m.id,
    buddyId: members[(i + offset) % N].id,
  }));

  return { offset, assignments };
}

/**
 * Format a sprint's assignments as Slack-friendly plaintext.
 *
 * @param {{name: string, start_date: string, end_date: string}} sprint
 * @param {Array<{memberName: string, buddyName: string}>} rows
 * @returns {string}
 */
function formatSlackText(sprint, rows) {
  const lines = [
    `📋 ${sprint.name} — Quality Buddies`,
    `📅 ${formatDateRange(sprint.start_date, sprint.end_date)}`,
    '',
  ];
  for (const r of rows) {
    lines.push(`${r.memberName} → ${r.buddyName}`);
  }
  return lines.join('\n');
}

function formatDateRange(startISO, endISO) {
  // YYYY-MM-DD -> "Jul 24 – Aug 7"
  const fmt = (iso) => {
    const d = new Date(iso + 'T00:00:00Z');
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  };
  return `${fmt(startISO)} – ${fmt(endISO)}`;
}

module.exports = { generateAssignments, formatSlackText, formatDateRange };
