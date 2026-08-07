import { useState } from 'react';

interface Props {
  suggestions: string[];
  onSend: (action: string) => void;
  disabled: boolean;
}

export function ActionInput({ suggestions, onSend, disabled }: Props) {
  const [action, setAction] = useState('');

  const handleSubmit = () => {
    if (!action.trim() || disabled) return;
    onSend(action.trim());
    setAction('');
  };

  return (
    <div>
      {suggestions.length > 0 && (
        <div style={{ marginBottom: '0.5rem' }}>
          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.3rem' }}>Suggested actions:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => setAction(s)}
                disabled={disabled}
                style={{
                  padding: '0.3rem 0.6rem', fontSize: '0.85rem', cursor: 'pointer',
                  background: '#e3f2fd', border: '1px solid #90caf9', borderRadius: 4,
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          value={action}
          onChange={e => setAction(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          disabled={disabled}
          placeholder="Type your action..."
          style={{ flex: 1, padding: '0.5rem', borderRadius: 4, border: '1px solid #ccc' }}
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !action.trim()}
          style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
        >
          {disabled ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}