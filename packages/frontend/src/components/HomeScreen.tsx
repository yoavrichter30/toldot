import { useGame } from '../context/GameContext';
import { useEffect, useState } from 'react';
import { listSessions, getSession, SessionMeta } from '../api/game';

export function HomeScreen() {
  const { dispatch } = useGame();
  const [sessions, setSessions] = useState<SessionMeta[]>([]);

  useEffect(() => {
    listSessions().then(setSessions).catch(() => {});
  }, []);

  const handleContinue = async (meta: SessionMeta) => {
    try {
      const data = await getSession(meta.id);
      dispatch({ type: 'LOAD_SESSION', session: data.session });
    } catch {
      // silently ignore — session may have been deleted
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
      <h1>Toldot</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        An educational game through the eras of the Yishuv
      </p>
      <button
        onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'new-game' })}
        style={{ padding: '0.75rem 1.5rem', fontSize: '1.1rem', cursor: 'pointer' }}
      >
        New Game
      </button>
      {sessions.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Continue Game</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {sessions.map(s => (
              <li key={s.id} style={{ margin: '0.5rem 0' }}>
                <button
                  onClick={() => handleContinue(s)}
                  style={{ cursor: 'pointer' }}
                >
                  {s.eraId} — Turn {s.currentTurn} ({s.status})
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}