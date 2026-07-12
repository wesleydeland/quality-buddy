import { formatDateRange } from '../format.js';
import { api } from '../api.js';
import SlackCopyButton from './SlackCopyButton.jsx';
import ImageCopyButton from './ImageCopyButton.jsx';

export default function CurrentSprintView({ sprint, onDeleted, showToast }) {
  if (!sprint) {
    return (
      <section className="card">
        <h2>Current Sprint</h2>
        <p className="empty">No sprints yet. Generate one to get started.</p>
      </section>
    );
  }

  async function handleDelete() {
    if (!confirm(`Delete ${sprint.name}? This cannot be undone.`)) return;
    await api.deleteSprint(sprint.id);
    onDeleted();
  }

  return (
    <section className="card highlight">
      <header className="sprint-header">
        <div>
          <h2>{sprint.name}</h2>
          <p className="dates">{formatDateRange(sprint.start_date, sprint.end_date)}</p>
        </div>
        <div className="sprint-actions">
          <SlackCopyButton sprint={sprint} assignments={sprint.assignments} />
          <ImageCopyButton
            sprint={sprint}
            assignments={sprint.assignments}
            onError={showToast}
          />
          <button onClick={handleDelete} className="danger" title="Delete sprint">
            Delete
          </button>
        </div>
      </header>
      <ul className="assignments">
        {sprint.assignments.map((a) => (
          <li key={a.id} className="assignment-row">
            <div className="assignment-developer">
              <span className="role-label">Developer</span>
              <span className="name">{a.member_name}</span>
            </div>
            <span className="assignment-sep" aria-hidden="true">→</span>
            <div className="assignment-buddy">
              <span className="role-label">Quality Buddy</span>
              <span className="name">{a.buddy_name}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
