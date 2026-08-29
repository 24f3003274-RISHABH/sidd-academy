import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import app from './src/app.js';
import ENV from './src/config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve built frontend files from dist/ if available
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Fallback to index.html for client-side routing
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api') || req.url.startsWith('/uploads')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      next();
    }
  });
});

const PORT = process.env.PORT || ENV.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [Sidd Academy] Server running on http://0.0.0.0:${PORT}`);
});
