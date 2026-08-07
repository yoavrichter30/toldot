import { useGame } from '../context/GameContext';

export function GameOverScreen() {
  const { state, dispatch } = useGame();
  const outcomeLabels: Record<string, { label: string; color: string }> = {
    won: { label: 'Victory', color: '#4caf50' },
    lost: { label: 'Defeat', color: '#f44336' },
  };
  const info = outcomeLabels[state.outcome ?? ''] ?? { label: 'Game Over', color: '#666' };

  return (
    <div style={{ padding: '2rem', maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{ color: info.color }}>{info.label}</h1>
      <p style={{ color: '#666', margin: '1rem 0' }}>
        {state.outcome === 'won'
          ? 'The Yishuv continues to grow and develop. Your committee has laid the foundations for the future.'
          : 'The community has collapsed. The challenges of the era proved too great.'}
      </p>
      <p>Turn {state.turn} of {state.maxTurns} completed</p>
      <button
        onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'home' })}
        style={{ padding: '0.75rem 1.5rem', cursor: 'pointer', marginTop: '1rem' }}
      >
        Back to Menu
      </button>
    </div>
  );
}