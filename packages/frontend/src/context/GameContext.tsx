import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { TurnResponse, SpawnedEvent, SessionData } from '../api/game';

interface GameState {
  screen: 'home' | 'new-game' | 'playing' | 'game-over';
  sessionId: string | null;
  eraId: string | null;
  turn: number;
  maxTurns: number;
  date: string;
  narration: string;
  historicalNotes: string[];
  events: SpawnedEvent[];
  state: TurnResponse['state'] | null;
  gameOver: boolean;
  outcome: string | undefined;
  loading: boolean;
  error: string | null;
}

type GameAction =
  | { type: 'SET_SCREEN'; screen: GameState['screen'] }
  | { type: 'NEW_SESSION'; sessionId: string; eraId: string }
  | { type: 'SET_TURN'; data: TurnResponse }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'LOAD_SESSION'; session: SessionData }
  | { type: 'SET_ERA'; eraId: string };

const initialState: GameState = {
  screen: 'home',
  sessionId: null,
  eraId: null,
  turn: 0,
  maxTurns: 126,
  date: '',
  narration: '',
  historicalNotes: [],
  events: [],
  state: null,
  gameOver: false,
  outcome: undefined,
  loading: false,
  error: null,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, screen: action.screen, error: null };
    case 'NEW_SESSION':
      return { ...state, sessionId: action.sessionId, eraId: action.eraId, screen: 'playing', turn: 0, gameOver: false, outcome: undefined };
    case 'SET_TURN':
      return {
        ...state,
        turn: action.data.turn,
        maxTurns: action.data.maxTurns,
        date: action.data.date,
        narration: action.data.narration,
        historicalNotes: action.data.historicalNotes,
        events: action.data.events,
        state: action.data.state,
        gameOver: action.data.gameOver,
        outcome: action.data.outcome,
        screen: action.data.gameOver ? 'game-over' : 'playing',
        loading: false,
        error: null,
      };
    case 'LOAD_SESSION': {
      const session = action.session;
      const finished = session.status !== 'active';
      return {
        ...state,
        sessionId: session.id,
        eraId: session.eraId,
        screen: finished ? 'game-over' : 'playing',
        turn: session.currentTurn,
        date: session.date,
        state: session.state,
        events: [],
        gameOver: finished,
        outcome: finished ? session.status : undefined,
        loading: false,
        error: null,
      };
    }
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'SET_ERROR':
      return { ...state, error: action.error, loading: false };
    default:
      return state;
  }
}

const GameContext = createContext<{ state: GameState; dispatch: React.Dispatch<GameAction> }>({
  state: initialState,
  dispatch: () => {},
});

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>;
}

export function useGame() {
  return useContext(GameContext);
}