import { useEffect, useRef } from 'react';
import { ChatMessage } from '../context/GameContext';
import { SpawnedEvent } from '../api/game';

interface Props {
  messages: ChatMessage[];
  pendingEvents: SpawnedEvent[];
  loading: boolean;
  onChoice: (eventId: string, choiceKey: string) => void;
}

export function ChatThread({ messages, pendingEvents, loading, onChoice }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, pendingEvents.length, loading]);

  if (messages.length === 0 && !loading) {
    return <div className="chat-empty">The Dungeon Master is preparing your journey…</div>;
  }

  return (
    <div className="chat-thread">
      {messages.map((msg) => (
        <div key={msg.id} className={`chat-message chat-${msg.role}`}>
          {msg.role === 'dm' && (
            <div className="chat-avatar" aria-hidden="true">DM</div>
          )}
          <div className="chat-bubble">
            {msg.role === 'dm' && <div className="chat-sender">The Dungeon Master</div>}
            {msg.role === 'player' && <div className="chat-sender">You</div>}
            <div className="chat-text">{msg.text}</div>
            {msg.roll && (
              <div className={`chat-roll ${msg.roll.result >= msg.roll.threshold ? 'chat-roll-success' : 'chat-roll-fail'}`}>
                <span className="roll-label">Roll</span>
                <span className="roll-values">{msg.roll.result} / {msg.roll.threshold}</span>
                {msg.roll.reason && <span className="roll-reason">{msg.roll.reason}</span>}
              </div>
            )}
            {msg.notes && msg.notes.length > 0 && (
              <div className="chat-lore">
                <div className="chat-lore-title">What really happened</div>
                <ul>
                  {msg.notes.map((n, i) => <li key={i}>{n}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Pending decisions on the current turn */}
      {pendingEvents.map((ev) => (
        <div key={ev.id} className="chat-message chat-dm">
          <div className="chat-avatar" aria-hidden="true">?</div>
          <div className="chat-bubble decision-bubble">
            <div className="chat-sender">A decision awaits</div>
            <div className="decision-title">{ev.title}</div>
            <div className="decision-desc">{ev.description}</div>
            {ev.choices && ev.choices.length > 0 && (
              <div className="decision-choices">
                {ev.choices.map((c) => (
                  <button
                    key={c.key}
                    className="btn btn-choice"
                    onClick={() => onChoice(ev.id, c.key)}
                    disabled={loading}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}

      {loading && (
        <div className="chat-message chat-dm">
          <div className="chat-avatar" aria-hidden="true">DM</div>
          <div className="chat-bubble chat-typing">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}
