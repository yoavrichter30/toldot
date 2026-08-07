import { useEffect, useRef, useState } from 'react';
import { useGame } from '../context/GameContext';
import { processTurn, getSession, SpawnedEvent } from '../api/game';
import { DMNarrative } from './DMNarrative';
import { ResourcePanel } from './ResourcePanel';
import { ActionInput } from './ActionInput';
import { EventCard } from './EventCard';
import { GameOverScreen } from './GameOverScreen';

export function GameScreen() {
  const { state, dispatch } = useGame();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [events, setEvents] = useState<SpawnedEvent[]>([]);
  const openingStarted = useRef(false);

  const handleSend = async (action: string) => {
    if (!state.sessionId) return;
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const result = await processTurn(state.sessionId, action);
      dispatch({ type: 'SET_TURN', data: result });
      setSuggestions(result.historicalNotes.length > 0 ? ['What would you like to know more about?'] : []);
      setEvents(result.events || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to process turn';
      dispatch({ type: 'SET_ERROR', error: message });
    }
  };

  const handleEventChoice = (eventId: string, choiceKey: string) => {
    // Record the choice by removing the resolved event
    setEvents(prev => prev.filter(ev => ev.id !== eventId));
    console.log(`Event ${eventId} resolved with choice: ${choiceKey}`);
  };

  useEffect(() => {
    if (openingStarted.current) return;
    if (state.sessionId && state.turn === 0) {
      openingStarted.current = true;
      getSession(state.sessionId).then(data => {
        if (data.session) {
          // Generate initial DM vignette
          handleSend('The committee begins its work.');
        }
      }).catch(() => {
        openingStarted.current = false;
      });
    }
  }, [state.sessionId, state.turn, handleSend]);

  if (state.gameOver) return <GameOverScreen />;

  return (
    <div style={{ padding: '1rem', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0 }}>Toldot</h2>
        <div style={{ color: '#666', fontSize: '0.9rem' }}>
          Turn {state.turn}/{state.maxTurns} | {state.date}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
        {/* Left: narrative + actions */}
        <div>
          <DMNarrative narration={state.narration} historicalNotes={state.historicalNotes} />
          {events.map((ev, i) => (
            <EventCard key={ev?.id ?? i} event={ev} onChoice={handleEventChoice} />
          ))}
          <div style={{ marginTop: '1rem' }}>
            <ActionInput suggestions={suggestions} onSend={handleSend} disabled={state.loading} />
          </div>
          {state.loading && <div style={{ marginTop: '0.5rem', color: '#666' }}>The DM is thinking...</div>}
          {state.error && <div style={{ marginTop: '0.5rem', color: '#f44336' }}>{state.error}</div>}
        </div>

        {/* Right: resources */}
        {state.state && (
          <div>
            <ResourcePanel
              resources={state.state.resources}
              foundationTracks={state.state.foundationTracks}
            />
          </div>
        )}
      </div>
    </div>
  );
}