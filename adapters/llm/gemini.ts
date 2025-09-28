import type { LlmAdapter } from './base.ts';
import { sanitizeOutput } from './base.ts';
import { GoogleGenAI } from '@google/genai';

// Use recommended model name as per @google/genai guidelines.
const GEMINI_MODEL = 'gemini-2.5-flash';

export const geminiAdapter: LlmAdapter = {
  id: 'gemini',
  name: 'Google (Gemini)',

  async health() {
    // Use process.env.API_KEY as per guidelines.
    if (!process.env.API_KEY) {
      return { isHealthy: false, details: 'VITE_GOOGLE_API_KEY is not set.' };
    }
    // There is no simple ping endpoint. We'll assume the key is valid if it's present.
    // A generate call is the only true test.
    return { isHealthy: true, details: `Ready (model: ${GEMINI_MODEL})` };
  },

  async generate({ system, user }) {
    // Use process.env.API_KEY as per guidelines.
    if (!process.env.API_KEY) return "The cosmic hum of Gemini is silent. An API key is required.";

    try {
        // Use modern @google/genai API with system instructions.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: user.trim(),
            config: {
                systemInstruction: system,
            },
        });

        return sanitizeOutput(response.text ?? '');
    } catch (error: unknown) {
        console.error('Gemini generation error:', error);
        if (error instanceof Error && error.message.includes('API key not valid')) {
            return "The runes glow with an error: Your Google API key is not valid.";
        }
        return "The celestial stream from Gemini is blocked. The connection failed.";
    }
  },
};
