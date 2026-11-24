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
      // Allow enough time for sleeping cloud PostgreSQL instances (Neon/Supabase/Render) to wake up
      connectionTimeoutMillis: 15000,
    };

    // If using remote connection with SSL (e.g., Supabase / Neon / Cloud SQL / AWS RDS)
    const isLocalhost = !ENV.DATABASE_URL || ENV.DATABASE_URL.includes('localhost') || ENV.DATABASE_URL.includes('127.0.0.1');
    if (ENV.DATABASE_URL && (!isLocalhost || ENV.DATABASE_URL.includes('sslmode=require') || ENV.DATABASE_URL.includes('supabase'))) {
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
 * Ensures runtime-critical columns, durable media storage table, and official Sidd Academy
 * promotional banners exist in PostgreSQL (idempotent, safe to run on every Render startup).
 */
export const ensureRuntimeSchemaAndBanners = async () => {
  if (!ENV.DATABASE_URL) return;

  try {
    // 1. Ensure durable PDF & GDrive storage columns exist on `notes`
    await query(`
      ALTER TABLE notes ADD COLUMN IF NOT EXISTS file_data BYTEA;
      ALTER TABLE notes ADD COLUMN IF NOT EXISTS file_mime VARCHAR(120) DEFAULT 'application/pdf';
      ALTER TABLE notes ADD COLUMN IF NOT EXISTS drive_file_id VARCHAR(150);
      ALTER TABLE notes ADD COLUMN IF NOT EXISTS drive_folder_id VARCHAR(150) DEFAULT '1axziJZcQmDY1Ptbkm8s3c1ZJYStrL7Rf';
      ALTER TABLE notes ADD COLUMN IF NOT EXISTS drive_view_url TEXT;
      ALTER TABLE notes ADD COLUMN IF NOT EXISTS drive_preview_url TEXT;
      ALTER TABLE notes ADD COLUMN IF NOT EXISTS local_file_url TEXT;
      ALTER TABLE notes ADD COLUMN IF NOT EXISTS storage_provider VARCHAR(50) DEFAULT 'database';
    `);

    // 1b. Ensure admin curriculum & video columns exist on PostgreSQL (idempotent sync for partial migrations)
    await query(`
      ALTER TABLE subjects ADD COLUMN IF NOT EXISTS name VARCHAR(150);
      ALTER TABLE subjects ADD COLUMN IF NOT EXISTS description TEXT;
      ALTER TABLE subjects ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
      ALTER TABLE chapters ADD COLUMN IF NOT EXISTS description TEXT;
      ALTER TABLE chapters ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
      ALTER TABLE chapters ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE SET NULL;
      ALTER TABLE lessons ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
      ALTER TABLE lessons ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT false;
      ALTER TABLE lessons ADD COLUMN IF NOT EXISTS is_protected BOOLEAN DEFAULT true;
      ALTER TABLE videos ADD COLUMN IF NOT EXISTS description TEXT;
      ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT false;
      ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;
      ALTER TABLE videos ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE SET NULL;
      ALTER TABLE videos ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL;
      ALTER TABLE videos ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL;
      ALTER TABLE videos ADD COLUMN IF NOT EXISTS playlist_url TEXT;
    `);

    // 2. Ensure durable `media_files` table exists for course thumbnails & banner uploads
    await query(`
      CREATE TABLE IF NOT EXISTS media_files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        filename TEXT NOT NULL,
        mime_type VARCHAR(120) NOT NULL,
        size_bytes INTEGER NOT NULL DEFAULT 0,
        data BYTEA NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Remove legacy placeholder tech-interview banners and seed official SIDD ACADEMY PRAYAGRAJ posters
    await query(`
      DELETE FROM banners
      WHERE title ILIKE '%Crack Top Tech Interviews%'
         OR subtitle ILIKE '%Data Structures, Web Development, and DBMS%'
         OR title ILIKE '%Download 100+ Free Hand-Written Lecture Notes%'
    `);

    const officialCheck = await query(
      `SELECT COUNT(*)::int AS cnt FROM banners WHERE image_url LIKE '/posters/%'`
    );
    if ((officialCheck.rows[0]?.cnt || 0) === 0) {
      await query(`
        INSERT INTO banners (id, title, subtitle, badge, image_url, link_url, button_text, is_active, order_num, bg_color)
        VALUES
        (
          'ba000000-0000-0000-0000-000000000001',
          'TARGET BATCH — UP Board • CBSE Board • JEE Mains (100 Days Left)',
          '100 दिन की मेहनत, पूरे साल की पहचान! आज की तैयारी • कल की सफलता — Physics, Chemistry, Mathematics & Biology complete target preparation.',
          '🎯 100 DAYS TARGET BATCH',
          '/posters/target-batch-100-days-banner.jpg',
          '/courses',
          'Join Target Batch',
          true,
          1,
          'from-pink-900/60 to-purple-950/60'
        ),
        (
          'ba000000-0000-0000-0000-000000000002',
          'CLASS 11th SPECIAL BATCH — मात्र 90 दिनों में पूरा सिलेबस',
          'Physics • Chemistry • Maths • Biology | प्रतिदिन 5 घंटे की क्लास + Sunday Morning Test & Evening Class शहजाद सर और SIDDHANT BHAIYAA के कुशल नेतृत्व में।',
          '⚡ CLASS 11th SPECIAL BATCH',
          '/posters/class-11-special-batch-1.jpg',
          '/courses',
          'Explore Class 11 Batch',
          true,
          2,
          'from-blue-900/60 to-indigo-950/60'
        ),
        (
          'ba000000-0000-0000-0000-000000000003',
          'Chapter-wise TEST Series — Every Saturday & Sunday (Timing 4:00 से 6:00)',
          'Board Exam जैसा अनुभव! Board Pattern Based Test, Detailed Analysis & Performance Improvement at Gali No. 20, Ganga Nagar, Rajapur, Prayagraj.',
          '📝 WEEKEND CHAPTER-WISE TEST',
          '/posters/chapter-wise-weekend-test.jpg',
          '/courses',
          'Join Test Series',
          true,
          3,
          'from-emerald-900/60 to-teal-950/60'
        ),
        (
          'ba000000-0000-0000-0000-000000000004',
          'TARGET BATCH — 100 दिन की मेहनत, पूरे साल की पहचान!',
          'UP Board • CBSE Board • JEE Mains | आज की तैयारी • कल की सफलता — Complete 100-Day Intensive Revision & Practice Batch.',
          '🔥 100 DAYS INTENSIVE',
          '/posters/target-batch-100-days-poster.jpg',
          '/courses',
          'Enroll in Target Batch',
          true,
          4,
          'from-amber-900/60 to-red-950/60'
        ),
        (
          'ba000000-0000-0000-0000-000000000005',
          'SID ACADEMY PRAYAGRAJ — Class 11th Special Batch (90 Days Full Syllabus)',
          'कमजोर छात्रों पर विशेष ध्यान | प्रतिदिन 5 घंटे की क्लास + Sunday Morning Test | पता: गली नं. 20 के पास, गंगा नगर, राजापुर, प्रयागराज।',
          '📚 CLASS 11th 90-DAY BATCH',
          '/posters/class-11-special-batch-2.jpg',
          '/courses',
          'Explore Class 11 Courses',
          true,
          5,
          'from-indigo-900/60 to-slate-950/60'
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          subtitle = EXCLUDED.subtitle,
          badge = EXCLUDED.badge,
          image_url = EXCLUDED.image_url,
          link_url = EXCLUDED.link_url,
          button_text = EXCLUDED.button_text,
          is_active = EXCLUDED.is_active;
      `);
    }

    console.log('✅ [PostgreSQL] Runtime schema, durable storage tables, and official posters verified.');
  } catch (err) {
    console.warn('⚠️ [PostgreSQL] Runtime schema sync warning:', err.message);
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
      await ensureRuntimeSchemaAndBanners();
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
