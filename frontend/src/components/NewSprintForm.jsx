import { useState } from 'react';
import { api } from '../api.js';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function plusDaysISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function NewSprintForm({ memberCount, onCreated }) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(plusDaysISO(14));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const disabled = memberCount < 2;

  async function submit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Sprint name is required');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const sprint = await api.createSprint({
        name: name.trim(),
        start_date: startDate,
        end_date: endDate,
      });
      setName('');
      onCreated(sprint);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <h2>New Sprint</h2>
      {disabled && (
        <p className="hint">
          Add at least 2 teammates before generating a sprint.
        </p>
      )}
      <form onSubmit={submit} className="sprint-form">
        <label>
          Sprint name
          <input
            type="text"
            placeholder="e.g. Sprint 7"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={busy || disabled}
          />
        </label>
        <label>
          Start date
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={busy || disabled}
          />
        </label>
        <label>
          End date
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={busy || disabled}
          />
        </label>
        <button type="submit" disabled={busy || disabled}>
          {busy ? 'Generating…' : 'Generate Buddies'}
        </button>
        {error && <p className="error">{error}</p>}
      </form>
    </section>
  );
}
