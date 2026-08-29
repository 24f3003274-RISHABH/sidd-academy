-- ============================================================================
-- Migration: 006_create_videos.sql
-- Description: Creates the 'videos' table storing video stream data, YouTube links,
-- and playlist references for Lessons.
-- Relationship: Many Videos can belong to 1 Lesson, or 1 Video per Lesson.
-- ============================================================================

CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    video_url TEXT NOT NULL,
    youtube_id VARCHAR(100),
    playlist_url TEXT,
    thumbnail_url TEXT,
    duration_seconds INTEGER DEFAULT 0,
    video_provider VARCHAR(50) NOT NULL DEFAULT 'youtube' CHECK (video_provider IN ('youtube', 'vimeo', 's3', 'local', 'custom')),
    quality VARCHAR(20) DEFAULT '1080p',
    order_num INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Key Constraint
    CONSTRAINT fk_videos_lesson 
        FOREIGN KEY (lesson_id) 
        REFERENCES lessons(id) 
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_videos_lesson_id ON videos(lesson_id);
