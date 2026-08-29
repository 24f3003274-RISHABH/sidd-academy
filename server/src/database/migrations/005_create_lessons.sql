-- ============================================================================
-- Migration: 005_create_lessons.sql
-- Description: Creates the 'lessons' table (also referred to as daily classes/lectures).
-- Relationship: Many Lessons belong to 1 Chapter (Many-to-One).
-- ============================================================================

CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    class_number INTEGER DEFAULT 1,
    class_date DATE DEFAULT CURRENT_DATE,
    duration VARCHAR(50) DEFAULT '45 mins',
    is_free BOOLEAN NOT NULL DEFAULT false,
    is_protected BOOLEAN NOT NULL DEFAULT true,
    order_num INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Key Constraint
    CONSTRAINT fk_lessons_chapter 
        FOREIGN KEY (chapter_id) 
        REFERENCES chapters(id) 
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lessons_chapter_id ON lessons(chapter_id);
CREATE INDEX IF NOT EXISTS idx_lessons_order_num ON lessons(order_num);
