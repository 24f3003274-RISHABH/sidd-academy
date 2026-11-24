-- ============================================================================
-- Migration: 022_durable_media_and_pdf_storage.sql
-- Description: Adds durable binary storage for uploaded PDFs (notes.file_data)
--              and uploaded images/thumbnails (media_files table) so uploads
--              persist across ephemeral Render restarts and serverless deploys.
-- ============================================================================

ALTER TABLE notes ADD COLUMN IF NOT EXISTS file_data BYTEA;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS file_mime VARCHAR(120) DEFAULT 'application/pdf';
ALTER TABLE notes ADD COLUMN IF NOT EXISTS drive_file_id VARCHAR(150);
ALTER TABLE notes ADD COLUMN IF NOT EXISTS drive_folder_id VARCHAR(150) DEFAULT '1axziJZcQmDY1Ptbkm8s3c1ZJYStrL7Rf';
ALTER TABLE notes ADD COLUMN IF NOT EXISTS drive_view_url TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS drive_preview_url TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS local_file_url TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS storage_provider VARCHAR(50) DEFAULT 'database';

CREATE TABLE IF NOT EXISTS media_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    mime_type VARCHAR(120) NOT NULL,
    size_bytes INTEGER NOT NULL DEFAULT 0,
    data BYTEA NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_media_files_created_at ON media_files(created_at DESC);
