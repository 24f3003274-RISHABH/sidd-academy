-- ============================================================================
-- Master Seed File: seed.sql
-- Description: Executes all development seed data in foreign-key dependency order.
-- ============================================================================

\i server/src/database/seeds/001_seed_users.sql
\i server/src/database/seeds/002_seed_courses.sql
\i server/src/database/seeds/003_seed_curriculum.sql
\i server/src/database/seeds/004_seed_notes.sql
\i server/src/database/seeds/005_seed_enrollments_orders.sql
