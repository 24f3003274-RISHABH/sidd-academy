# Sidd Academy — Database Architecture & ER Diagram

## 1. Relational Schema Architecture

Sidd Academy's relational persistence engine is built on PostgreSQL with strict referential integrity, foreign key cascading constraints, unique constraints, and optimized b-tree indexing.

```mermaid
erDiagram
    USERS ||--o{ ENROLLMENTS : "has"
    USERS ||--o{ ORDERS : "places"
    USERS ||--o{ NOTE_PURCHASES : "owns"
    USERS ||--o{ LESSON_PROGRESS : "completes"
    
    COURSES ||--o{ SUBJECTS : "contains"
    COURSES ||--o{ ENROLLMENTS : "enrolled_in"
    COURSES ||--o{ NOTES : "has"
    COURSES ||--o{ LESSON_PROGRESS : "tracks"
    
    SUBJECTS ||--o{ CHAPTERS : "contains"
    SUBJECTS ||--o{ NOTES : "categorizes"
    
    CHAPTERS ||--o{ LESSONS : "contains"
    CHAPTERS ||--o{ NOTES : "attaches"
    
    LESSONS ||--o| VIDEOS : "streams"
    LESSONS ||--o{ LESSON_PROGRESS : "recorded_in"
    
    NOTES ||--o{ NOTE_PURCHASES : "purchased_as"
    
    ORDERS ||--o{ ORDER_ITEMS : "contains"
    ORDERS ||--o| PAYMENTS : "verified_by"

    USERS {
        uuid id PK
        varchar name
        varchar email UK
        varchar password_hash
        varchar role "student | admin"
        varchar phone
        varchar status "active | suspended"
        timestamp created_at
    }

    COURSES {
        uuid id PK
        varchar title
        varchar slug UK
        text description
        numeric price
        numeric discount_price
        varchar level
        varchar thumbnail_url
        boolean is_published
    }

    SUBJECTS {
        uuid id PK
        uuid course_id FK
        varchar name
        integer order_index
    }

    CHAPTERS {
        uuid id PK
        uuid subject_id FK
        varchar name
        integer order_index
    }

    LESSONS {
        uuid id PK
        uuid chapter_id FK
        varchar title
        text content
        boolean is_free
        integer order_index
    }

    VIDEOS {
        uuid id PK
        uuid lesson_id FK
        varchar youtube_url
        varchar title
        integer duration_seconds
    }

    NOTES {
        uuid id PK
        uuid course_id FK
        uuid subject_id FK
        uuid chapter_id FK
        varchar title
        numeric price
        boolean is_free
        varchar file_url
        boolean is_published
    }

    ENROLLMENTS {
        uuid id PK
        uuid user_id FK
        uuid course_id FK
        timestamp enrolled_at
        varchar status
    }

    ORDERS {
        uuid id PK
        uuid user_id FK
        varchar order_number UK
        numeric total_amount
        varchar status "pending | paid | failed"
        varchar razorpay_order_id
        timestamp created_at
    }

    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        varchar item_type "course | note"
        uuid item_id
        numeric price
    }

    PAYMENTS {
        uuid id PK
        uuid order_id FK
        varchar payment_method
        varchar razorpay_payment_id
        varchar razorpay_signature
        varchar status
        numeric amount
    }

    NOTE_PURCHASES {
        uuid id PK
        uuid user_id FK
        uuid note_id FK
        uuid order_id FK
        timestamp purchased_at
    }

    LESSONS_PROGRESS {
        uuid id PK
        uuid user_id FK
        uuid course_id FK
        varchar lesson_id
        boolean is_completed
        timestamp completed_at
    }
```

---

## 2. Migration Manifest

The database schema is defined across 15 incremental SQL migration files executed chronologically:

1. `001_create_users.sql` — User profiles, credentials, role-based definitions.
2. `002_create_courses.sql` — Master course definitions, pricing, slugs, and publishing states.
3. `003_create_subjects.sql` — Course subjects with foreign key relationships.
4. `004_create_chapters.sql` — Subject chapters with ordering indexes.
5. `005_create_lessons.sql` — Chapter lessons and preview visibility.
6. `006_create_videos.sql` — YouTube HD streams and lesson bindings.
7. `007_create_notes.sql` — Digital PDF study notes with pricing and chapter links.
8. `008_create_enrollments.sql` — Course access records and student enrollments.
9. `009_create_orders.sql` — Checkout transactions and gateway order numbers.
10. `010_create_order_items.sql` — Itemized order line items for courses & notes.
11. `011_create_payments.sql` — Razorpay payment verification references.
12. `012_create_note_purchases.sql` — Individual PDF entitlement tracking.
13. `013_create_banners.sql` — Homepage carousel announcements.
14. `014_orders_payments_v2.sql` — Enhanced indexes and audit timestamps.
15. `015_create_lesson_progress.sql` — Granular lesson completion tracking with unique `(user_id, course_id, lesson_id)` constraint.
