-- ============================================================================
-- Migration: 016_enhance_videos_table.sql
-- Description: Enhances videos table for flexible YouTube video management.
-- Allows standalone YouTube video lectures as well as course/subject/chapter associations.
-- ============================================================================

-- Make lesson_id nullable so videos can be attached directly to courses/subjects/chapters or standalone
ALTER TABLE videos ALTER COLUMN lesson_id DROP NOT NULL;

-- Add optional rich metadata and hierarchy foreign keys
ALTER TABLE videos ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE SET NULL;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL;

-- Indexes for optimal lookup performance
CREATE INDEX IF NOT EXISTS idx_videos_course_id ON videos(course_id);
CREATE INDEX IF NOT EXISTS idx_videos_subject_id ON videos(subject_id);
CREATE INDEX IF NOT EXISTS idx_videos_chapter_id ON videos(chapter_id);
