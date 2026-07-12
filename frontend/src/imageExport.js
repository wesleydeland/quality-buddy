// Renders a clean, Slack-friendly table of assignments to a canvas,
// then exports it as a PNG blob ready for the clipboard or download.

/**
 * @param {Object} sprint   - {name, start_date, end_date}
 * @param {Array}  assignments - [{member_name, buddy_name, ...}]
 * @returns {Promise<Blob>}   - PNG blob
 */
export async function renderAssignmentsToPng(sprint, assignments) {
  const canvas = renderToCanvas(sprint, assignments);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('Failed to encode PNG'));
      resolve(blob);
    }, 'image/png');
  });
}

/**
 * Same as above, but returns a data URL (useful for <img src=...> previews).
 */
export function renderAssignmentsToDataUrl(sprint, assignments) {
  return renderToCanvas(sprint, assignments).toDataURL('image/png');
}

// --- internals ---

function renderToCanvas(sprint, assignments) {
  const W = 720;
  const PAD = 32;
  const ROW_H = 56;
  const HEADER_H = 96;       // title + date
  const FOOTER_H = 24;       // bottom margin
  const H = HEADER_H + assignments.length * ROW_H + FOOTER_H;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Background — white, like a Slack-friendly image
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // Title
  ctx.fillStyle = '#0f1115';
  ctx.font = '700 24px -apple-system, "Segoe UI", Roboto, sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText(`📋 ${sprint.name} — Quality Buddies`, PAD, 24);

  // Date
  ctx.fillStyle = '#6b7280';
  ctx.font = '400 14px -apple-system, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`📅 ${formatDateRange(sprint.start_date, sprint.end_date)}`, PAD, 56);

  // Divider
  ctx.fillStyle = '#e5e7eb';
  ctx.fillRect(PAD, HEADER_H - 8, W - 2 * PAD, 1);

  // Column layout
  const leftX = PAD;
  const rightX = W - PAD;
  const centerX = W / 2;
  const colWidth = (W - 2 * PAD) / 2;

  assignments.forEach((a, i) => {
    const y = HEADER_H + i * ROW_H;

    // Row separator
    if (i > 0) {
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(PAD, y - 1, W - 2 * PAD, 1);
    }

    // "DEVELOPER" / "QUALITY BUDDY" labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '600 11px -apple-system, "Segoe UI", Roboto, sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText('DEVELOPER', leftX, y + 8);
    ctx.fillText('QUALITY BUDDY', centerX + 8, y + 8);

    // Names
    ctx.fillStyle = '#0f1115';
    ctx.font = '600 18px -apple-system, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(a.member_name, leftX, y + 26);

    ctx.fillStyle = '#5b8cff';  // accent blue for the buddy
    ctx.fillText(a.buddy_name, centerX + 8, y + 26);

    // Arrow in the middle column
    ctx.fillStyle = '#5b8cff';
    ctx.font = '600 18px -apple-system, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('→', centerX - colWidth / 2 + 8, y + 28);
    ctx.textAlign = 'left';
  });

  return canvas;
}

function formatDateRange(start, end) {
  const fmt = (iso) => {
    const d = new Date(iso + 'T00:00:00Z');
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  };
  return `${fmt(start)} – ${fmt(end)}`;
}
