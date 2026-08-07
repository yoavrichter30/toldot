import { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { listEras, createSession, EraMeta } from '../api/game';

export function EraSelector() {
  const { dispatch } = useGame();
  const [eras, setEras] = useState<EraMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listEras()
      .then(setEras)
      .catch(() => setEras([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = async (era: EraMeta) => {
    setLoading(true);
    try {
      const result = await createSession(era.id);
      dispatch({ type: 'NEW_SESSION', sessionId: result.session.id, eraId: era.id });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create session';
      dispatch({ type: 'SET_ERROR', error: message });
    }
  };

  if (loading) return <div>Loading eras...</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: 600, margin: '0 auto' }}>
      <h2>Choose an Era</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
        {eras.map(era => (
          <button
            key={era.id}
            onClick={() => handleSelect(era)}
            style={{
              padding: '1rem',
              textAlign: 'left',
              cursor: 'pointer',
              border: '1px solid #ccc',
              borderRadius: 8,
              background: '#f9f9f9',
            }}
          >
            <strong>{era.title}</strong>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>
              {era.startDate} — {era.endDate} | {era.maxTurns} turns
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}