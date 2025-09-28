import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
// Fix: Import process to provide type definitions for process.cwd().
import process from 'process';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        // Proxy Ollama API requests to avoid CORS issues during development.
        '/ollama-api': {
          target: env.VITE_OLLAMA_BASE_URL || 'http://localhost:11434',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ollama-api/, ''),
        },
      },
    },
    define: {
      // Shim for process.env used by @google/genai and other adapters
      'process.env': {
        VITE_OLLAMA_BASE_URL: JSON.stringify(env.VITE_OLLAMA_BASE_URL),
        VITE_OPENAI_API_KEY: JSON.stringify(env.VITE_OPENAI_API_KEY),
        // VITE_GOOGLE_API_KEY is aliased to API_KEY for @google/genai compliance
        API_KEY: JSON.stringify(env.VITE_GOOGLE_API_KEY),
      }
    }
  };
});
