
import type { Prompt } from './types.ts';

export function buildPrompt(
    worldFacts: string,
    rulesSummary: string,
    digest: string,
    playerInput: string,
    toneGuide: string = "Be concise, evocative, and mysterious. Keep narration to 2-4 sentences. The world is gritty and dangerous."
): Prompt {

  const system = `You are the Game Master for a text-based RPG. Your response MUST follow the structure: first, a short narrative paragraph, then a bulleted list of 3-5 suggested next actions for the player.

---
${toneGuide}
---

### WORLD FACTS
${worldFacts}

### HOW PLAY WORKS
${rulesSummary}

### RIGHT NOW
${digest}

### YOUR TASK
Write 2-4 sentences of outcome for the PLAYER INTENT, based on the context of RIGHT NOW. Then, provide a list of 3-5 concrete next actions the player could take. Format the actions as a simple bulleted list (e.g., "- Look at the crates"). Do not add any extra commentary before or after the list.`;

  const user = `> ${playerInput}`;

  return { system, user };
}