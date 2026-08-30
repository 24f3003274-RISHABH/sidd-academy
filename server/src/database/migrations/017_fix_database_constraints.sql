-- ============================================================================
-- Migration: 017_fix_database_constraints.sql
-- Description: Comprehensive database constraints audit and schema synchronization.
-- Ensures all CRUD operations across courses, subjects, chapters, lessons,
-- videos, notes, orders, and payments succeed without constraint violation errors.
-- ============================================================================

-- 1. COURSES TABLE CONSTRAINTS & COLUMNS
-- Ensure rating allows 0.00 to 5.00 without check constraint failure
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_rating_check;
ALTER TABLE courses ADD CONSTRAINT courses_rating_check CHECK (rating >= 0.00 AND rating <= 5.00);

-- Ensure non-negative price checks allow 0.00
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_price_check;
ALTER TABLE courses ADD CONSTRAINT courses_price_check CHECK (price >= 0.00);

ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_discount_price_check;
ALTER TABLE courses ADD CONSTRAINT courses_discount_price_check CHECK (discount_price >= 0.00);

ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_total_students_check;
ALTER TABLE courses ADD CONSTRAINT courses_total_students_check CHECK (total_students >= 0);

-- Ensure auxiliary columns exist for full compatibility
ALTER TABLE courses ADD COLUMN IF NOT EXISTS enrolled_students INTEGER NOT NULL DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS rating_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor VARCHAR(100) NOT NULL DEFAULT 'Sidd Academy Faculty';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS language VARCHAR(50) DEFAULT 'Hinglish';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_free BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS order_num INTEGER NOT NULL DEFAULT 0;

-- 2. CHAPTERS TABLE COLUMNS
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS order_num INTEGER NOT NULL DEFAULT 0;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS order_index INTEGER NOT NULL DEFAULT 0;

-- 3. LESSONS TABLE COLUMNS
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS order_num INTEGER NOT NULL DEFAULT 0;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS order_index INTEGER NOT NULL DEFAULT 0;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS is_free BOOLEAN NOT NULL DEFAULT false;

-- 4. VIDEOS TABLE COLUMNS & CONSTRAINTS
ALTER TABLE videos ALTER COLUMN lesson_id DROP NOT NULL;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE SET NULL;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS duration_seconds INTEGER NOT NULL DEFAULT 0;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS video_provider VARCHAR(50) NOT NULL DEFAULT 'youtube';
ALTER TABLE videos ADD COLUMN IF NOT EXISTS quality VARCHAR(20) DEFAULT '1080p';
ALTER TABLE videos ADD COLUMN IF NOT EXISTS order_num INTEGER NOT NULL DEFAULT 0;

-- 5. NOTES TABLE CONSTRAINTS & COLUMNS
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_price_check;
ALTER TABLE notes ADD CONSTRAINT notes_price_check CHECK (price >= 0.00);

ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_download_count_check;
ALTER TABLE notes ADD CONSTRAINT notes_download_count_check CHECK (download_count >= 0);

ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_page_count_check;
ALTER TABLE notes ADD CONSTRAINT notes_page_count_check CHECK (page_count >= 0);

-- 6. ORDERS & PAYMENTS ENHANCED INTEGRITY
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PENDING';

ALTER TABLE orders DROP CONSTRAINT IF EXISTS chk_orders_payment_status;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE orders ADD CONSTRAINT chk_orders_payment_status 
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled', 'PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED'));

ALTER TABLE payments DROP CONSTRAINT IF EXISTS chk_payments_status;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments ADD CONSTRAINT chk_payments_status 
    CHECK (status IN ('initiated', 'completed', 'failed', 'refunded', 'created', 'success', 'CREATED', 'SUCCESS', 'FAILED'));

-- 7. BANNERS
ALTER TABLE banners ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS order_num INTEGER NOT NULL DEFAULT 0;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS bg_color VARCHAR(50) DEFAULT 'from-indigo-900 to-purple-900';
