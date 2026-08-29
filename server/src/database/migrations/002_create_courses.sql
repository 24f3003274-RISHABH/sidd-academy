-- ============================================================================
-- Migration: 002_create_courses.sql
-- Description: Creates the 'courses' table storing all educational programs/courses.
-- ============================================================================

CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(220) NOT NULL UNIQUE,
    description TEXT,
    thumbnail TEXT DEFAULT '',
    instructor VARCHAR(100) NOT NULL DEFAULT 'Sidd Academy Faculty',
    duration VARCHAR(50) DEFAULT '60+ Hours',
    language VARCHAR(50) DEFAULT 'Hinglish',
    level VARCHAR(50) DEFAULT 'All Levels' CHECK (level IN ('Beginner', 'Intermediate', 'Advanced', 'All Levels')),
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (price >= 0),
    discount_price NUMERIC(10, 2) DEFAULT 0.00 CHECK (discount_price >= 0),
    is_free BOOLEAN NOT NULL DEFAULT false,
    is_published BOOLEAN NOT NULL DEFAULT true,
    total_students INTEGER NOT NULL DEFAULT 0 CHECK (total_students >= 0),
    rating NUMERIC(3, 2) NOT NULL DEFAULT 4.90 CHECK (rating >= 0 AND rating <= 5.0),
    order_num INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for catalogue browsing, filtering, and slug routing
CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_is_published ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_courses_order_num ON courses(order_num);
