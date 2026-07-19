import { useState } from 'react';
import { formatSlackText } from '../format.js';
import posthog from '../posthog.js';

export default function SlackCopyButton({ sprint, assignments }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const text = formatSlackText(sprint, assignments);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for non-secure contexts
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    posthog.capture('slack_assignments_copied', { assignment_count: assignments.length });
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button onClick={copy} className="primary">
      {copied ? '✓ Copied!' : '📋 Copy for Slack'}
    </button>
  );
}
