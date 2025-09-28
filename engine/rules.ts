
import type { EngineConfig } from './types.ts';

// Simple seeded PRNG (Pseudo-Random Number Generator)
// Using a Mulberry32 implementation for its simplicity.
function createRNG(seedStr: string = 'default-seed') {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed + seedStr.charCodeAt(i)) | 0;
  }

  return function() {
    seed += 0x6D2B79F5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

let rng = createRNG();

export function initializeRules(config?: EngineConfig) {
    rng = createRNG(config?.rngSeed);
}

type Difficulty = 'easy' | 'risky' | 'hard';
type Outcome = 'success' | 'partial' | 'fail';

export function checkRisk(difficulty: Difficulty): Outcome {
    const roll = rng();
    const thresholds = {
        easy: { success: 0.75, partial: 0.20 }, // 5% fail
        risky: { success: 0.40, partial: 0.40 }, // 20% fail
        hard: { success: 0.15, partial: 0.35 }, // 50% fail
    };

    const diff = thresholds[difficulty];
    if (roll > diff.success) return 'success';
    if (roll > diff.partial) return 'partial';
    return 'fail';
}
