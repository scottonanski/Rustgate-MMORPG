
export interface Place { id: string; name: string; vibe: string; exits: string[]; interactions: string[]; }
export interface Group { id: string; name: string; goal: string; behaviors: string[]; areas: string[]; }
export interface NPC { id: string; name: string; role: string; desire: string; secret: string; lever: string; }
export interface Thing { id: string; name: string; use: string; locationHint: string; }
export interface Problem { id: string; name: string; goal: string; steps: string[]; changeIfSolved: string; }
export interface Timer { id: string; label: string; turnsRemaining: number; effectAtZero: string; }

export interface Event {
  ts: number;
  actor: 'player' | 'world' | 'system';
  action: string;
  details: string;
  tags?: string[];
}

export interface WorldState {
  placeId: string;
  inventory: string[];
  problemsOpen: string[];
  timers: Timer[];
  flags: Record<string, boolean>;
}

export interface EngineConfig {
  rngSeed?: string;
}

export interface Prompt {
  system: string;
  user: string;
}

export interface EngineIO {
  narrate: (prompt: Prompt) => Promise<string>;
}

export interface TurnInput {
  command: string;
}

export interface TurnOutput {
  narration: string;
  options: string[];
}