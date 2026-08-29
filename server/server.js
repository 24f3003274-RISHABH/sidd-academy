import app from './src/app.js';
import ENV from './src/config/env.js';

const PORT = process.env.PORT || ENV.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [Sidd Academy API] Server running on http://0.0.0.0:${PORT}`);
});

