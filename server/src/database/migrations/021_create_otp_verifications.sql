-- ============================================================================
-- Migration: 021_create_otp_verifications.sql
-- Description: Creates the 'otp_verifications' table and adds verification status flags to 'users'.
-- ============================================================================

-- 1. Ensure verification flags on users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT false;

-- Mark existing admin accounts as verified to prevent administrative lockout
UPDATE users SET email_verified = true WHERE role = 'admin' AND email_verified = false;

-- 2. Create otp_verifications table
CREATE TABLE IF NOT EXISTS otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    identifier VARCHAR(255) NOT NULL, -- Normalized email address or Indian mobile number
    purpose VARCHAR(50) NOT NULL CHECK (purpose IN ('registration', 'mobile_verification', 'password_reset', 'email_verification')),
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'sms')),
    otp_hash VARCHAR(255) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb, -- Temporary payload (e.g. pending registration data with pre-hashed password)
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    last_sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance and quick active record retrieval
CREATE INDEX IF NOT EXISTS idx_otp_verifications_identifier_purpose ON otp_verifications(LOWER(identifier), purpose);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_user_id ON otp_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_expires_at ON otp_verifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_last_sent_at ON otp_verifications(last_sent_at);
