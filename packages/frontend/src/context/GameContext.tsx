import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { TurnResponse, SpawnedEvent, SessionData } from '../api/game';

interface GameState {
  sessionId: string | null;
  eraId: string | null;
  turn: number;
  maxTurns: number;
  date: string;
  narration: string;
  historicalNotes: string[];
  journalNotes: string[];
  events: SpawnedEvent[];
  state: TurnResponse['state'] | null;
  gameOver: boolean;
  grade: string | undefined;
  loading: boolean;
  error: string | null;
  goal: string;
  objectives: string[];
}

type GameAction =
  | { type: 'NEW_SESSION'; sessionId: string; eraId: string }
  | { type: 'SET_TURN'; data: TurnResponse }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'LOAD_SESSION'; session: SessionData };

const initialState: GameState = {
  sessionId: null,
  eraId: null,
  turn: 0,
  maxTurns: 126,
  date: '',
  narration: '',
  historicalNotes: [],
  journalNotes: [],
  events: [],
  state: null,
  gameOver: false,
  grade: undefined,
  loading: false,
  error: null,
  goal: '',
  objectives: [],
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'NEW_SESSION':
      return {
        ...state,
        sessionId: action.sessionId,
        eraId: action.eraId,
        turn: 0,
        gameOver: false,
        grade: undefined,
        journalNotes: [],
        goal: '',
        objectives: [],
      };
    case 'SET_TURN':
      return {
        ...state,
        turn: action.data.turn,
        maxTurns: action.data.maxTurns,
        date: action.data.date,
        narration: action.data.narration,
        historicalNotes: action.data.historicalNotes,
        journalNotes: [...state.journalNotes, ...action.data.historicalNotes],
        events: action.data.events,
        state: action.data.state,
        gameOver: action.data.gameOver,
        grade: action.data.grade,
        goal: action.data.goal ?? state.goal,
        objectives: action.data.objectives ?? state.objectives,
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
        turn: session.currentTurn,
        date: session.date,
        state: session.state,
        events: [],
        journalNotes: [],
        gameOver: finished,
        grade: finished ? session.status : undefined,
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
