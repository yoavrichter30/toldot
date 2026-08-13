import { useEffect, useRef, useState } from 'react';
import { useGame } from '../context/GameContext';
import { processTurn, SpawnedEvent } from '../api/game';
import { DMNarrative } from './DMNarrative';
import { ResourcePanel } from './ResourcePanel';
import { CohortPanel } from './CohortPanel';
import { ProjectPanel } from './ProjectPanel';
import { ActionInput } from './ActionInput';
import { EventCard } from './EventCard';
import { GameOverScreen } from './GameOverScreen';
import { ErrorBanner, LoadingIndicator } from './Status';
import { JournalView } from './JournalView';
import { MapPanel } from './MapPanel';
import { ObjectivesPanel } from './ObjectivesPanel';

interface LocationInfo {
  id: string;
  name: string;
  housing: number;
  water: number;
  health: number;
  founded: number;
  type: string;
}

const ERA_LOCATIONS: LocationInfo[] = [
  { id: 'jaffa', name: 'Jaffa', housing: 80, water: 80, health: 60, founded: 0, type: 'port_city' },
  { id: 'petah_tikva', name: 'Petah Tikva', housing: 50, water: 30, health: 35, founded: 1878, type: 'moshava' },
  { id: 'rishon_lezion', name: 'Rishon LeZion', housing: 55, water: 40, health: 40, founded: 1882, type: 'moshava' },
  { id: 'rehovot', name: 'Rehovot', housing: 45, water: 35, health: 40, founded: 1890, type: 'moshava' },
  { id: 'zikhron_yaakov', name: "Zikhron Ya'akov", housing: 50, water: 35, health: 40, founded: 1882, type: 'moshava' },
  { id: 'hadera', name: 'Hadera', housing: 30, water: 15, health: 20, founded: 1891, type: 'moshava' },
  { id: 'kfar_saba', name: 'Kfar Saba', housing: 8, water: 5, health: 15, founded: 1903, type: 'moshava' },
  { id: 'sejera', name: 'Sejera (Ilaniya)', housing: 25, water: 30, health: 35, founded: 1899, type: 'training_farm' },
  { id: 'metulla', name: 'Metulla', housing: 25, water: 25, health: 30, founded: 1896, type: 'moshava' },
  { id: 'kinneret_farm', name: 'Kinneret Farm', housing: 5, water: 10, health: 20, founded: 1908, type: 'training_farm' },
  { id: 'degamia', name: 'Degania', housing: 0, water: 0, health: 0, founded: 1909, type: 'training_farm' },
  { id: 'rosh_pinna', name: 'Rosh Pinna', housing: 40, water: 30, health: 35, founded: 1882, type: 'moshava' },
];

export function GameScreen() {
  const { state, dispatch } = useGame();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [events, setEvents] = useState<SpawnedEvent[]>([]);
  const [showJournal, setShowJournal] = useState(false);
  const [projectActionText, setProjectActionText] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const openingStarted = useRef(false);

  const activeLocationIds: string[] = [];
  if (state.state?.cohorts) {
    for (const cohort of state.state.cohorts) {
      if (cohort.assignedLocationId) {
        activeLocationIds.push(cohort.assignedLocationId);
      }
    }
  }

  const handleLocationClick = (locationId: string) => {
    setSelectedLocation((prev) => (prev === locationId ? null : locationId));
  };

  useEffect(() => {
    if (openingStarted.current) return;
    if (state.sessionId && state.turn === 0) {
      openingStarted.current = true;
      // Start the first turn directly
      handleSendEffect('The committee begins its work.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.sessionId]);

  // Separate function for use in effect to avoid stale closure
  const handleSendEffect = async (action: string) => {
    const sid = state.sessionId;
    if (!sid) return;
    setProjectActionText('');
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const result = await processTurn(sid, action);
      dispatch({ type: 'SET_TURN', data: result });
      setSuggestions(
        result.historicalNotes.length > 0 ? ['What would you like to know more about?'] : [],
      );
      setEvents(result.events || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start game';
      dispatch({ type: 'SET_ERROR', error: message });
      openingStarted.current = false;
    }
  };

  const handleEventChoice = (eventId: string, choiceKey: string) => {
    const ev = events.find((e) => e.id === eventId);
    const choice = ev?.choices?.find((c) => c.key === choiceKey);
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    if (choice) {
      handleSendEffect(`I choose: ${choice.label}`);
    }
  };

  if (state.gameOver) return <GameOverScreen />;

  const selectedLocName = selectedLocation
    ? ERA_LOCATIONS.find((l) => l.id === selectedLocation)?.name ?? null
    : null;

  // Merge static location metadata with live game-state values so the map
  // and detail panel reflect current housing/water/health.
  const mapLocations = ERA_LOCATIONS.map((loc) => {
    const live = state.state?.locations.find((l) => l.id === loc.id);
    return {
      ...loc,
      housing: live?.housing ?? loc.housing,
      water: live?.water ?? loc.water,
      health: live?.health ?? loc.health,
    };
  });

  const enhancedSuggestions = selectedLocName
    ? [...suggestions, `Build housing in ${selectedLocName}`]
    : suggestions;

  return (
    <div className="game">
      <header className="game-header">
        <h2>Toldot</h2>
        <div className="turn-info">
          <button className="btn btn-ghost" onClick={() => setShowJournal(true)}>
            📜 Journal
          </button>
          &nbsp;
          Round {state.turn}/{state.maxTurns} &middot; {state.date}
        </div>
      </header>

      {showJournal && <JournalView onClose={() => setShowJournal(false)} />}

      {state.error && (
        <ErrorBanner
          message={state.error}
          onDismiss={() => dispatch({ type: 'SET_ERROR', error: null })}
        />
      )}

      <div className="game-layout game-layout-with-map">
        <section className="game-map">
          <MapPanel
            locations={mapLocations}
            onLocationClick={handleLocationClick}
            selectedLocationId={selectedLocation}
            activeLocationIds={activeLocationIds}
          />
        </section>

        <div className="game-content">
          <main className="game-main">
            <DMNarrative narration={state.narration} historicalNotes={state.historicalNotes} />
            {events.map((ev, i) => (
              <EventCard key={ev?.id ?? i} event={ev} onChoice={handleEventChoice} />
            ))}
            <div className="action-area">
              <ActionInput
                suggestions={enhancedSuggestions}
                onSend={handleSendEffect}
                disabled={state.loading}
                externalAction={projectActionText}
              />
              {state.loading && <LoadingIndicator label="The DM is thinking\u2026" />}
            </div>
          </main>

          <aside className="game-side">
            <ObjectivesPanel
              goal={state.goal}
              objectives={state.objectives}
              turn={state.turn}
              maxTurns={state.maxTurns}
              date={state.date}
            />
            {state.state ? (
              <>
                <ResourcePanel
                  resources={state.state.resources}
                  foundationTracks={state.state.foundationTracks}
                />
                <CohortPanel cohorts={state.state.cohorts} />
                <ProjectPanel
                  projects={state.state.projects}
                  onStartProject={(name) => setProjectActionText(`Start the ${name} project`)}
                />
              </>
            ) : (
              <div className="card skeleton-panel">
                Resources will appear after the first turn.
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
