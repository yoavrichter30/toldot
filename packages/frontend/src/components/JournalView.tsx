import { useGame } from '../context/GameContext';

interface Props {
  onClose: () => void;
}

export function JournalView({ onClose }: Props) {
  const { state } = useGame();

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: '#fff',
        borderRadius: 12,
        maxWidth: 600,
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto',
        padding: '1.5rem',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>Historical Journal</h3>
          <button onClick={onClose} style={{ cursor: 'pointer', background: 'none', border: 'none', fontSize: '1.5rem', lineHeight: 1, color: '#666' }}>×</button>
        </div>
        {state.journalNotes.length === 0 ? (
          <p style={{ color: '#999', fontStyle: 'italic' }}>No historical notes recorded yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {state.journalNotes.map((note, i) => (
              <li key={i} style={{
                padding: '0.75rem',
                marginBottom: '0.5rem',
                background: '#f5f0e8',
                borderLeft: '3px solid #8b7355',
                borderRadius: 4,
                lineHeight: 1.5,
                color: '#444',
              }}>{note}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}