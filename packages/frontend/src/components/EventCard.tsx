import { EventChoice } from '../api/game';

interface Props {
  event: {
    id: string;
    title: string;
    description: string;
    choices?: EventChoice[];
  };
  onChoice?: (eventId: string, choiceKey: string) => void;
}

export function EventCard({ event, onChoice }: Props) {
  return (
    <div style={{
      padding: '1rem', margin: '1rem 0', background: '#fffde7',
      border: '1px solid #ffe082', borderRadius: 8,
    }}>
      <h4 style={{ margin: '0 0 0.5rem' }}>{event.title}</h4>
      <p style={{ margin: '0 0 0.75rem', color: '#555' }}>{event.description}</p>
      {event.choices && onChoice && (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {event.choices.map(c => (
            <button
              key={c.key}
              onClick={() => onChoice(event.id, c.key)}
              style={{ padding: '0.4rem 0.8rem', cursor: 'pointer' }}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}