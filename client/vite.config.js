import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import app from '../server/src/app.js';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'express-api-middleware',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && (req.url.startsWith('/api') || req.url.startsWith('/uploads'))) {
            app(req, res, next);
          } else {
            next();
          }
        });
      },
    },
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
