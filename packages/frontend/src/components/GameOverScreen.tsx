import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

const GRADE_CONFIG: Record<string, { label: string; color: string; message: string }> = {
  gold: { label: 'Gold', color: 'gold', message: 'The Yishuv thrives!' },
  silver: { label: 'Silver', color: 'silver', message: 'The Yishuv grows steadily' },
  bronze: { label: 'Bronze', color: '#cd7f32', message: 'The Yishuv survives' },
  loss: { label: 'Loss', color: 'red', message: 'The community has collapsed' },
};

export function GameOverScreen() {
  const { state } = useGame();
  const navigate = useNavigate();
  const config = GRADE_CONFIG[state.grade ?? ''] ?? { label: 'Game Over', color: '#6f6a5e', message: 'The game is over.' };

  return (
    <div className="game-over">
      <h1 style={{ color: config.color }}>{config.label}</h1>
      <p className="outcome-text">{config.message}</p>
      <p className="turn-line">
        Turn {state.turn} of {state.maxTurns} completed
      </p>
      <button
        className="btn btn-primary btn-lg"
        onClick={() => navigate('/')}
      >
        Back to Menu
      </button>
    </div>
  );
}