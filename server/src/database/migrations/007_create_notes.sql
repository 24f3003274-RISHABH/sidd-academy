-- ============================================================================
-- Migration: 007_create_notes.sql
-- Description: Creates the 'notes' table storing digital study materials and PDFs.
-- Relationships:
-- - Optional Course FK (course_id)
-- - Optional Subject FK (subject_id)
-- - Optional Chapter FK (chapter_id)
-- - Optional Lesson FK (lesson_id)
-- ============================================================================

CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    course_id UUID,
    subject_id UUID,
    chapter_id UUID,
    lesson_id UUID,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size VARCHAR(50) DEFAULT '2.5 MB',
    thumbnail TEXT DEFAULT '',
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (price >= 0),
    is_free BOOLEAN NOT NULL DEFAULT false,
    is_published BOOLEAN NOT NULL DEFAULT true,
    page_count INTEGER NOT NULL DEFAULT 1 CHECK (page_count > 0),
    download_count INTEGER NOT NULL DEFAULT 0 CHECK (download_count >= 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Key Constraints with Cascade / Set Null on Delete
    CONSTRAINT fk_notes_course 
        FOREIGN KEY (course_id) 
        REFERENCES courses(id) 
        ON DELETE SET NULL,
    CONSTRAINT fk_notes_subject 
        FOREIGN KEY (subject_id) 
        REFERENCES subjects(id) 
        ON DELETE SET NULL,
    CONSTRAINT fk_notes_chapter 
        FOREIGN KEY (chapter_id) 
        REFERENCES chapters(id) 
        ON DELETE SET NULL,
    CONSTRAINT fk_notes_lesson 
        FOREIGN KEY (lesson_id) 
        REFERENCES lessons(id) 
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_notes_course_id ON notes(course_id);
CREATE INDEX IF NOT EXISTS idx_notes_subject_id ON notes(subject_id);
CREATE INDEX IF NOT EXISTS idx_notes_chapter_id ON notes(chapter_id);
CREATE INDEX IF NOT EXISTS idx_notes_is_free ON notes(is_free);
CREATE INDEX IF NOT EXISTS idx_notes_is_published ON notes(is_published);
