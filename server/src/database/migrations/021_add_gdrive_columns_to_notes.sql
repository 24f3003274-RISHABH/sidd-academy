-- ============================================================================
-- Migration: 021_add_gdrive_columns_to_notes.sql
-- Description: Adds Google Drive integration columns to the notes table and
--              synchronizes course level constraints.
-- ============================================================================

ALTER TABLE notes ADD COLUMN IF NOT EXISTS drive_file_id VARCHAR(150);
ALTER TABLE notes ADD COLUMN IF NOT EXISTS drive_folder_id VARCHAR(150) DEFAULT '1axziJZcQmDY1Ptbkm8s3c1ZJYStrL7Rf';
ALTER TABLE notes ADD COLUMN IF NOT EXISTS drive_view_url TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS drive_preview_url TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS local_file_url TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS storage_provider VARCHAR(50) DEFAULT 'gdrive';

CREATE INDEX IF NOT EXISTS idx_notes_drive_file_id ON notes(drive_file_id);
CREATE INDEX IF NOT EXISTS idx_notes_lesson_id ON notes(lesson_id);

-- Expand courses level check constraint to support all academic levels
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_level_check;
ALTER TABLE courses ADD CONSTRAINT courses_level_check
  CHECK (level IN ('Class 9', 'Class 10', 'Class 11', 'Class 12', 'Class 10, 11, 12', 'Foundation', 'Beginner', 'Intermediate', 'Advanced', 'All Levels'));
