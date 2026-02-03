import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split Core Framework
          'vendor-react': ['react', 'react-dom', 'zustand'],
          // Split Database Layer
          'vendor-supabase': ['@supabase/supabase-js'],
          // Split Heavy Engineering Utilities (Heatmaps/PDFs)
          'vendor-engine': ['html2canvas', 'jspdf', 'dompurify'],
        }
      }
    },
    // Adjusted for high-density engineering assets
    chunkSizeWarningLimit: 1000,
  }
});