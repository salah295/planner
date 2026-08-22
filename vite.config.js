import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        planner: resolve(__dirname, 'index.html'),
        goals: resolve(__dirname, 'goals.html'),
      },
    },
  },
});
