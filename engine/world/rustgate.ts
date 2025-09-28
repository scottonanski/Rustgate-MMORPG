
import type { WorldState, Place, Group, NPC, Thing, Problem } from '../types.ts';

export const rustgatePlaces: Place[] = [
  { id: 'docks', name: 'Rustgate Docks', vibe: 'Salty air, creaking wood, shouts of sailors.', exits: ['market'], interactions: ['ships', 'crates', 'water'] },
  { id: 'market', name: 'Rustgate Market', vibe: 'Bustling crowds, smells of spices and fish, chaotic energy.', exits: ['docks', 'watchtower'], interactions: ['stalls', 'merchants', 'crowd'] },
  { id: 'watchtower', name: 'Watchtower Steps', vibe: 'Stone steps leading up a tall tower. Guards eye you suspiciously.', exits: ['market', 'sewers'], interactions: ['guards', 'tower door'] },
  { id: 'sewers', name: 'The Slimy Sewers', vibe: 'Dark, damp, and smells awful. Dripping water echoes.', exits: ['watchtower'], interactions: ['grate', 'shadows', 'rats'] },
];

export const rustgateGroups: Group[] = [
  { id: 'watch', name: 'Harbor Watch', goal: 'Maintain order, collect taxes.', behaviors: ['Patrol the market and docks.', 'Question suspicious people.'], areas: ['docks', 'market', 'watchtower'] },
  { id: 'eels', name: 'Ink Eels', goal: 'Smuggle goods, control the sewers.', behaviors: ['Operate from the shadows.', 'Avoid the Watch.'], areas: ['docks', 'sewers'] },
];

export const rustgateNPCs: NPC[] = [
  { id: 'mora', name: 'Captain Mora', role: 'Head of the Harbor Watch.', desire: 'Wants to stop the smuggling.', secret: 'Is in debt to a merchant.', lever: 'Her reputation.' },
  { id: 'jax', name: 'Jax', role: 'A shifty Ink Eels lookout.', desire: 'Wants to make a quick profit.', secret: 'Skims goods from shipments.', lever: 'Greed.' },
  { id: 'kessa', name: 'Old Kessa', role: 'A market fishmonger.', desire: 'Wants to protect her family.', secret: 'Knows who is really in charge of the Eels.', lever: 'Her grandson.' },
];

export const rustgateThings: Thing[] = [
    { id: 'ledger', name: 'Dock Ledger', use: 'Contains shipping manifests, might reveal smuggling discrepancies.', locationHint: 'docks' },
    { id: 'disguise', name: 'Disguise Kit', use: 'A bundle of old clothes to blend in as a dockworker.', locationHint: 'market' },
    { id: 'key', name: 'Sewer Key', use: 'Unlocks a sewer grate near the Watchtower.', locationHint: 'watchtower' },
];

export const rustgateProblems: Problem[] = [
  { id: 'shipment', name: 'Blocked Shipment', goal: 'Figure out why a shipment of medical supplies is being held at the docks.', steps: ['Inspect the crates.', 'Talk to the dock foreman.', 'Question Captain Mora.'], changeIfSolved: 'The supplies are released, earning goodwill.' },
  { id: 'guard', name: 'Missing Guard', goal: 'Find a Harbor Watch guard who disappeared near the sewers.', steps: ['Ask other guards.', 'Search the sewer entrance.', 'Look for clues in the market.'], changeIfSolved: 'The guard is found, revealing something about the Ink Eels.' },
];

export const createInitialWorldState = (): WorldState => ({
  placeId: 'docks',
  inventory: [],
  problemsOpen: ['shipment', 'guard'],
  timers: [
    { id: 'patrol', label: 'Patrol Sweep', turnsRemaining: 3, effectAtZero: 'The Harbor Watch patrol becomes more active and suspicious.' },
    { id: 'storm', label: 'Storm Front', turnsRemaining: 6, effectAtZero: 'A massive storm hits the docks, making some actions impossible.' },
  ],
  flags: {},
});

export const rustgateFacts = `
- Rustgate is a gritty, bustling port city.
- Two main factions are the Harbor Watch (official guards) and the Ink Eels (a smuggling gang).
- The city is rife with secrets and opportunities.
- The player is a newcomer, looking to make a name for themselves.
`;

export const rustgateRulesSummary = `
- Gameplay is turn-based. You type what you want to do.
- Be descriptive! "Talk to the captain" or "Look under the crate".
- The world reacts to your actions. Timers count down to major events.
- Your goal is to solve problems and navigate the city's factions.
`;
