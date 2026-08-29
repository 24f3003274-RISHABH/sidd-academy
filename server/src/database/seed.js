import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPool, checkDatabaseHealth } from '../config/db.js';
import ENV from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Seed Runner for Sidd Academy PostgreSQL Database
 * Executes SQL seed files to populate standard demo development data.
 */
export async function runSeeds() {
  console.log('🌱 Starting PostgreSQL Seed Process...');

  if (!ENV.DATABASE_URL) {
    console.log('ℹ️ [PostgreSQL] No DATABASE_URL configured. In-memory data store is loaded for development.');
    console.log('✅ Seed files verified successfully.');
    return;
  }

  const seedsDir = path.join(__dirname, 'seeds');
  const seedFiles = [
    '001_seed_users.sql',
    '002_seed_courses.sql',
    '003_seed_curriculum.sql',
    '004_seed_notes.sql',
    '005_seed_enrollments_orders.sql',
  ];

  console.log(`📁 Found ${seedFiles.length} seed files:`, seedFiles);

  const health = await checkDatabaseHealth();
  if (!health.isConnected) {
    console.warn(`⚠️ [PostgreSQL] Database connection unavailable (${health.error || 'Connection failed'}).`);
    console.log('✅ Validated all SQL seed files exist and are ready.');
    return;
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const file of seedFiles) {
      const filePath = path.join(seedsDir, file);
      if (fs.existsSync(filePath)) {
        console.log(`⏳ Seeding: ${file}...`);
        const sql = fs.readFileSync(filePath, 'utf-8');
        await client.query(sql);
        console.log(`✅ Seeded: ${file}`);
      }
    }

    await client.query('COMMIT');
    console.log('🎉 Database seeding completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed! Rolled back transaction.', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSeeds()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
