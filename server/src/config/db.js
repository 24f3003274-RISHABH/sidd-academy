import pg from 'pg';
import ENV from './env.js';

const { Pool } = pg;

/**
 * PostgreSQL Connection Pool Configuration
 * 
 * WHY: Connection pooling avoids the overhead of establishing a new TCP connection
 * and SSL handshake for every single API request, dramatically improving query throughput
 * and ensuring resource reuse.
 */
let pool = null;

export const getPool = () => {
  if (!pool) {
    const config = {
      connectionString: ENV.DATABASE_URL || undefined,
      // Maximum number of clients the pool should contain
      max: 20,
      // Number of milliseconds a client must sit idle before being closed
      idleTimeoutMillis: 30000,
      // Number of milliseconds to wait for a connection before timing out
      connectionTimeoutMillis: 5000,
    };

    // If using remote connection with SSL (e.g., Supabase / Neon / Cloud SQL)
    if (ENV.DATABASE_URL && ENV.DATABASE_URL.includes('sslmode=require')) {
      config.ssl = { rejectUnauthorized: false };
    }

    pool = new Pool(config);

    pool.on('error', (err) => {
      console.error('⚠️ [PostgreSQL Pool Error]: Unexpected client error', err.message);
    });
  }
  return pool;
};

/**
 * Executes a parameterized SQL query safely against PostgreSQL
 * 
 * WHY: Parameterized queries ($1, $2, ...) prevent SQL injection attacks
 * and ensure proper data type coercion.
 * 
 * @param {string} text - SQL statement with placeholders ($1, $2)
 * @param {Array} params - Parameter values
 * @returns {Promise<pg.QueryResult>}
 */
export const query = async (text, params = []) => {
  const currentPool = getPool();
  const start = Date.now();
  try {
    const res = await currentPool.query(text, params);
    const duration = Date.now() - start;
    if (ENV.NODE_ENV === 'development') {
      console.log(`⏱️ [SQL Executed] ${duration}ms | rows: ${res.rowCount}`);
    }
    return res;
  } catch (error) {
    console.error('❌ [PostgreSQL Query Error]:', {
      query: text,
      params,
      error: error.message,
    });
    throw error;
  }
};

/**
 * Verifies PostgreSQL database connection health
 * 
 * @returns {Promise<{ isConnected: boolean, latencyMs?: number, error?: string }>}
 */
export const checkDatabaseHealth = async () => {
  if (!ENV.DATABASE_URL) {
    return {
      isConnected: false,
      message: 'DATABASE_URL environment variable is not configured',
    };
  }

  const start = Date.now();
  try {
    const currentPool = getPool();
    const result = await currentPool.query('SELECT NOW() as current_time, current_database() as db_name');
    const latencyMs = Date.now() - start;
    return {
      isConnected: true,
      latencyMs,
      database: result.rows[0]?.db_name,
      serverTime: result.rows[0]?.current_time,
    };
  } catch (error) {
    return {
      isConnected: false,
      error: error.message,
    };
  }
};

/**
 * Initializes and logs database connection status on startup
 */
export const initDB = async () => {
  if (!ENV.DATABASE_URL) {
    console.log('ℹ️ [PostgreSQL] No DATABASE_URL provided. Operating with in-memory adapter for development.');
    return;
  }

  try {
    const health = await checkDatabaseHealth();
    if (health.isConnected) {
      console.log(`✅ [PostgreSQL Connected] Database: "${health.database}" (${health.latencyMs}ms latency)`);
    } else {
      console.warn(`⚠️ [PostgreSQL Connection Warning]: ${health.error}`);
    }
  } catch (err) {
    console.warn(`⚠️ [PostgreSQL Connection Error]: ${err.message}`);
  }
};

export default {
  getPool,
  query,
  checkDatabaseHealth,
  initDB,
};
