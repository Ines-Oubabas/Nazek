import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// ✅ Configuration Vite
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // Alias vers /src
    },
  },
  server: {
    port: 3000, // Port où tourne ton frontend
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // Adresse du backend (Django)
        changeOrigin: true,
        secure: false, // 🔥 Important si plus tard ton backend a SSL en local (https://)
      },
    },
  },
});
