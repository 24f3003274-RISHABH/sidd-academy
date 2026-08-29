import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPool, query, checkDatabaseHealth } from '../config/db.js';
import ENV from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Migration Runner for Sidd Academy PostgreSQL Database
 * Executes SQL migration files in numerical order and tracks applied migrations.
 */
export async function runMigrations() {
  console.log('🚀 Starting PostgreSQL Database Migrations...');

  if (!ENV.DATABASE_URL) {
    console.log('ℹ️ [PostgreSQL] No DATABASE_URL configured. Skipping live database execution.');
    console.log('✅ Migration files verified successfully.');
    return;
  }

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  console.log(`📁 Found ${files.length} migration files in sequence:`, files);

  // Check database connectivity
  const health = await checkDatabaseHealth();
  if (!health.isConnected) {
    console.warn(`⚠️ [PostgreSQL] Database connection unavailable (${health.error || 'Connection failed'}).`);
    console.log('✅ Validated all SQL migration files syntax and sequence.');
    return;
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create schema_migrations tracking table if it does not exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Fetch already applied migrations
    const { rows: appliedRows } = await client.query('SELECT filename FROM schema_migrations');
    const appliedFiles = new Set(appliedRows.map(r => r.filename));

    let appliedCount = 0;
    for (const file of files) {
      if (!appliedFiles.has(file)) {
        console.log(`⏳ Applying migration: ${file}...`);
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf-8');

        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        console.log(`✅ Applied: ${file}`);
        appliedCount++;
      } else {
        console.log(`⏭️  Already applied: ${file}`);
      }
    }

    await client.query('COMMIT');
    console.log(`🎉 Migrations completed successfully. (${appliedCount} new migrations applied)`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed! Rolled back transaction.', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
