import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useEffect, useState } from 'react';
import { listSessions, listEras, getSession, SessionMeta, EraMeta } from '../api/game';
import { ErrorBanner, LoadingIndicator, EmptyState } from './Status';

export function HomeScreen() {
  const { dispatch } = useGame();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [eras, setEras] = useState<EraMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [continuing, setContinuing] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listSessions(), listEras()])
      .then(([sessions, eras]) => {
        if (cancelled) return;
        setSessions(sessions);
        setEras(eras);
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

  const era = eras[0];

  return (
    <div className="home">
      <header className="home-hero">
        <h1>Toldot</h1>
        <p className="tagline">
          A living-history adventure where <em>you</em> guide the Yishuv committee.
          A Dungeon Master narrates every round — and the choices are real.
        </p>
      </header>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {loading ? (
        <LoadingIndicator label="Loading…" />
      ) : (
        <>
          {era && (
            <div className="era-hero-card">
              <div className="era-hero-title">{era.title}</div>
              <div className="era-hero-meta">
                {era.startDate} — {era.endDate} · {era.maxTurns} rounds
              </div>
              {era.goal && <div className="era-hero-goal">{era.goal}</div>}
              <button
                className="btn btn-primary btn-lg"
                onClick={() => navigate('/new-game')}
              >
                ⚔️ Begin the Journey
              </button>
            </div>
          )}

          {!era && (
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/new-game')}
            >
              New Game
            </button>
          )}

          <section className="home-sessions">
            <h2>Continue a Saved Journey</h2>
            {sessions.length === 0 ? (
              <EmptyState message="No saved games yet. Begin a new journey to start." />
            ) : (
              <ul className="session-list">
                {sessions.slice(0, 10).map((s) => (
                  <li key={s.id}>
                    <button
                      className="session-item"
                      onClick={() => handleContinue(s)}
                      disabled={continuing === s.id}
                    >
                      <span className="session-era">{s.eraId.replace(/-/g, ' ')}</span>
                      <span className="session-meta">
                        Round {s.currentTurn} · {s.status}
                      </span>
                      {continuing === s.id && <span className="spinner spinner-sm" aria-hidden="true" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
