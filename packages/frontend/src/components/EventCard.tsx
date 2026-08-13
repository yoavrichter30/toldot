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
    <div className="card event-card">
      <div className="event-label">⚔️ A decision awaits</div>
      <h4>{event.title}</h4>
      <p>{event.description}</p>
      {event.choices && onChoice && (
        <div className="event-choices">
          {event.choices.map(c => (
            <button key={c.key} className="btn btn-choice" onClick={() => onChoice(event.id, c.key)}>
              {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
