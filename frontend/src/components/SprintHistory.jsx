import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { formatDateRange } from '../format.js';
import SlackCopyButton from './SlackCopyButton.jsx';

export default function SprintHistory({ refreshSignal }) {
  const [sprints, setSprints] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSignal]);

  async function refresh() {
    try {
      const data = await api.listSprints();
      setSprints(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggle(id) {
    if (openId === id) {
      setOpenId(null);
      setDetail(null);
      return;
    }
    setOpenId(id);
    try {
      setDetail(await api.getSprint(id));
    } catch (err) {
      setError(err.message);
    }
  }

  if (sprints.length === 0) return null;

  return (
    <section className="card">
      <h2>Sprint History</h2>
      {error && <p className="error">{error}</p>}
      <ul className="history-list">
        {sprints.map((s) => (
          <li key={s.id}>
            <button className="history-toggle" onClick={() => toggle(s.id)}>
              <span className="history-name">{s.name}</span>
              <span className="history-dates">
                {formatDateRange(s.start_date, s.end_date)}
              </span>
              <span className="chev">{openId === s.id ? '▾' : '▸'}</span>
            </button>
            {openId === s.id && detail && (
              <div className="history-detail">
                <ul className="assignments compact">
                  {detail.assignments.map((a) => (
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
                <SlackCopyButton sprint={detail} assignments={detail.assignments} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
