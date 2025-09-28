
import type { Event, WorldState } from './types.ts';
import { rustgatePlaces, rustgateNPCs } from './world/rustgate.ts';

let history: Event[] = [];
let digest: string = 'The story has not yet begun.';

export function getHistory(): Event[] {
  return [...history];
}

export function getDigest(): string {
  return digest;
}

export function addEvent(event: Event) {
  history.push(event);
  // For now, we'll just update the digest every turn.
  // A more complex system might wait N turns.
  distill();
}

export function resetMemory() {
    history = [];
    digest = 'The story has not yet begun.';
}

function findById<T extends {id: string}>(arr: T[], id: string): T | undefined {
    return arr.find(item => item.id === id);
}

// This is a simple distillation function. It creates a bulleted list summary.
// A real implementation would be much more sophisticated, likely using an LLM.
export function distill(state?: WorldState) {
  if (history.length === 0 || !state) {
    digest = 'You have just arrived in Rustgate. The air is thick with the smell of salt and opportunity. What will you do?';
    return;
  }

  const lastPlayerEvent = [...history].reverse().find(e => e.actor === 'player');
  const lastWorldEvent = [...history].reverse().find(e => e.actor === 'world');

  const currentPlace = findById(rustgatePlaces, state.placeId);
  const npcsHere = rustgateNPCs.filter(npc => findById(rustgatePlaces, state.placeId)?.interactions.includes(npc.id));

  const summaryPoints = new Set<string>();

  summaryPoints.add(`You are at the ${currentPlace?.name}. ${currentPlace?.vibe}`);
  if (npcsHere.length > 0) {
      summaryPoints.add(`Nearby, you see ${npcsHere.map(n => n.name).join(', ')}.`);
  }

  if (state.inventory.length > 0) {
    summaryPoints.add(`You are carrying: ${state.inventory.join(', ')}.`);
  } else {
    summaryPoints.add(`Your pockets are empty.`);
  }

  if (state.problemsOpen.length > 0) {
    summaryPoints.add(`You are aware of these problems: ${state.problemsOpen.join(', ')}.`);
  }

  state.timers.forEach(t => {
    summaryPoints.add(`Something is happening soon: ${t.label} (in ${t.turnsRemaining} turns).`);
  });

  if (lastPlayerEvent) {
    summaryPoints.add(`You just tried to: ${lastPlayerEvent.action}.`);
  }
  if (lastWorldEvent) {
    summaryPoints.add(`The result was: ${lastWorldEvent.details.substring(0, 80)}...`);
  }

  digest = Array.from(summaryPoints).map(p => `- ${p}`).join('\n');
}
