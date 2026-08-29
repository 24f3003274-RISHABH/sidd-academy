import express from 'express';
import { checkDatabaseHealth } from '../config/db.js';
import ENV from '../config/env.js';

const router = express.Router();

/**
 * @route   GET /api/v1/health
 * @desc    API and system health status endpoint
 * @access  Public
 */
router.get('/', async (req, res) => {
  const dbHealth = await checkDatabaseHealth();
  const isProd = (process.env.NODE_ENV || ENV.NODE_ENV) === 'production';
  
  res.status(200).json({
    success: true,
    message: 'Sidd Academy API is running',
    timestamp: new Date().toISOString(),
    database: {
      connected: dbHealth.isConnected,
      latencyMs: dbHealth.latencyMs,
      ...(dbHealth.error && {
        error: isProd ? 'Database connection unavailable' : dbHealth.error,
      }),
    },
  });
});

export default router;

