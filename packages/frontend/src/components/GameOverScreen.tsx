import { useGame } from '../context/GameContext';

export function GameOverScreen() {
  const { state, dispatch } = useGame();
  const outcomeLabels: Record<string, { label: string; color: string }> = {
    won: { label: 'Victory', color: '#4caf50' },
    lost: { label: 'Defeat', color: '#c62828' },
  };
  const info = outcomeLabels[state.outcome ?? ''] ?? { label: 'Game Over', color: '#6f6a5e' };

  return (
    <div className="game-over">
      <h1 style={{ color: info.color }}>{info.label}</h1>
      <p className="outcome-text">
        {state.outcome === 'won'
          ? 'The Yishuv continues to grow and develop. Your committee has laid the foundations for the future.'
          : 'The community has collapsed. The challenges of the era proved too great.'}
      </p>
      <p className="turn-line">
        Turn {state.turn} of {state.maxTurns} completed
      </p>
      <button
        className="btn btn-primary btn-lg"
        onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'home' })}
      >
        Back to Menu
      </button>
    </div>
  );
}