-- ============================================================================
-- Migration: 018_seed_admin_user.sql
-- Description: Idempotently creates or updates the admin account 'rishabhmyp@gmail.com'
-- with hashed password and role='admin'.
-- ============================================================================

DO $$
BEGIN
    -- 1. If admin user with email rishabhmyp@gmail.com exists, update credentials and role
    IF EXISTS (SELECT 1 FROM users WHERE LOWER(email) = LOWER('rishabhmyp@gmail.com')) THEN
        UPDATE users 
        SET password = '$2a$10$/kpeKlPCZ1hYCuz3MUXIZOg/j98FB67X6AUY4s2g8epu1bBfjc9iK',
            role = 'admin',
            is_active = true,
            updated_at = CURRENT_TIMESTAMP
        WHERE LOWER(email) = LOWER('rishabhmyp@gmail.com');
    ELSE
        -- 2. If the default seed ID exists with old email, update it
        IF EXISTS (SELECT 1 FROM users WHERE id = 'a0000000-0000-0000-0000-000000000001') THEN
            UPDATE users 
            SET email = 'rishabhmyp@gmail.com',
                password = '$2a$10$/kpeKlPCZ1hYCuz3MUXIZOg/j98FB67X6AUY4s2g8epu1bBfjc9iK',
                role = 'admin',
                is_active = true,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = 'a0000000-0000-0000-0000-000000000001';
        ELSE
            -- 3. Otherwise insert new admin record
            INSERT INTO users (
                id, 
                name, 
                email, 
                password, 
                phone, 
                role, 
                avatar, 
                is_active, 
                created_at, 
                updated_at
            ) VALUES (
                'a0000000-0000-0000-0000-000000000001',
                'Rishabh Admin',
                'rishabhmyp@gmail.com',
                '$2a$10$/kpeKlPCZ1hYCuz3MUXIZOg/j98FB67X6AUY4s2g8epu1bBfjc9iK',
                '+91 9876543210',
                'admin',
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                true,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );
        END IF;
    END IF;
END $$;
