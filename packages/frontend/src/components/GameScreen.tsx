import { useEffect, useRef, useState } from 'react';
import { useGame } from '../context/GameContext';
import { processTurn } from '../api/game';
import { ChatThread } from './ChatThread';
import { MetricsBar } from './MetricsBar';
import { ActionInput } from './ActionInput';
import { ObjectivesPanel } from './ObjectivesPanel';
import { ResourcePanel } from './ResourcePanel';
import { CohortPanel } from './CohortPanel';
import { ProjectPanel } from './ProjectPanel';
import { GameOverScreen } from './GameOverScreen';
import { ErrorBanner } from './Status';
import { JournalView } from './JournalView';
import { MapPanel } from './MapPanel';

interface LocationInfo {
  id: string;
  name: string;
  description: string;
  housing: number;
  water: number;
  health: number;
  founded: number;
  type: string;
}

const ERA_LOCATIONS: LocationInfo[] = [
  { id: 'jaffa', name: 'Jaffa', description: "The ancient port where most newcomers first set foot in the Land of Israel. Its harbor and markets are the Yishuv's lifeline to the wider world.", housing: 80, water: 80, health: 60, founded: 0, type: 'port_city' },
  { id: 'petah_tikva', name: 'Petah Tikva', description: "The 'Mother of the Moshavot' — the first of the modern agricultural settlements, founded in 1878. Its orchards anchor the coastal plain.", housing: 50, water: 30, health: 35, founded: 1878, type: 'moshava' },
  { id: 'rishon_lezion', name: 'Rishon LeZion', description: "Founded in 1882 by the Bilu pioneers. Home of the first Hebrew school and kindergarten, and the great Carmel winery.", housing: 55, water: 40, health: 40, founded: 1882, type: 'moshava' },
  { id: 'rehovot', name: 'Rehovot', description: "Founded in 1890 on the coastal plain. Known for its citrus and almond orchards and an early Hebrew cultural life.", housing: 45, water: 35, health: 40, founded: 1890, type: 'moshava' },
  { id: 'zikhron_yaakov', name: "Zikhron Ya'akov", description: "Founded in 1882 under the patronage of Baron Rothschild. A wine-producing moshava on the slopes of Mount Carmel.", housing: 50, water: 35, health: 40, founded: 1882, type: 'moshava' },
  { id: 'hadera', name: 'Hadera', description: "Founded in 1891 on swampy ground. Malaria haunted its early settlers until the marshes were finally drained.", housing: 30, water: 15, health: 20, founded: 1891, type: 'moshava' },
  { id: 'kfar_saba', name: 'Kfar Saba', description: "A small moshava founded in 1903. Its first years were hard — isolated, marshy, and short of water.", housing: 8, water: 5, health: 15, founded: 1903, type: 'moshava' },
  { id: 'sejera', name: 'Sejera (Ilaniya)', description: "A training farm founded in 1899 in the Lower Galilee. Its fields trained the guards of Bar Giora and Hashomer.", housing: 25, water: 30, health: 35, founded: 1899, type: 'training_farm' },
  { id: 'metulla', name: 'Metulla', description: "The northernmost settlement, founded in 1896 at the foot of the mountains. A frontier outpost looking over the Hula Valley.", housing: 25, water: 25, health: 30, founded: 1896, type: 'moshava' },
  { id: 'degamia', name: 'Degania', description: "The first kvutza (communal settlement), founded in 1909 south of the Sea of Galilee. Its collective ideal shaped the Labor movement.", housing: 0, water: 0, health: 0, founded: 1909, type: 'training_farm' },
  { id: 'rosh_pinna', name: 'Rosh Pinna', description: "Founded in 1882 in the Upper Galilee by pioneers from Romania. A hilltop moshava overlooking the Hula Valley.", housing: 40, water: 30, health: 35, founded: 1882, type: 'moshava' },
];

export function GameScreen() {
  const { state, dispatch } = useGame();
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [showJournal, setShowJournal] = useState(false);
  const [showMission, setShowMission] = useState(true);
  const [showLedger, setShowLedger] = useState(false);
  const [projectActionText, setProjectActionText] = useState('');
  const openingStarted = useRef(false);

  const activeLocationIds: string[] = [];
  if (state.state?.cohorts) {
    for (const cohort of state.state.cohorts) {
      if (cohort.assignedLocationId) activeLocationIds.push(cohort.assignedLocationId);
    }
  }

  const handleLocationClick = (locationId: string) => {
    setSelectedLocation((prev) => (prev === locationId ? null : locationId));
  };

  useEffect(() => {
    if (openingStarted.current) return;
    if (state.sessionId && state.turn === 0) {
      openingStarted.current = true;
      handleSendEffect('The committee gathers for its first session.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.sessionId]);

  const handleSendEffect = async (action: string) => {
    const sid = state.sessionId;
    if (!sid) return;
    setProjectActionText('');
    dispatch({
      type: 'ADD_MESSAGE',
      message: { id: `player-${Date.now()}`, role: 'player', text: action },
    });
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const result = await processTurn(sid, action);
      dispatch({ type: 'SET_TURN', data: result });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to process turn';
      dispatch({ type: 'SET_ERROR', error: message });
    }
  };

  const handleEventChoice = (eventId: string, choiceKey: string) => {
    const ev = state.events.find((e) => e.id === eventId);
    const choice = ev?.choices?.find((c) => c.key === choiceKey);
    if (choice) {
      handleSendEffect(`I choose: ${choice.label}`);
    }
  };

  if (state.gameOver) return <GameOverScreen />;

  const mapLocations = ERA_LOCATIONS.map((loc) => {
    const live = state.state?.locations.find((l) => l.id === loc.id);
    return {
      ...loc,
      housing: live?.housing ?? loc.housing,
      water: live?.water ?? loc.water,
      health: live?.health ?? loc.health,
    };
  });

  const selectedLocName = selectedLocation
    ? ERA_LOCATIONS.find((l) => l.id === selectedLocation)?.name ?? null
    : null;

  const suggestions = selectedLocName ? [`Build housing in ${selectedLocName}`] : [];

  return (
    <div className="game">
      <header className="game-header">
        <h2>Toldot</h2>
        <div className="turn-info">
          <button className="btn btn-ghost" onClick={() => setShowMission((v) => !v)}>
            Mission
          </button>
          <button className="btn btn-ghost" onClick={() => setShowLedger((v) => !v)}>
            Ledger
          </button>
          <button className="btn btn-ghost" onClick={() => setShowJournal(true)}>
            Journal
          </button>
          <span className="round-indicator">
            Round {state.turn}/{state.maxTurns} · {state.date}
          </span>
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

        <div className="game-chat">
          {state.state && (
            <MetricsBar
              resources={state.state.resources}
              foundationTracks={state.state.foundationTracks}
            />
          )}

          {showMission && (
            <ObjectivesPanel
              goal={state.goal}
              objectives={state.objectives}
              turn={state.turn}
              maxTurns={state.maxTurns}
              date={state.date}
            />
          )}

          <ChatThread
            messages={state.messages}
            pendingEvents={state.events}
            loading={state.loading}
            onChoice={handleEventChoice}
          />

          {showLedger && state.state && (
            <div className="ledger-panel">
              <ResourcePanel
                resources={state.state.resources}
                foundationTracks={state.state.foundationTracks}
              />
              <CohortPanel cohorts={state.state.cohorts} />
              <ProjectPanel
                projects={state.state.projects}
                onStartProject={(name) => setProjectActionText(`Start the ${name} project`)}
              />
            </div>
          )}

          <div className="chat-input-area">
            <ActionInput
              suggestions={suggestions}
              onSend={handleSendEffect}
              disabled={state.loading}
              externalAction={projectActionText}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
