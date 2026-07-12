import { useState } from 'react';
import { renderAssignmentsToPng } from '../imageExport.js';

/**
 * Button that copies the assignments table as a PNG image to the clipboard.
 * Falls back to a download if the browser doesn't allow image writes
 * (e.g., non-secure context, missing Clipboard API support).
 */
export default function ImageCopyButton({ sprint, assignments, onError }) {
  const [state, setState] = useState('idle');  // idle | working | copied | error

  async function copy() {
    setState('working');
    try {
      const blob = await renderAssignmentsToPng(sprint, assignments);

      // Try clipboard first (works in secure contexts: localhost or HTTPS)
      if (
        typeof ClipboardItem !== 'undefined' &&
        navigator.clipboard &&
        typeof navigator.clipboard.write === 'function'
      ) {
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          setState('copied');
          setTimeout(() => setState('idle'), 1800);
          return;
        } catch (err) {
          // Fall through to download
          console.warn('Clipboard image write failed, falling back to download:', err);
        }
      }

      // Fallback: trigger a download
      triggerDownload(blob, `${filenameFor(sprint)}.png`);
      onError?.('Image clipboard isn\'t available here — downloaded instead. Access the app via localhost or HTTPS to enable clipboard copying.');
      setState('error');
      setTimeout(() => setState('idle'), 3500);
    } catch (err) {
      console.error(err);
      onError?.('Couldn\'t generate the image: ' + err.message);
      setState('error');
      setTimeout(() => setState('idle'), 3500);
    }
  }

  const label = {
    idle: '📷 Copy as image',
    working: '⏳ Generating…',
    copied: '✓ Image copied!',
    error: '⚠ Downloaded instead',
  }[state];

  return (
    <button onClick={copy} disabled={state === 'working'}>
      {label}
    </button>
  );
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function filenameFor(sprint) {
  // "Sprint 7" -> "quality-buddy-sprint-7"
  return (
    'quality-buddy-' +
    String(sprint.name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  );
}
