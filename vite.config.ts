import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? '/mermaid/' : '/',
  optimizeDeps: {
    include: ['mermaid']
  },
  build: {
    commonjsOptions: {
      include: [/mermaid/, /node_modules/]
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mermaid: ['mermaid'],
          monaco: ['@monaco-editor/react'],
          utils: ['zustand', 'html2canvas', 'jspdf']
        }
      }
    }
  }
}));
