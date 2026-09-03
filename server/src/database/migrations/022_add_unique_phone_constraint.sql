-- ============================================================================
-- Migration: 022_add_unique_phone_constraint.sql
-- Description: Enforces Indian mobile number uniqueness at the database level.
-- ============================================================================

-- Partial unique index on phone column so multiple accounts without phone (or legacy rows) don't conflict,
-- while guaranteeing strict uniqueness for all registered mobile numbers.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_unique_phone ON users (phone)
WHERE phone IS NOT NULL AND phone != '';
