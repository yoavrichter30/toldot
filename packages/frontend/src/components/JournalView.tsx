import { useGame } from '../context/GameContext';
import { Modal } from './Modal';

interface Props {
  onClose: () => void;
}

export function JournalView({ onClose }: Props) {
  const { state } = useGame();

  const handleExport = () => {
    const lines = [
      'Toldot — Historical Journal',
      state.goal ? `Mission: ${state.goal}` : '',
      '',
      ...state.journalNotes.map((n) => `Round ${n.turn}: ${n.text}`),
    ].filter(Boolean);
    const blob = new Blob([lines.join('\n\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'toldot-journal.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal title="Historical Journal" onClose={onClose}>
      {state.journalNotes.length === 0 ? (
        <p className="empty-state">No historical notes recorded yet. They will appear here as the Dungeon Master reveals what really happened.</p>
      ) : (
        <>
          <button className="btn btn-ghost" onClick={handleExport}>Export as text</button>
          <ul className="journal-list">
            {state.journalNotes.map((note, i) => (
              <li key={i} className="journal-item">
                <span className="journal-turn">Round {note.turn}</span>
                <span className="journal-text">{note.text}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Modal>
  );
}
