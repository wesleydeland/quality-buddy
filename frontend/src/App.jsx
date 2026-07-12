import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from './api.js';
import TeamManager from './components/TeamManager.jsx';
import NewSprintForm from './components/NewSprintForm.jsx';
import CurrentSprintView from './components/CurrentSprintView.jsx';
import SprintHistory from './components/SprintHistory.jsx';

export default function App() {
  const [members, setMembers] = useState([]);
  const [current, setCurrent] = useState(null);
  const [hasSprints, setHasSprints] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState(null);
  const [bootError, setBootError] = useState('');

  const bumpRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const showToast = useCallback((message, kind = 'info') => {
    setToast({ message, kind });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [m, list] = await Promise.all([api.listMembers(), api.listSprints()]);
        setMembers(m);
        setHasSprints(list.length > 0);
        if (list.length > 0) {
          try {
            setCurrent(await api.currentSprint());
          } catch (err) {
            if (!(err instanceof ApiError) || err.status !== 404) throw err;
          }
        }
      } catch (err) {
        setBootError(err.message);
      }
    }
    load();
  }, [refreshKey]);

  function handleSprintCreated(sprint) {
    setCurrent(sprint);
    setHasSprints(true);
    bumpRefresh();
    showToast(`Generated ${sprint.assignments.length} buddy pairs for ${sprint.name}`);
  }

  function handleSprintDeleted() {
    setCurrent(null);
    setHasSprints(false);
    bumpRefresh();
    showToast('Sprint deleted');
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🫱 Quality Buddy</h1>
        <p className="tagline">Rotate your team into a peer reviewer every sprint.</p>
      </header>

      {bootError && <p className="error banner">Couldn't reach API: {bootError}</p>}

      <div className="grid">
        <div className="col-left">
          <CurrentSprintView sprint={current} onDeleted={handleSprintDeleted} />
          <SprintHistory refreshSignal={refreshKey} />
        </div>
        <div className="col-right">
          <NewSprintForm
            memberCount={members.length}
            onCreated={handleSprintCreated}
          />
          <TeamManager refreshSignal={refreshKey} />
        </div>
      </div>

      {toast && <div className={`toast ${toast.kind}`}>{toast.message}</div>}
    </div>
  );
}
