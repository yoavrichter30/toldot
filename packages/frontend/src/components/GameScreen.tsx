import { useEffect, useRef, useState } from 'react';
import { useGame } from '../context/GameContext';
import { processTurn, getSession, SpawnedEvent } from '../api/game';
import { DMNarrative } from './DMNarrative';
import { ResourcePanel } from './ResourcePanel';
import { ActionInput } from './ActionInput';
import { EventCard } from './EventCard';
import { GameOverScreen } from './GameOverScreen';
import { ErrorBanner, LoadingIndicator } from './Status';
import { JournalView } from './JournalView';

export function GameScreen() {
  const { state, dispatch } = useGame();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [events, setEvents] = useState<SpawnedEvent[]>([]);
  const [showJournal, setShowJournal] = useState(false);
  const openingStarted = useRef(false);

  const handleSend = async (action: string) => {
    if (!state.sessionId) return;
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const result = await processTurn(state.sessionId, action);
      dispatch({ type: 'SET_TURN', data: result });
      setSuggestions(
        result.historicalNotes.length > 0 ? ['What would you like to know more about?'] : [],
      );
      setEvents(result.events || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to process turn';
      dispatch({ type: 'SET_ERROR', error: message });
    }
  };

  const handleEventChoice = (eventId: string, choiceKey: string) => {
    setEvents(prev => prev.filter(ev => ev.id !== eventId));
    console.log(`Event ${eventId} resolved with choice: ${choiceKey}`);
  };

  useEffect(() => {
    if (openingStarted.current) return;
    if (state.sessionId && state.turn === 0) {
      openingStarted.current = true;
      getSession(state.sessionId)
        .then(data => {
          if (data.session) {
            handleSend('The committee begins its work.');
          }
        })
        .catch(() => {
          openingStarted.current = false;
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.sessionId, state.turn]);

  if (state.gameOver) return <GameOverScreen />;

  return (
    <div className="game">
      <header className="game-header">
        <h2>Toldot</h2>
        <div className="turn-info">
          <button className="btn btn-ghost" onClick={() => setShowJournal(true)}>
            Journal
          </button>
          &nbsp;
          Turn {state.turn}/{state.maxTurns} &middot; {state.date}
        </div>
      </header>

      {showJournal && <JournalView onClose={() => setShowJournal(false)} />}

      {state.error && (
        <ErrorBanner
          message={state.error}
          onDismiss={() => dispatch({ type: 'SET_ERROR', error: null })}
        />
      )}

      <div className="game-layout">
        <main className="game-main">
          <DMNarrative narration={state.narration} historicalNotes={state.historicalNotes} />
          {events.map((ev, i) => (
            <EventCard key={ev?.id ?? i} event={ev} onChoice={handleEventChoice} />
          ))}
          <div className="action-area">
            <ActionInput
              suggestions={suggestions}
              onSend={handleSend}
              disabled={state.loading}
            />
            {state.loading && <LoadingIndicator label="The DM is thinking\u2026" />}
          </div>
        </main>

        <aside className="game-side">
          {state.state ? (
            <ResourcePanel
              resources={state.state.resources}
              foundationTracks={state.state.foundationTracks}
            />
          ) : (
            <div className="card skeleton-panel">
              Resources will appear after the first turn.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}