
import type { Event, WorldState } from '../../engine/types.ts';
import type { GameEngine } from '../../engine/engine.ts';

/**
 * Records a single game event to a persistent ledger.
 * TODO: Implement connection to a backend or local storage.
 */
export function recordEvent(e: Event): void {
  console.log('[PMM] Recording event:', e);
  // This is a no-op for now.
}

/**
 * Takes a complete snapshot of the current game state.
 * TODO: Implement serialization and storage.
 */
export function snapshot(engine: GameEngine): { worldState: WorldState; history: Event[]; digest: string } {
  const data = {
    worldState: engine.getState(),
    history: engine.getHistory(),
    digest: engine.getDigest(),
  };
  console.log('[PMM] Taking snapshot:', data);
  // This is a no-op for now.
  return data;
}
