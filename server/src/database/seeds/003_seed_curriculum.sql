-- ============================================================================
-- Seed: 003_seed_curriculum.sql
-- Description: Seeds subjects, chapters, lessons, and video streams for the courses.
-- ============================================================================

-- 1. Subjects
INSERT INTO subjects (id, course_id, title, description, icon, order_num)
VALUES 
(
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'PostgreSQL & Relational Databases',
    'Schema design, indexes, normalization, and SQL querying.',
    'Database',
    1
),
(
    'b0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000001',
    'Backend Development with Node & Express',
    'REST APIs, middleware, security, and authentication architectures.',
    'Server',
    2
),
(
    'b0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000002',
    'Arrays, Trees & Graphs in Java',
    'Core data structures, tree traversals, and shortest path algorithms.',
    'Code',
    1
)
ON CONFLICT (id) DO NOTHING;

-- 2. Chapters
INSERT INTO chapters (id, subject_id, title, description, order_num)
VALUES 
(
    'c1000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Chapter 1: Relational Modeling & Normalization (1NF to 3NF)',
    'Entity relationship mapping, keys, and normalization techniques.',
    1
),
(
    'c1000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000002',
    'Chapter 1: Express Architecture & Clean Code Patterns',
    'Layered controller-service-repository patterns and middleware chaining.',
    1
),
(
    'c1000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000003',
    'Chapter 1: Binary Search Trees & AVL Balancing',
    'Self-balancing binary trees, rotations, and asymptotic complexity.',
    1
)
ON CONFLICT (id) DO NOTHING;

-- 3. Lessons (Daily Classes)
INSERT INTO lessons (id, chapter_id, title, description, class_number, class_date, duration, is_free, is_protected, order_num)
VALUES 
(
    'de000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    'Lesson 1: Introduction to Tables, Constraints & Foreign Keys',
    'Understanding primary keys, foreign keys with cascade rules, and check constraints.',
    1,
    CURRENT_DATE,
    '45 mins',
    true,
    false,
    1
),
(
    'de000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000001',
    'Lesson 2: Advanced SQL Joins, Aggregations & Window Functions',
    'Deep dive into INNER/LEFT joins, GROUP BY, and partition queries.',
    2,
    CURRENT_DATE,
    '55 mins',
    false,
    true,
    2
),
(
    'de000000-0000-0000-0000-000000000003',
    'c1000000-0000-0000-0000-000000000002',
    'Lesson 1: Building Secure Express REST APIs with JWT & Refresh Tokens',
    'Complete token issuance, rotation, and route guard middleware.',
    1,
    CURRENT_DATE,
    '50 mins',
    true,
    false,
    1
)
ON CONFLICT (id) DO NOTHING;

-- 4. Videos
INSERT INTO videos (id, lesson_id, title, video_url, youtube_id, duration_seconds, video_provider, quality, order_num)
VALUES 
(
    'f0000000-0000-0000-0000-000000000001',
    'de000000-0000-0000-0000-000000000001',
    'SQL Schema Design & Relational Foundations',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'dQw4w9WgXcQ',
    2700,
    'youtube',
    '1080p',
    1
),
(
    'f0000000-0000-0000-0000-000000000002',
    'de000000-0000-0000-0000-000000000002',
    'Advanced SQL Joins & Subqueries Masterclass',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'dQw4w9WgXcQ',
    3300,
    'youtube',
    '1080p',
    1
),
(
    'f0000000-0000-0000-0000-000000000003',
    'de000000-0000-0000-0000-000000000003',
    'Authentication & Middleware in Node.js',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'dQw4w9WgXcQ',
    3000,
    'youtube',
    '1080p',
    1
)
ON CONFLICT (id) DO NOTHING;
