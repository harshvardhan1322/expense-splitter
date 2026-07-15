import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxy /api calls to the Express backend during development so the frontend
// can use same-origin relative URLs (no CORS juggling in the browser).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
