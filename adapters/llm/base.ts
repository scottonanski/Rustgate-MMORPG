
export type LlmAdapterId = 'ollama' | 'openai' | 'gemini';

export interface LlmAdapter {
  id: LlmAdapterId;
  name: string;
  health(): Promise<{isHealthy: boolean, details: string}>;
  generate(input: { system: string; user: string }): Promise<string>;
}

// Simple helper to ensure the output is clean.
// A more robust version would ensure the list of actions is always present.
export function sanitizeOutput(text: string): string {
    return text.trim();
}
