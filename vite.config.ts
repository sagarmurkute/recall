import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    watch: {
      ignored: ['**/trace/**', '**/*.db*', '**/Recall-Personal-Memory-Engine.html']
    }
  }
});
