-- ============================================================================
-- Seed: 004_seed_notes.sql
-- Description: Seeds free and paid digital notes and downloadable study material.
-- ============================================================================

INSERT INTO notes (
    id, title, description, course_id, subject_id, chapter_id,
    file_url, file_name, file_size, thumbnail, price, is_free, is_published, page_count, download_count
)
VALUES 
(
    'n0000000-0000-0000-0000-000000000001',
    'Complete PostgreSQL Schema & Querying Cheat Sheet',
    'Comprehensive handwritten and typed notes covering DDL, DML, Indexes, Constraints, and Transaction ACID properties.',
    'c0000000-0000-0000-0000-000000000001',
    's0000000-0000-0000-0000-000000000001',
    'ch000000-0000-0000-0000-000000000001',
    '/uploads/notes/postgresql-cheatsheet.pdf',
    'postgresql-cheatsheet.pdf',
    '4.2 MB',
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
    0.00,
    true,
    true,
    28,
    342
),
(
    'n0000000-0000-0000-0000-000000000002',
    'Full Stack PERN Architecture Master Guide (Premium)',
    'In-depth architectural blueprints, security checklists, repository patterns, and JWT token rotation implementation.',
    'c0000000-0000-0000-0000-000000000001',
    's0000000-0000-0000-0000-000000000002',
    'ch000000-0000-0000-0000-000000000002',
    '/uploads/notes/pern-architecture-guide.pdf',
    'pern-architecture-guide.pdf',
    '8.5 MB',
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400',
    199.00,
    false,
    true,
    64,
    128
),
(
    'n0000000-0000-0000-0000-000000000003',
    'DSA in Java: 100 Must-Solve Interview Questions & Solutions',
    'Curated collection of 100 LeetCode Medium/Hard algorithmic challenges with annotated Java code and complexity analysis.',
    'c0000000-0000-0000-0000-000000000002',
    's0000000-0000-0000-0000-000000000003',
    'ch000000-0000-0000-0000-000000000003',
    '/uploads/notes/dsa-java-100-questions.pdf',
    'dsa-java-100-questions.pdf',
    '12.1 MB',
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400',
    299.00,
    false,
    true,
    110,
    86
)
ON CONFLICT (id) DO NOTHING;
