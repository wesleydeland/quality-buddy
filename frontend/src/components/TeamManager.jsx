import { useEffect, useState } from 'react';
import { api } from '../api.js';
import AddMemberForm from './AddMemberForm.jsx';
import posthog from '../posthog.js';

export default function TeamManager({ refreshSignal }) {
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSignal]);

  async function refresh() {
    try {
      const data = await api.listMembers();
      setMembers(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this teammate?')) return;
    try {
      await api.deleteMember(id);
      posthog.capture('team_member_removed');
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  async function move(id, dir) {
    const idx = members.findIndex((m) => m.id === id);
    if (idx < 0) return;
    const next = idx + dir;
    if (next < 0 || next >= members.length) return;
    const arr = [...members];
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    setMembers(arr);
    try {
      await api.reorderMembers(arr.map((m) => m.id));
      posthog.capture('team_order_updated', { team_size: arr.length });
    } catch (err) {
      setError(err.message);
      refresh();
    }
  }

  return (
    <section className="card">
      <h2>Team</h2>
      <AddMemberForm onAdded={(m) => setMembers((prev) => [...prev, m])} />
      {error && <p className="error">{error}</p>}
      {members.length === 0 ? (
        <p className="empty">No teammates yet. Add at least 2 to start running sprints.</p>
      ) : (
        <ol className="member-list">
          {members.map((m, i) => (
            <li key={m.id}>
              <span className="member-name">{m.name}</span>
              <span className="member-actions">
                <button onClick={() => move(m.id, -1)} disabled={i === 0} title="Move up">
                  ↑
                </button>
                <button
                  onClick={() => move(m.id, 1)}
                  disabled={i === members.length - 1}
                  title="Move down"
                >
                  ↓
                </button>
                <button onClick={() => handleDelete(m.id)} className="danger" title="Delete">
                  ✕
                </button>
              </span>
            </li>
          ))}
        </ol>
      )}
      <p className="hint">The order above is the order used by the rotation algorithm.</p>
    </section>
  );
}
