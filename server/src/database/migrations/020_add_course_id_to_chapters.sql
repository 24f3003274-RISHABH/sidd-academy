-- ============================================================================
-- Migration: 020_add_course_id_to_chapters.sql
-- Description: Adds optional course_id to chapters for direct course-level hierarchy indexing
-- ============================================================================

ALTER TABLE chapters ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE SET NULL;

UPDATE chapters 
SET course_id = subjects.course_id 
FROM subjects 
WHERE chapters.subject_id = subjects.id 
  AND chapters.course_id IS NULL;
