-- ============================================================================
-- Migration: 019_sync_admin_tables_schema.sql
-- Description: Unifies column names across all admin entities for PostgreSQL sync
-- ============================================================================

-- 1. Ensure subjects table supports both title & name, order_num & order_index
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS name VARCHAR(150);
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
UPDATE subjects SET name = title WHERE name IS NULL AND title IS NOT NULL;
UPDATE subjects SET title = name WHERE title IS NULL AND name IS NOT NULL;
UPDATE subjects SET order_index = order_num WHERE order_index = 0 AND order_num IS NOT NULL;

-- 2. Ensure chapters table supports order_num & order_index
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS order_num INTEGER DEFAULT 0;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
UPDATE chapters SET order_index = order_num WHERE order_index = 0 AND order_num IS NOT NULL;
UPDATE chapters SET order_num = order_index WHERE order_num = 0 AND order_index IS NOT NULL;

-- 3. Ensure lessons table supports order_num & order_index & is_free
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS order_num INTEGER DEFAULT 0;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT false;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS is_protected BOOLEAN DEFAULT true;
UPDATE lessons SET order_index = order_num WHERE order_index = 0 AND order_num IS NOT NULL;
UPDATE lessons SET order_num = order_index WHERE order_num = 0 AND order_index IS NOT NULL;

-- 4. Ensure videos table supports course/subject/chapter hierarchy
ALTER TABLE videos ALTER COLUMN lesson_id DROP NOT NULL;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE SET NULL;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS playlist_url VARCHAR(500);
ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT false;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 1800;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS order_num INTEGER DEFAULT 0;

-- 5. Ensure admin user credentials are valid and active
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM users WHERE LOWER(email) = LOWER('rishabhmyp@gmail.com')) THEN
        UPDATE users 
        SET password = '$2a$10$/kpeKlPCZ1hYCuz3MUXIZOg/j98FB67X6AUY4s2g8epu1bBfjc9iK',
            role = 'admin',
            is_active = true,
            updated_at = CURRENT_TIMESTAMP
        WHERE LOWER(email) = LOWER('rishabhmyp@gmail.com');
    ELSE
        INSERT INTO users (
            id, name, email, password, phone, role, avatar, is_active, created_at, updated_at
        ) VALUES (
            'a0000000-0000-0000-0000-000000000001',
            'Rishabh Admin',
            'rishabhmyp@gmail.com',
            '$2a$10$/kpeKlPCZ1hYCuz3MUXIZOg/j98FB67X6AUY4s2g8epu1bBfjc9iK',
            '+91 9876543210',
            'admin',
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            true,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
    END IF;
END $$;
