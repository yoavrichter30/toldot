import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { listEras, createSession, EraMeta } from '../api/game';
import { ErrorBanner, LoadingIndicator, EmptyState } from './Status';

export function EraSelector() {
  const { dispatch } = useGame();
  const navigate = useNavigate();
  const [eras, setEras] = useState<EraMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listEras()
      .then(eras => {
        if (!cancelled) setEras(eras);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load eras. Make sure the server is running.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSelect = async (era: EraMeta) => {
    if (creating) return;
    setCreating(true);
    setError(null);
    try {
      const result = await createSession(era.id);
      dispatch({ type: 'NEW_SESSION', sessionId: result.session.id, eraId: era.id });
      navigate(`/game/${result.session.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create session';
      setError(message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="page">
      <button className="btn btn-ghost" onClick={() => navigate('/')}>
        &larr; Back
      </button>
      <h1>Choose an Era</h1>
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
      {loading ? (
        <LoadingIndicator label="Loading eras…" />
      ) : eras.length === 0 ? (
        <EmptyState message="No eras available." />
      ) : creating ? (
        <LoadingIndicator label="Forging your journey…" />
      ) : (
        <div className="era-list">
          {eras.map(era => (
            <button
              key={era.id}
              className="card era-card"
              onClick={() => handleSelect(era)}
              disabled={creating}
            >
              <span className="era-title">{era.title}</span>
              <span className="era-meta">
                {era.startDate} — {era.endDate} · {era.maxTurns} rounds
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}