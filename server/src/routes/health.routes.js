import express from 'express';
import { checkDatabaseHealth } from '../config/db.js';
import ENV from '../config/env.js';

const router = express.Router();

/**
 * @route   GET /api/v1/health
 * @desc    API and system health status endpoint (redacts sensitive details per SRS FR-OPS-01 / TC-14)
 * @access  Public
 */
router.get('/', async (req, res) => {
  const dbHealth = await checkDatabaseHealth();
  const isProd = (process.env.NODE_ENV || ENV.NODE_ENV) === 'production';

  let safeError = undefined;
  if (!dbHealth.isConnected) {
    safeError = isProd
      ? 'Database connection unavailable'
      : String(dbHealth.error || dbHealth.message || 'Database disconnected')
          .replace(/postgresql:\/\/[^@\s]+@/gi, 'postgresql://***:***@')
          .replace(/password=\S+/gi, 'password=***');
  }

  res.status(200).json({
    success: true,
    message: 'Sidd Academy API is running',
    timestamp: new Date().toISOString(),
    database: {
      connected: Boolean(dbHealth.isConnected),
      latencyMs: dbHealth.latencyMs ?? null,
      ...(safeError && { error: safeError }),
    },
  });
});

export default router;
