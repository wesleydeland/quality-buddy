import { useState } from 'react';
import { api } from '../api.js';
import posthog from '../posthog.js';

export default function AddMemberForm({ onAdded }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const member = await api.addMember(name.trim());
      setName('');
      posthog.capture('team_member_added');
      onAdded(member);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="add-member-form">
      <input
        type="text"
        placeholder="Add a teammate…"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={busy}
        aria-label="Teammate name"
      />
      <button type="submit" disabled={busy || !name.trim()}>
        {busy ? 'Adding…' : 'Add'}
      </button>
      {error && <span className="error">{error}</span>}
    </form>
  );
}
