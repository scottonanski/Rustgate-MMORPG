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

const ADAPTER_STORAGE_KEY = 'rg:last-adapter';
const STATUS_STORAGE_KEY = 'rg:adapter-statuses';

const defaultStatuses: Record<LlmAdapterId, { status: ConnectionStatus; details: string }> = {
  ollama: { status: 'unset', details: 'Not tested' },
  openai: { status: 'unset', details: 'Not tested' },
  gemini: { status: 'unset', details: 'Not tested' },
};

const loadStoredStatuses = () => {
  if (typeof window === 'undefined') return defaultStatuses;
  try {
    const raw = window.localStorage.getItem(STATUS_STORAGE_KEY);
    if (!raw) return defaultStatuses;
    const parsed = JSON.parse(raw) as Record<LlmAdapterId, { status: ConnectionStatus; details: string }>;
    return { ...defaultStatuses, ...parsed };
  } catch {
    return defaultStatuses;
  }
};

const loadStoredAdapter = (adapters: LlmAdapter[]): LlmAdapterId | null => {
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem(ADAPTER_STORAGE_KEY) as LlmAdapterId | null;
  if (stored && adapters.some(a => a.id === stored)) {
    return stored;
  }
  return null;
};

export const useUiStore = create<UiState>((set, get) => {
  const adapters = [ollamaAdapter, openaiAdapter, geminiAdapter];
  const initialStatuses = loadStoredStatuses();
  const initialAdapter = loadStoredAdapter(adapters);

  return {
    currentScreen: 'welcome',
    playerName: 'Player',
    adapters,
    selectedAdapterId: initialAdapter,
    adapterStatuses: initialStatuses,
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

      set(state => {
        const updatedStatuses = {
          ...state.adapterStatuses,
          [id]: {
            status: result.isHealthy ? 'success' : 'error',
            details: result.details,
          },
        } as typeof state.adapterStatuses;

        if (result.isHealthy && typeof window !== 'undefined') {
          window.localStorage.setItem(ADAPTER_STORAGE_KEY, id);
          window.localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(updatedStatuses));
        }

        return { adapterStatuses: updatedStatuses };
      });
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
  };
});
