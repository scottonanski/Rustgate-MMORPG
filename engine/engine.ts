
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

const DEFAULT_OPTIONS = ['look around', 'talk', 'move'];

const clampNarration = (text: string): string => {
  const paragraphs = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  const combined = paragraphs.join(' ');
  const sentences = combined.match(/[^.!?]+[.!?]?/g) ?? [];

  let wordTotal = 0;
  const kept: string[] = [];

  for (const rawSentence of sentences) {
    const sentence = rawSentence.trim();
    if (!sentence) continue;
    const sentenceWords = sentence.split(/\s+/).filter(Boolean).length;
    if (wordTotal + sentenceWords > 120) {
      if (kept.length === 0) {
        kept.push(sentence);
      }
      break;
    }
    kept.push(sentence);
    wordTotal += sentenceWords;
  }

  const result = (kept.length > 0 ? kept.join(' ') : combined).replace(/\s+/g, ' ').trim();
  return result;
};

const extractBulletSegments = (line: string): string[] => {
  const pattern = /(?:^|\s)(?:-|•|\d+\.)\s*/g;
  const segments: string[] = [];
  let match: RegExpExecArray | null;
  let currentStart: number | null = null;

  while ((match = pattern.exec(line)) !== null) {
    const startIndex = match.index + match[0].length;
    if (currentStart !== null) {
      const optionText = line.slice(currentStart, match.index).trim();
      if (optionText) segments.push(optionText);
    }
    currentStart = startIndex;
  }

  if (currentStart !== null) {
    const optionText = line.slice(currentStart).trim();
    if (optionText) segments.push(optionText);
  }

  return segments;
};

const normaliseOptions = (candidates: string[]): string[] => {
  const unique: string[] = [];
  const seen = new Set<string>();

  candidates.forEach(candidate => {
    const cleaned = candidate.replace(/\s+/g, ' ').trim().replace(/[.;:,\s]+$/g, '').trim();
    if (!cleaned) return;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    unique.push(cleaned);
  });

  if (unique.length >= 3) {
    return unique.slice(0, 5);
  }
  return [...DEFAULT_OPTIONS];
};

// Helper to parse the model's output
function parseNarration(raw: string): { narration: string; options: string[] } {
  const lines = raw.split('\n');

  const narrationParts: string[] = [];
  const optionCandidates: string[] = [];

  let foundOptions = false;
  for (const originalLine of lines) {
    const trimmed = originalLine.trim();
    if (!trimmed) continue;

    const bulletSegments = extractBulletSegments(trimmed);
    if (bulletSegments.length > 0) {
      foundOptions = true;
      optionCandidates.push(...bulletSegments);
      continue;
    }

    if (foundOptions && optionCandidates.length > 0) {
      const lastIndex = optionCandidates.length - 1;
      optionCandidates[lastIndex] = `${optionCandidates[lastIndex]} ${trimmed}`.trim();
      continue;
    }

    narrationParts.push(trimmed);
  }

  const narrationRaw = narrationParts.join(' ');
  const narration = clampNarration(narrationRaw);  
  const options = normaliseOptions(optionCandidates);

  if (!narration) {
    return {
      narration: 'The world holds its breath, waiting for your next move.',
      options,
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
