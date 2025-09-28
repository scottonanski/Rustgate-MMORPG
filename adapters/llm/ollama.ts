import type { LlmAdapter } from './base.ts';
import { sanitizeOutput } from './base.ts';

// Fix: Use a relative path to the Vite proxy to avoid CORS errors.
const OLLAMA_PROXY_PATH = '/ollama-api';
const OLLAMA_MODEL = 'gemma3:1b';

type OllamaModel = { name: string };
type OllamaTagsResponse = { models: OllamaModel[] };
type OllamaChatResponse = { message: { content: string } };

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isOllamaTagsResponse = (value: unknown): value is OllamaTagsResponse => {
  if (!isObject(value)) return false;
  const { models } = value;
  if (!Array.isArray(models)) return false;
  return models.every(model => isObject(model) && typeof model.name === 'string');
};

const isOllamaChatResponse = (value: unknown): value is OllamaChatResponse => {
  if (!isObject(value)) return false;
  const { message } = value;
  return isObject(message) && typeof message.content === 'string';
};

export const ollamaAdapter: LlmAdapter = {
  id: 'ollama',
  name: 'Local (Ollama)',
  
  async health() {
    try {
      // The request now goes to our own server, which proxies it to Ollama.
      const response = await fetch(`${OLLAMA_PROXY_PATH}/api/tags`);
      if (!response.ok) {
        throw new Error(`Ollama API returned status ${response.status}`);
      }
      const data = await response.json();
      if (!isOllamaTagsResponse(data)) {
        throw new Error('Unexpected Ollama tags response payload');
      }
      const hasModel = data.models.some(model => model.name.includes(OLLAMA_MODEL));
      if (hasModel) {
        return { isHealthy: true, details: `Ready (found ${OLLAMA_MODEL})` };
      } else {
        return { isHealthy: false, details: `Ollama is running, but model '${OLLAMA_MODEL}' not found. Please run 'ollama pull ${OLLAMA_MODEL}'.` };
      }
    } catch (error: unknown) {
      console.error('Ollama health check failed:', error);
      return { isHealthy: false, details: 'Failed to connect to Ollama via proxy. Is Ollama running?' };
    }
  },

  async generate({ system, user }) {
    try {
      const response = await fetch(`${OLLAMA_PROXY_PATH}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user }
          ],
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API returned status ${response.status}`);
      }
      const data = await response.json();
      if (!isOllamaChatResponse(data)) {
        throw new Error('Unexpected Ollama chat response payload');
      }
      return sanitizeOutput(data.message.content);
    } catch (error: unknown) {
      console.error('Ollama generation error:', error);
      return "The connection to the local game master flickers and dies. Something is wrong.";
    }
  },
};
