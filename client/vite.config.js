// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';
// import app from '../server/src/app.js';

// export default defineConfig({
//   plugins: [
//     react(),
//     {
//       name: 'express-api-middleware',
//       configureServer(server) {
//         server.middlewares.use((req, res, next) => {
//           if (req.url && (req.url.startsWith('/api') || req.url.startsWith('/uploads'))) {
//             app(req, res, next);
//           } else {
//             next();
//           }
//         });
//       },
//     },
//   ],
//   server: {
//     host: '0.0.0.0',
//     port: 3000,
//     strictPort: true,
//   },
//   build: {
//     outDir: '../dist',
//     emptyOutDir: true,
//   },
// });

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:10000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:10000',
        changeOrigin: true,
      }
    }
  },
  build: {
    // ⬇️ CHANGE THIS LINE BELOW
    outDir: 'dist', 
    emptyOutDir: true,
  },
});



// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';

// export default defineConfig({
//   plugins: [react()],
//   server: {
//     host: '0.0.0.0',
//     port: 3000,
//     strictPort: true,
//     proxy: {
//       '/api': {
//         target: 'http://localhost:10000', // Points to your local backend server port
//         changeOrigin: true,
//       },
//       '/uploads': {
//         target: 'http://localhost:10000',
//         changeOrigin: true,
//       }
//     }
//   },
//   build: {
//     outDir: '../dist',
//     emptyOutDir: true,
//   },
// });
