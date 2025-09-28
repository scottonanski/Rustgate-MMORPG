
import { 
  addEvent, 
  getDigest, 
  getHistory, 
  distill, 
  resetMemory 
} from './memory.ts';
import { initializeRules } from './rules.ts';
import { buildPrompt } from './prompts.ts';
import { 
  rustgateFacts, 
  rustgateRulesSummary, 
  createInitialWorldState 
} from './world/rustgate.ts';
import type { 
  EngineConfig, 
  EngineIO, 
  TurnInput, 
  TurnOutput, 
  WorldState, 
  Timer 
} from './types.ts';

// Helper to parse the model's output
function parseNarration(raw: string): { narration: string; options: string[] } {
  const lines = raw.split('\n').filter(line => line.trim() !== '');
  
  const options: string[] = [];
  let narrationLines: string[] = [];
  
  let foundOptions = false;
  for (const line of lines) {
    if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
      foundOptions = true;
      options.push(line.trim().substring(1).trim());
    } else if (!foundOptions) {
      narrationLines.push(line);
    }
  }

  const narration = narrationLines.join('\n').trim();

  if (options.length === 0) {
    return {
      narration: narration || "The world holds its breath, waiting for your next move.",
      options: ['Explore the area', 'Look at your inventory', 'Wait and see what happens'],
    };
  }

  return { narration, options };
}

export function createEngine(io: EngineIO, config?: EngineConfig) {
  let state: WorldState = createInitialWorldState();

  initializeRules(config);
  resetMemory();
  distill(state); // Initial digest

  const advanceTimers = () => {
    const newTimers: Timer[] = [];
    state.timers.forEach(timer => {
      const newTime = timer.turnsRemaining - 1;
      if (newTime > 0) {
        newTimers.push({ ...timer, turnsRemaining: newTime });
      } else {
        // Timer reached zero, create a world event
        addEvent({
          ts: Date.now(),
          actor: 'world',
          action: 'timer_zero',
          details: timer.effectAtZero,
          tags: ['timer', timer.id],
        });
      }
    });
    state.timers = newTimers;
  };

  const runTurn = async (input: TurnInput): Promise<TurnOutput> => {
    addEvent({
      ts: Date.now(),
      actor: 'player',
      action: 'command',
      details: input.command,
    });

    // 1. Resolve mechanics
    advanceTimers();

    // Re-distill memory with the latest state before building the prompt
    distill(state);
    
    // 2. Build prompt
    const prompt = buildPrompt(
      rustgateFacts,
      rustgateRulesSummary,
      getDigest(),
      input.command
    );

    // 3. Call LLM
    const rawNarration = await io.narrate(prompt);
    const { narration, options } = parseNarration(rawNarration);

    // 4. Append event
    addEvent({
      ts: Date.now(),
      actor: 'world',
      action: 'narration',
      details: narration,
      tags: ['llm-response'],
    });

    // 5. Return output
    return { narration, options };
  };

  return {
    getState: () => state,
    setState: (newState: WorldState) => { state = newState; },
    runTurn,
    getDigest,
    getHistory,
    reset: () => {
      state = createInitialWorldState();
      resetMemory();
      distill(state);
    },
  };
}

export type GameEngine = ReturnType<typeof createEngine>;