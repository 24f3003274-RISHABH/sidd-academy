-- ============================================================================
-- Seed: 001_seed_users.sql
-- Description: Seeds 1 Administrator and 2 Students for development testing.
-- ============================================================================

INSERT INTO users (id, name, email, password, phone, role, avatar, is_active, created_at, updated_at)
VALUES 
(
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
),
(
    'a0000000-0000-0000-0000-000000000002',
    'Priya Sharma',
    'student@siddacademy.com',
    '$2a$10$p0b3h7c2iJzW6g4fD7yXeOFfC0XzY9wJbL3k5Q8n9u1v2w3x4y5z6',
    '+91 9123456789',
    'student',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'a0000000-0000-0000-0000-000000000003',
    'Aman Gupta',
    'aman.gupta@example.com',
    '$2a$10$p0b3h7c2iJzW6g4fD7yXeOFfC0XzY9wJbL3k5Q8n9u1v2w3x4y5z6',
    '+91 9876501234',
    'student',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;
