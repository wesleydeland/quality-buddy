export function formatDateRange(start, end) {
  const fmt = (iso) => {
    const d = new Date(iso + 'T00:00:00Z');
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  };
  return `${fmt(start)} – ${fmt(end)}`;
}

export function formatSlackText(sprint, assignments) {
  const lines = [
    `📋 ${sprint.name} — Quality Buddies`,
    `📅 ${formatDateRange(sprint.start_date, sprint.end_date)}`,
    '',
  ];
  for (const a of assignments) {
    lines.push(`${a.member_name} → ${a.buddy_name}`);
  }
  return lines.join('\n');
}
