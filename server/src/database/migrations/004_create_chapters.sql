-- ============================================================================
-- Migration: 004_create_chapters.sql
-- Description: Creates the 'chapters' table representing academic units under a Subject.
-- Relationship: Many Chapters belong to 1 Subject (Many-to-One).
-- ============================================================================

CREATE TABLE IF NOT EXISTS chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    order_num INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Key Constraint with Cascade on Delete
    CONSTRAINT fk_chapters_subject 
        FOREIGN KEY (subject_id) 
        REFERENCES subjects(id) 
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chapters_subject_id ON chapters(subject_id);
CREATE INDEX IF NOT EXISTS idx_chapters_order_num ON chapters(order_num);
