import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { TurnResponse, SpawnedEvent, SessionData } from '../api/game';

export interface ChatMessage {
  id: string;
  role: 'dm' | 'player';
  text: string;
  notes?: string[];
  events?: SpawnedEvent[];
  roll?: { reason: string; result: number; threshold: number };
}

interface GameState {
  sessionId: string | null;
  eraId: string | null;
  turn: number;
  maxTurns: number;
  date: string;
  messages: ChatMessage[];
  historicalNotes: string[];
  journalNotes: { turn: number; text: string }[];
  events: SpawnedEvent[];
  state: TurnResponse['state'] | null;
  suggestions: string[];
  gameOver: boolean;
  grade: string | undefined;
  epilogue: string;
  loading: boolean;
  error: string | null;
  goal: string;
  objectives: string[];
}

type GameAction =
  | { type: 'NEW_SESSION'; sessionId: string; eraId: string; goal?: string; objectives?: string[] }
  | { type: 'SET_TURN'; data: TurnResponse }
  | { type: 'ADD_MESSAGE'; message: ChatMessage }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'LOAD_SESSION'; session: SessionData };

const OPENING_MESSAGE: ChatMessage = {
  id: 'opening',
  role: 'dm',
  text: 'The year is 1904. The Second Aliyah is underway — thousands of Jewish immigrants from the Russian Empire are landing at Jaffa, fleeing pogroms and poverty. As the coordinating committee of the New Yishuv, you hold the fate of these scattered, fragile settlements in your hands.',
};

const initialState: GameState = {
  sessionId: null,
  eraId: null,
  turn: 0,
  maxTurns: 126,
  date: '',
  messages: [],
  historicalNotes: [],
  journalNotes: [],
  events: [],
  state: null,
  suggestions: [],
  gameOver: false,
  grade: undefined,
  epilogue: '',
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
        epilogue: '',
        journalNotes: [],
        messages: [OPENING_MESSAGE],
        suggestions: [],
        goal: action.goal ?? '',
        objectives: action.objectives ?? [],
      };
    case 'SET_TURN': {
      const dmMessage: ChatMessage = {
        id: `dm-${action.data.turn}`,
        role: 'dm',
        text: action.data.narration,
        notes: action.data.historicalNotes,
        events: action.data.events,
        roll: action.data.roll,
      };
      return {
        ...state,
        turn: action.data.turn,
        maxTurns: action.data.maxTurns,
        date: action.data.date,
        messages: [...state.messages, dmMessage],
        historicalNotes: action.data.historicalNotes,
        journalNotes: action.data.historicalNotes.length > 0
          ? [...state.journalNotes, ...action.data.historicalNotes.map(text => ({ turn: action.data.turn, text }))]
          : state.journalNotes,
        events: action.data.events,
        state: action.data.state,
        suggestions: action.data.suggestedActions ?? [],
        gameOver: action.data.gameOver,
        grade: action.data.grade,
        epilogue: action.data.epilogue ?? '',
        goal: action.data.goal ?? state.goal,
        objectives: action.data.objectives ?? state.objectives,
        loading: false,
        error: null,
      };
    }
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.message] };
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
        messages: [],
        suggestions: [],
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
