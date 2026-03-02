import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { startHelperServer } from '../src/targets/helper-server.js';

let helperStarted = false;

export default defineConfig({
  root: __dirname,
  plugins: [
    react(),
    {
      name: 'rune-grab-helper',
      configureServer() {
        if (!helperStarted) {
          helperStarted = true;
          startHelperServer();
        }
      },
    },
  ],
  resolve: {
    alias: {
      'rune-grab': new URL('../src/index.ts', import.meta.url).pathname,
    },
  },
});
