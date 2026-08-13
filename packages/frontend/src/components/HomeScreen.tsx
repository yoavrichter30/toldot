import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useEffect, useState } from 'react';
import { listSessions, getSession, SessionMeta } from '../api/game';
import { ErrorBanner, LoadingIndicator, EmptyState } from './Status';

export function HomeScreen() {
  const { dispatch } = useGame();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [continuing, setContinuing] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listSessions()
      .then(sessions => {
        if (!cancelled) setSessions(sessions);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load saved games. Make sure the server is running.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleContinue = async (meta: SessionMeta) => {
    setContinuing(meta.id);
    setError(null);
    try {
      const data = await getSession(meta.id as string);
      dispatch({ type: 'LOAD_SESSION', session: data.session });
      navigate(`/game/${meta.id}`);
    } catch {
      setError('Could not load that session. It may have been deleted.');
    } finally {
      setContinuing(null);
    }
  };

  return (
    <div className="home">
      <h1>Toldot</h1>
      <p className="tagline">An educational game through the eras of the Yishuv</p>

      <button
        className="btn btn-primary btn-lg"
        onClick={() => navigate('/new-game')}
      >
        New Game
      </button>

      <section className="home-sessions">
        <h2>Continue Game</h2>
        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
        {loading ? (
          <LoadingIndicator label="Loading saved games…" />
        ) : sessions.length === 0 ? (
          <EmptyState message="No saved games yet. Start a new game to begin." />
        ) : (
          <ul className="session-list">
            {sessions.map(s => (
              <li key={s.id}>
                <button
                  className="session-item"
                  onClick={() => handleContinue(s)}
                  disabled={continuing === s.id}
                >
                  <span className="session-era">{s.eraId}</span>
                  <span className="session-meta">
                    Turn {s.currentTurn} · {s.status}
                  </span>
                  {continuing === s.id && <span className="spinner spinner-sm" aria-hidden="true" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}