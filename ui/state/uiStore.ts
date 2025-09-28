import { create } from 'zustand';
import type { LlmAdapter, LlmAdapterId } from '../../adapters/llm/base.ts';
import { ollamaAdapter } from '../../adapters/llm/ollama.ts';
import { openaiAdapter } from '../../adapters/llm/openai.ts';
import { geminiAdapter } from '../../adapters/llm/gemini.ts';

export type Screen = 'welcome' | 'play';
export type ConnectionStatus = 'unset' | 'pending' | 'success' | 'error';

export interface ChatMsg {
  id: string;
  sender: 'gm' | 'player';
  text: string;
  ts?: string;
}

interface UiState {
  currentScreen: Screen;
  playerName: string;
  adapters: LlmAdapter[];
  selectedAdapterId: LlmAdapterId | null;
  adapterStatuses: Record<LlmAdapterId, { status: ConnectionStatus; details: string }>;
  messages: ChatMsg[];

  selectAdapter: (id: LlmAdapterId) => void;
  testAdapter: (id: LlmAdapterId) => Promise<void>;
  startGame: () => void;
  addMessage: (message: Omit<ChatMsg, 'id' | 'ts'>) => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  currentScreen: 'welcome',
  playerName: 'Player',
  adapters: [ollamaAdapter, openaiAdapter, geminiAdapter],
  selectedAdapterId: null,
  adapterStatuses: {
    ollama: { status: 'unset', details: 'Not tested' },
    openai: { status: 'unset', details: 'Not tested' },
    gemini: { status: 'unset', details: 'Not tested' },
  },
  messages: [],

  selectAdapter: (id) => set({ selectedAdapterId: id }),

  testAdapter: async (id) => {
    const adapter = get().adapters.find(a => a.id === id);
    if (!adapter) return;

    // When a user tests an adapter, also select it. This is more intuitive.
    set(state => ({
      selectedAdapterId: id,
      adapterStatuses: { ...state.adapterStatuses, [id]: { status: 'pending', details: 'Testing...' } },
    }));

    const result = await adapter.health();
    
    set(state => ({
      adapterStatuses: {
        ...state.adapterStatuses,
        [id]: {
          status: result.isHealthy ? 'success' : 'error',
          details: result.details,
        },
      },
    }));
  },

  startGame: () => {
    if (get().selectedAdapterId) {
      set({ currentScreen: 'play', messages: [] });
    }
  },

  addMessage: (message) => {
    set(state => ({
      messages: [...state.messages, { ...message, id: `${Date.now()}-${Math.random()}`, ts: new Date().toISOString() }],
    }));
  },
}));