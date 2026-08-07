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
        <div className="suggestions">
          <div className="suggestions-label">Suggested actions:</div>
          <div className="suggestion-chips">
            {suggestions.map((s, i) => (
              <button
                key={i}
                className="suggestion-chip"
                onClick={() => setAction(s)}
                disabled={disabled}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="action-row">
        <input
          className="input"
          value={action}
          onChange={e => setAction(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          disabled={disabled}
          placeholder="Type your action&hellip;"
        />
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={disabled || !action.trim()}
        >
          {disabled ? <span className="spinner spinner-sm" /> : 'Send'}
        </button>
      </div>
    </div>
  );
}