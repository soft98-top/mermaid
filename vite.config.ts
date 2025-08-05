import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['mermaid']
  },
  build: {
    commonjsOptions: {
      include: [/mermaid/, /node_modules/]
    }
  }
});
