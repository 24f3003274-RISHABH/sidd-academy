import express from 'express';
import { checkDatabaseHealth } from '../config/db.js';

const router = express.Router();

/**
 * @route   GET /api/v1/health
 * @desc    API and system health status endpoint
 * @access  Public
 */
router.get('/', async (req, res) => {
  const dbHealth = await checkDatabaseHealth();
  
  res.status(200).json({
    success: true,
    message: 'Sidd Academy API is running',
    timestamp: new Date().toISOString(),
    database: {
      connected: dbHealth.isConnected,
      latencyMs: dbHealth.latencyMs,
      error: dbHealth.error,
    },
  });
});

export default router;
