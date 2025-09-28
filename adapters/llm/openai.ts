
import type { LlmAdapter } from './base.ts';
import { sanitizeOutput } from './base.ts';

// Fix: Use process.env provided by Vite's `define` config instead of `import.meta.env` to avoid TypeScript errors.
const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY;
const OPENAI_MODEL = 'gpt-4o-mini';

export const openaiAdapter: LlmAdapter = {
  id: 'openai',
  name: 'OpenAI',

  async health() {
    if (!OPENAI_API_KEY) {
      return { isHealthy: false, details: 'VITE_OPENAI_API_KEY is not set.' };
    }
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      });
      if (!response.ok) {
        if (response.status === 401) {
            return { isHealthy: false, details: 'Invalid OpenAI API key.' };
        }
        throw new Error(`OpenAI API returned status ${response.status}`);
      }
      return { isHealthy: true, details: `Ready (model: ${OPENAI_MODEL})` };
    } catch (error) {
      console.error('OpenAI health check failed:', error);
      return { isHealthy: false, details: 'Failed to connect to OpenAI API.' };
    }
  },

  async generate({ system, user }) {
    if (!OPENAI_API_KEY) return "The link to the OpenAI oracle is missing. Set VITE_OPENAI_API_KEY.";

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user }
          ],
          temperature: 0.7,
        }),
      });
      if (!response.ok) {
        throw new Error(`OpenAI API returned status ${response.status}`);
      }
      const data = await response.json();
      return sanitizeOutput(data.choices[0].message.content);
    } catch (error) {
      console.error('OpenAI generation error:', error);
      return "The oracle's voice from OpenAI fades into static. The connection was lost.";
    }
  },
};
