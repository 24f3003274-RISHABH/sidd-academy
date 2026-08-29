-- ============================================================================
-- Seed: 002_seed_courses.sql
-- Description: Seeds 2 primary courses (Full Stack Web Development & Data Structures & Algorithms).
-- ============================================================================

INSERT INTO courses (
    id, title, slug, description, thumbnail, instructor, duration, language, level,
    price, discount_price, is_free, is_published, total_students, rating, order_num, created_at, updated_at
)
VALUES 
(
    'c0000000-0000-0000-0000-000000000001',
    'Full Stack Web Development (PERN Stack)',
    'full-stack-web-development-pern',
    'Master modern web applications from scratch with PostgreSQL, Express, React, Node.js, REST APIs, authentication, and cloud deployment.',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
    'Er. Sidd Keshari',
    '75+ Hours',
    'Hinglish',
    'All Levels',
    2999.00,
    1499.00,
    false,
    true,
    142,
    4.95,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'c0000000-0000-0000-0000-000000000002',
    'Data Structures & Algorithms in Java',
    'data-structures-algorithms-java',
    'Complete foundation in DSA, recursion, dynamic programming, graph algorithms, and competitive coding problem solving.',
    'https://images.unsplash.com/photo-1516116211227-bbc155255476?w=600&auto=format&fit=crop&q=80',
    'Prof. Alok Verma',
    '60+ Hours',
    'Hinglish',
    'Intermediate',
    1999.00,
    999.00,
    false,
    true,
    98,
    4.88,
    2,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO NOTHING;
