// Thin fetch wrapper. Throws ApiError on non-2xx with parsed error message.

import posthog from './posthog.js';

const BASE = '/api';

async function request(method, path, body) {
  const opts = {
    method,
    headers: {
      'X-POSTHOG-DISTINCT-ID': posthog.get_distinct_id(),
      'X-POSTHOG-SESSION-ID': posthog.get_session_id(),
    },
  };
  if (body !== undefined) {
    opts.headers['content-type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const r = await fetch(`${BASE}${path}`, opts);
  if (!r.ok) {
    let msg = `${r.status} ${r.statusText}`;
    try {
      const data = await r.json();
      if (data && data.error) msg = data.error;
    } catch (_) { /* ignore */ }
    const error = new ApiError(msg, r.status);
    posthog.captureException(error, { request_method: method, request_path: path });
    throw error;
  }
  if (r.status === 204) return null;
  const ct = r.headers.get('content-type') || '';
  return ct.includes('application/json') ? r.json() : r.text();
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export const api = {
  listMembers: () => request('GET', '/members'),
  addMember: (name) => request('POST', '/members', { name }),
  deleteMember: (id) => request('DELETE', `/members/${id}`),
  reorderMembers: (ordered_ids) => request('PATCH', '/members/reorder', { ordered_ids }),

  listSprints: () => request('GET', '/sprints'),
  currentSprint: () => request('GET', '/sprints/current'),
  getSprint: (id) => request('GET', `/sprints/${id}`),
  createSprint: (data) => request('POST', '/sprints', data),
  deleteSprint: (id) => request('DELETE', `/sprints/${id}`),
  slackText: (id) => request('GET', `/sprints/${id}/slack`),
};
