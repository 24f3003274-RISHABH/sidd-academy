# Sidd Academy — Online Coaching Platform

> **Full-Stack Educational Platform** for online coaching, structured courses, digital notes & video classes (Migrating from MERN to PERN).

## Development Progress

### Phase 0 — Project Audit

#### 1. Current Architecture Overview
The Sidd Academy platform was initially scaffolded with a MERN stack pattern (MongoDB, Express, React, Node.js) paired with an in-memory/fallback data layer (`mockStore.js`) for environments without active MongoDB instances.

```
React Client (Vite + Axios + React Router v6)
       ↓ (HTTP REST API / JSON)
Express.js Server (Port 3000)
       ↓
Middleware (Auth, Role Guard, Multer, Error Handler)
       ↓
Controllers (Ad-hoc Mongoose queries & mockStore sync)
       ↓
Data Layer: MongoDB / Mongoose Schemas (User, Course, Subject, Chapter, DailyClass, Note, Banner, Order)
```

#### 2. Existing Modules & Status
| Module | Current State | MERN / Mongo Dependency | Migration Requirement |
|---|---|---|---|
| **Authentication & Users** | Functional (Login, Register, JWT, Profile) | `User.model.js` (Mongoose), `bcryptjs`, JWT | Migrate to PostgreSQL `users` table; keep JWT & password hashing |
| **Courses & Curriculum** | Functional (Listing, Details, Enrollment) | `Course.model.js`, `Subject.model.js`, `Chapter.model.js` | Normalize into relational tables: `courses`, `subjects`, `chapters` |
| **Video Lectures (Daily Classes)** | Functional (YouTube embed, previews, duration) | `DailyClass.model.js` | Normalize to `daily_classes` with `chapter_id` foreign key |
| **Digital Notes & PDFs** | Functional (Metadata, download counts, previews) | `Note.model.js` | Migrate to `notes` table with relational foreign keys |
| **Banner Carousel** | Functional (Active slides, ordering, links) | `Banner.model.js` | Migrate to `banners` table |
| **Payments & Orders** | Functional (Razorpay checkout mock/live flow) | `Order.model.js` | Migrate to `orders` and `order_items` relational tables |
| **Admin Management** | Functional (Courses, subjects, chapters, classes, banners) | Mixed Controller calls | Connect to standard Service → Repository → PostgreSQL layers |

#### 3. What Currently Works
- **Frontend SPA**: React 18 with Vite, React Router v6, custom dark/neon UI theme, responsive mobile-first navigation.
- **Client Auth Flow**: JWT storage in localStorage, Axios interceptors injecting `Authorization: Bearer <token>`.
- **Public Catalog**: Home page, Course detail view, YouTube video showcase (@A2CCENTRE videos), Modular notes catalog.
- **Admin Dashboard**: Full CRUD interface for Courses, Subjects, Chapters, Classes, Notes, and Banners.
- **Payment & Enrollment**: Student course enrollment and purchase tracking.

#### 4. What Is Incomplete / Needs Refactoring
- Controllers currently mix business logic, direct data access, and dual MongoDB/mock fallback logic.
- Lack of strict layered architecture (`Route → Middleware → Controller → Service → Repository → PostgreSQL`).
- No foreign key integrity or relational schema constraints.
- Input validation relies on ad-hoc controller checks instead of standardized validation layers.

#### 5. MERN → PERN Migration Plan
- **Database Engine**: Replace MongoDB/Mongoose with PostgreSQL using `pg` (node-postgres connection pool).
- **Relational Schema**:
  - `users` (id, name, email, password, phone, role, avatar, is_active, last_login, created_at, updated_at)
  - `courses` (id, title, slug, description, thumbnail, instructor, duration, language, level, price, discount_price, is_free, is_published, total_students, rating, order_num, created_at, updated_at)
  - `subjects` (id, course_id, title, description, icon, order_num, created_at, updated_at)
  - `chapters` (id, subject_id, title, description, order_num, created_at, updated_at)
  - `daily_classes` (id, chapter_id, title, description, class_date, class_number, video_url, youtube_playlist_url, duration, is_protected, is_free, order_num, created_at, updated_at)
  - `notes` (id, course_id, subject_id, chapter_id, title, description, file_url, file_name, file_size, thumbnail, price, is_free, is_published, download_count, page_count, created_at, updated_at)
  - `banners` (id, title, subtitle, badge, image_url, link_url, button_text, is_active, order_num, bg_color, created_at, updated_at)
  - `orders` (id, user_id, total_amount, currency, razorpay_order_id, razorpay_payment_id, razorpay_signature, payment_status, receipt, created_at, updated_at)
  - `order_items` (id, order_id, item_type, item_id, title, price, created_at)
  - `user_purchases` (id, user_id, item_type, item_id, purchased_at)
- **Layered Backend**:
  - `routes/` → `controllers/` → `services/` → `repositories/` → `PostgreSQL`
- **Frontend Preservation**: Zero breaking changes to client API contracts (`/api/v1/*`), keeping all existing React pages, components, and state management intact.

#### 6. Recommended Relationships
- `courses` 1 ──< N `subjects` 1 ──< N `chapters` 1 ──< N `daily_classes`
- `chapters` 1 ──< N `notes`
- `users` 1 ──< N `orders` 1 ──< N `order_items`
- `users` 1 ──< N `user_purchases`

#### 7. Potential Migration Risks & Mitigations
- **Database Availability in Sandboxes**: Use a resilient connection pool with graceful connection health checking and mock repository fallbacks so the application remains 100% operational in every environment.
- **ID formats**: Support UUID/relational IDs seamlessly without breaking React UI key props.
- **Frontend Contract Stability**: Maintain JSON API schema compatibility in response payloads (`{ success: true, data: { ... } }`).

### Phase 1 — PERN Foundation

#### 1. MERN → PERN Migration Progress
- **Database Driver**: Integrated `pg` (node-postgres) with connection pooling (`Pool`), parameterized query wrapper, and automated health checks.
- **Removed MongoDB / Mongoose**: Cleaned up Mongoose dependencies from backend entry points.
- **Layered Architecture Established**:
  - `server/src/config/`: Centralized environment loader (`env.js`) & PostgreSQL pool manager (`db.js`).
  - `server/src/constants/`: Standardized system constants, roles, and HTTP codes (`index.js`).
  - `server/src/validators/`: Input validation definitions using `express-validator` (`auth.validator.js`).
  - `server/src/repositories/`: Data access abstraction layer (`base.repository.js`, `user.repository.js`).
  - `server/src/services/`: Pure business logic layer decoupled from transport protocols (`auth.service.js`).
  - `server/src/controllers/`: Request orchestration and response formatting.
  - `server/src/middleware/`: CORS, Helmet, CookieParser, Request Validation, Authentication, and Centralized Error Handling.
  - `server/src/routes/`: Route modules including the new system health status check (`health.routes.js`).

#### 2. PostgreSQL Configuration & Pool Settings
- Parameterized query interface prevents SQL injection.
- Connection pool with keep-alive (`max: 20`, `idleTimeoutMillis: 30000`, `connectionTimeoutMillis: 5000`).
- SSL support for managed cloud PostgreSQL providers (Cloud SQL, Neon, Supabase).
- Non-blocking connection health check with latency reporting.

#### 3. Environment Variables
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgres://user:password@localhost:5432/sidd_academy
CORS_ORIGIN=*
JWT_SECRET=your_jwt_secret_key
JWT_ACCESS_SECRET=your_jwt_access_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
CLIENT_URL=http://localhost:3000
```

#### 4. API Health Endpoint
- **Route**: `GET /api/v1/health`
- **Response**:
```json
{
  "success": true,
  "message": "Sidd Academy API is running",
  "timestamp": "2026-08-28T22:15:00.000Z",
  "database": {
    "connected": true,
    "latencyMs": 4
  }
}
```

#### 5. Middleware & Error Handling
- **Helmet**: Customized header security for cross-origin applet sandboxes.
- **CORS**: Secure cross-origin resource sharing with credentials support.
- **express-validator**: Request validation middleware returning standardized error arrays.
- **AppError & errorHandler**: Centralized operational error catching with appropriate HTTP status codes.

---

## 🗄️ Phase 2 — PostgreSQL Database

📖 **Detailed ER Diagram Documentation**: [docs/database/ER-DIAGRAM.md](docs/database/ER-DIAGRAM.md)  
📊 **Mermaid Diagram**: [docs/database/er-diagram.mmd](docs/database/er-diagram.mmd)

### 1. Relational Database Design
The Sidd Academy platform utilizes a normalized PostgreSQL database designed with strict referential integrity, foreign key cascades, check constraints, unique indexes, and audit timestamps (`created_at`, `updated_at`).

### 2. Core Tables
1. **`users`**: Administrative staff, instructors, and students with roles (`student`, `admin`, `user`), bcrypt-hashed passwords, and status tracking.
2. **`courses`**: Master catalog of academic programs, pricing, slug identifiers, levels, student enrollment counts, and ratings.
3. **`subjects`**: Modular academic subjects mapped 1-to-many to courses with cascading deletions.
4. **`chapters`**: Units of study organized beneath individual subjects.
5. **`lessons`**: Daily scheduled classes and live/recorded lecture sessions with date and duration metadata.
6. **`videos`**: Streaming video URLs, YouTube integration IDs, providers, and resolution settings.
7. **`notes`**: Digital study materials and PDF notes attached to courses, subjects, chapters, or lessons, supporting free and paid access.
8. **`enrollments`**: Many-to-many relationship linking students to courses with progress tracking (`progress_percentage`) and unique constraints.
9. **`orders`**: Checkout transactions, total amounts, and Razorpay gateway references.
10. **`order_items`**: Polymorphic order line items (`course` or `note`) with immutable price snapshots.
11. **`payments`**: Transaction records with gateway response audits and status tracking.
12. **`note_purchases`**: Standalone digital note ownership table preventing duplicate purchases (`UNIQUE(user_id, note_id)`).
13. **`banners`**: Hero and carousel promotional banners for marketing campaigns.

### 3. Normalization & Integrity Decisions
- **Third Normal Form (3NF)**: Eliminated transitive dependencies and multi-valued attributes.
- **Cascading Rules**:
  - `ON DELETE CASCADE` on curriculum hierarchy (Course → Subject → Chapter → Lesson → Video) and user-owned records (User → Enrollments/Orders).
  - `ON DELETE SET NULL` on optional attachments (e.g., if a Course is removed, standalone Notes remain preserved with nullified foreign keys).
- **Check Constraints**: Enforced valid enumeration states (`role`, `level`, `item_type`, `payment_status`, `video_provider`) and non-negative values (`price >= 0`, `rating BETWEEN 0 AND 5.0`).
- **Indexes**: Created high-performance B-tree indexes on foreign keys, email lookups, and unique slugs.

### 4. Migration Strategy
Migrations are structured in atomic, sequentially numbered files inside `server/src/database/migrations/`:
- `001_create_users.sql`
- `002_create_courses.sql`
- `003_create_subjects.sql`
- `004_create_chapters.sql`
- `005_create_lessons.sql`
- `006_create_videos.sql`
- `007_create_notes.sql`
- `008_create_enrollments.sql`
- `009_create_orders.sql`
- `010_create_order_items.sql`
- `011_create_payments.sql`
- `012_create_note_purchases.sql`
- `013_create_banners.sql`

Run migrations via npm:
```bash
npm run db:migrate
```

### 5. Development Seed Data
Development seeds are modularized under `server/src/database/seeds/`:
- **Users**: 1 Admin (`admin@siddacademy.com`) and 2 Students (`student@siddacademy.com`, `aman.gupta@example.com`).
- **Courses**: 2 comprehensive programs (PERN Stack & DSA in Java).
- **Curriculum**: Subjects, chapters, daily classes, and video streams.
- **Notes**: Free cheat sheets and premium study guides.
- **Enrollments & Orders**: Active enrollments, completed Razorpay orders, payments, and note purchases.

Run seed script via npm:
```bash
npm run db:seed
```

---

## 🔐 Phase 3 — Authentication & RBAC

### 1. Architectural Overview
Phase 3 implements production-grade authentication and Role-Based Access Control (RBAC) across the Sidd Academy platform:
- **Zero Plaintext Password Policy**: All passwords are salted and hashed using `bcrypt` (10 rounds) before persistence.
- **Stateless Authentication**: Signed JSON Web Tokens (JWT) containing user ID and normalized role.
- **Layered Architecture**: Decoupled `auth.routes.js` → `auth.controller.js` → `auth.service.js` → `auth.repository.js`.

### 2. Supported Roles & Hierarchy
| Role | Identifier | Permissions & Capabilities |
|---|---|---|
| **STUDENT** | `STUDENT` / `student` | Access public courses & notes, browse enrolled courses, manage account profile & security, stream purchased classes, download purchased study materials. |
| **ADMIN** | `ADMIN` / `admin` | Full platform administrative control: user management, course/subject/chapter/lesson creation, banner controls, analytics dashboard, order audits. |

### 3. Authentication Endpoints
- **`POST /api/v1/auth/register`**: Validates input format (name, email, password ≥6 chars), verifies email uniqueness, hashes password, saves user with default `student` role, issues signed JWT access token, and sets HTTP-only refresh cookie.
- **`POST /api/v1/auth/login`**: Validates credentials using `bcrypt.compare`, updates last login timestamp, issues signed JWT token and refresh cookie.
- **`GET /api/v1/auth/me`**: Returns sanitized profile (`id`, `name`, `email`, `role`, `phone`, `avatar`, `isActive`) of the currently authenticated user.
- **`POST /api/v1/auth/logout`**: Clears authentication cookies and invalidates client session.
- **`PUT /api/v1/auth/profile`**: Allows authenticated users to update personal details (name, phone, avatar).
- **`PUT /api/v1/auth/change-password`**: Verifies current password before hashing and saving new password.

### 4. Middleware & Route Protection
- **`authenticate.js` (`authenticate` / `protect`)**:
  - Extracts `Bearer <token>` from HTTP `Authorization` header or cookie.
  - Cryptographically verifies token signature and expiration.
  - Queries user repository to guarantee active account state.
  - Injects `req.user` payload into request context.
  - Rejects unauthenticated requests with `401 Unauthorized`.
- **`authorize.js` (`authorize(...roles)` / `adminOnly`)**:
  - Validates user role against allowed role list (e.g. `authorize('ADMIN')`, `authorize('STUDENT', 'ADMIN')`).
  - Normalizes case-insensitivity (`admin` ↔ `ADMIN`, `student` ↔ `STUDENT`).
  - Rejects non-permitted roles with `403 Forbidden`.

### 5. Verification & Test Suite
All authentication and RBAC workflows have been verified:
1. **Student Registration**: `POST /api/v1/auth/register` returns `201 Created` with sanitized user object and JWT token.
2. **Student Login**: `POST /api/v1/auth/login` returns `200 OK` with valid JWT token.
3. **Invalid Password**: `POST /api/v1/auth/login` with bad password returns `401 Unauthorized`.
4. **Unauthorized Access**: Accessing protected routes (e.g., `GET /api/v1/auth/me`) without a token returns `401 Unauthorized`.
5. **Admin Authorized Route**: Admin token accessing `GET /api/v1/admin/dashboard` returns `200 OK` with dashboard statistics.
6. **Student Role Enforcement**: Student token attempting `GET /api/v1/admin/dashboard` is strictly rejected with `403 Forbidden` (`Access denied. Role 'STUDENT' is not authorized to access this resource. Required: ADMIN`).

---

## 📚 Phase 4 — Course and Academic Content Management

### 1. Academic Hierarchy Overview
Phase 4 establishes the strict four-tier academic structure for Sidd Academy:
```
Course (e.g., Class 12 Physics Electromagnetism Mastery)
  └── Subject (e.g., Electrodynamics & Waves)
        └── Chapter (e.g., Electromagnetic Induction & Lenz Law)
              └── Lesson / Class (e.g., Faraday's Law & Induced EMF Derivations)
                    └── Video & Notes (YouTube Lecture Stream & PDF Study Material)
```

### 2. Architecture & Design Principles
- **Strict Separation of Concerns**:
  - **Routes (`routes/*.routes.js`)**: Declarative HTTP route definitions, URL parameter routing, and middleware mounting (`authenticate`, `authorize('ADMIN')`, validation chains).
  - **Validators (`validators/*.validator.js`)**: Robust input sanitization and schema constraints via `express-validator` (required fields, price numbers, positive integers, valid dates, URL patterns).
  - **Controllers (`controllers/*.controller.js`)**: HTTP request decoding, response status codes, standardized JSON responses (`sendSuccess`, `AppError`). **Zero SQL queries reside in controllers.**
  - **Services (`services/*.service.js`)**: Business rules, relational hierarchy assembly, automated URL slug generation, duplicate slug conflict resolution, and sequencing/ordering defaults.
  - **Repositories (`repositories/*.repository.js`)**: Relational PostgreSQL parameterization (`courses`, `subjects`, `chapters`, `lessons` / `daily_classes`), snake_case to camelCase normalization, and graceful in-memory mock store fallback.
- **Relational Integrity**: Foreign key constraints with cascading deletes across `Course → Subject → Chapter → Lesson`.

### 3. API Reference

#### Courses (`/api/v1/courses`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/courses` | Public | List published courses with pagination (`?page=1&limit=9`), search (`?search=`), and level filter (`?level=`). |
| `GET` | `/api/v1/courses/:id` | Public | Get single course by ID or slug with full nested hierarchy (`subjects → chapters → lessons`). |
| `GET` | `/api/v1/courses/:id/content` | Public | Get course syllabus outline. |
| `POST` | `/api/v1/courses` | Admin | Create a new course with title, description, price, discount price, level, duration, and thumbnail. |
| `PUT` | `/api/v1/courses/:id` | Admin | Update course metadata, pricing, or publication status. |
| `DELETE` | `/api/v1/courses/:id` | Admin | Delete course (cascades to child subjects, chapters, and lessons). |

#### Subjects (`/api/v1/subjects`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/subjects` | Public | List subjects for a course (`?courseId=:id`). |
| `GET` | `/api/v1/subjects/:id` | Public | Get single subject details. |
| `POST` | `/api/v1/subjects` | Admin | Create subject linked to parent course with sequential order. |
| `PUT` | `/api/v1/subjects/:id` | Admin | Update subject name or description. |
| `PUT` | `/api/v1/subjects/reorder` | Admin | Batch reorder subjects via `{ orders: [{ id, order }] }`. |
| `DELETE` | `/api/v1/subjects/:id` | Admin | Delete subject (cascades to chapters and lessons). |

#### Chapters (`/api/v1/chapters`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/chapters` | Public | List chapters for a subject (`?subjectId=:id`). |
| `GET` | `/api/v1/chapters/:id` | Public | Get single chapter details. |
| `POST` | `/api/v1/chapters` | Admin | Create chapter linked to parent subject. |
| `PUT` | `/api/v1/chapters/:id` | Admin | Update chapter title or description. |
| `PUT` | `/api/v1/chapters/reorder` | Admin | Batch reorder chapters via `{ orders: [{ id, order }] }`. |
| `DELETE` | `/api/v1/chapters/:id` | Admin | Delete chapter (cascades to lessons). |

#### Lessons / Daily Classes (`/api/v1/lessons` & `/api/v1/classes`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/lessons` | Public | List scheduled lessons for a chapter (`?chapterId=:id`). |
| `GET` | `/api/v1/lessons/:id` | Public | Get single lesson/class with video streaming URL. |
| `POST` | `/api/v1/lessons` | Admin | Create lesson with `chapterId`, `title`, `classDate`, `duration`, `videoUrl`, `isLive`. |
| `PUT` | `/api/v1/lessons/:id` | Admin | Update lesson metadata, reschedule class date, or update video URL. |
| `PUT` | `/api/v1/lessons/reorder` | Admin | Batch reorder lessons via `{ orders: [{ id, order }] }`. |
| `DELETE` | `/api/v1/lessons/:id` | Admin | Delete lesson. |

### 4. Frontend & User Experience
- **Public Course Catalog (`CoursesPage.jsx`)**:
  - Grid view featuring course level tags, rating badges, duration indicators, student counters, and real-time search/filter inputs.
  - Interactive pagination controls with empty filter reset states.
- **Academic Hierarchy Syllabus Explorer (`CourseDetailPage.jsx`)**:
  - Interactive accordion view rendering complete nested hierarchy: Subjects → Chapters → Scheduled Daily Classes.
  - Video player modal for YouTube lecture previews and live class badges.
- **Admin Management Consoles**:
  - `ManageCourses.jsx`: Full CRUD table with level selectors, price/discount settings, and deletion confirmation dialogs.
  - `ManageSubjects.jsx`, `ManageChapters.jsx`, `ManageClasses.jsx`: Cascading drilldown selectors with modal forms for creating and editing syllabus hierarchy nodes.

---

## 🎥 Phase 5 — Digital Notes & YouTube Video Management

### 1. Architectural Strategy

#### Video Streaming & Hosting Policy
- **Zero Heavy Video Server Storage**: High-definition video files are **never** stored on or streamed through the application server filesystem.
- **YouTube Embed & Playlist Integration**: Video lectures are hosted externally on YouTube (or YouTube Playlists) and streamed client-side via privacy-enhanced YouTube player embeds (`https://www.youtube-nocookie.com/embed/*`).
- **Flexible Provider Support**: Normalized database structure supports `youtube`, `vimeo`, `s3`, and custom CDN providers.

#### Protected Digital Study Material & PDF Access
- **No Direct Filesystem Path Exposure**: Raw storage paths (such as `/uploads/notes/*.pdf` or private cloud buckets) are never leaked in public API responses.
- **Masked URLs for Locked Notes**: The Note Service automatically evaluates user authorization. If a note is premium/paid and the user is not entitled, `fileUrl` is strictly returned as `null` with `isLocked: true`.
- **Authenticated Access Verification (`/api/v1/notes/:id/access`)**: Checks if the note is free, if the requester is an admin, or if the student has purchased the individual note or the parent course. Only authorized callers receive verified streaming links or download tokens. Unauthorized requests fail with `403 Forbidden`.

### 2. Layered Architecture Separation

```
[ Client Request ]
       │
       ▼
[ Routes: /api/v1/notes & /api/v1/videos ]
       │
       ▼
[ Validators: validateCreateNote, validateUpdateNote, validateCreateVideo ]
       │
       ▼
[ Controllers: note.controller.js & video.controller.js ]
       │
       ▼
[ Services: note.service.js & video.service.js ]
       │   ├── Checks entitlements & masks locked URLs
       │   └── Extracts YouTube IDs & builds privacy embed links
       ▼
[ Repositories: note.repository.js & video.repository.js ]
       │   └── Parameterized PostgreSQL queries with mockStore fallback
       ▼
[ Database: notes, videos, note_purchases, enrollments ]
```

### 3. API Reference

#### Digital Notes (`/api/v1/notes`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/notes` | Public / Entitlement-aware | List study notes with `isLocked` flags, filtered by course, subject, or free/paid status. Raw URLs are masked for locked notes. |
| `GET` | `/api/v1/notes/:id` | Public / Entitlement-aware | Get note metadata with access status. |
| `GET` | `/api/v1/notes/:id/access` | Authenticated | Verify entitlement and retrieve authorized PDF file URL / stream payload. |
| `GET` | `/api/v1/notes/:id/download` | Authenticated | Download note PDF file and increment download analytics counter. |
| `POST` | `/api/v1/notes` | Admin | Upload note PDF, set title, description, price, free/paid status, course/subject/chapter hierarchy, and publication state. |
| `PUT` | `/api/v1/notes/:id` | Admin | Update note metadata and pricing. |
| `DELETE` | `/api/v1/notes/:id` | Admin | Delete digital note. |

#### Videos (`/api/v1/videos`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/videos` | Public | List video streams with generated YouTube privacy embed URLs. |
| `GET` | `/api/v1/videos/:id` | Public | Get single video stream details. |
| `GET` | `/api/v1/videos/lesson/:lessonId` | Public | Get all video streams associated with a lesson. |
| `POST` | `/api/v1/videos` | Admin | Associate a YouTube video or playlist URL with a lesson. |
| `PUT` | `/api/v1/videos/:id` | Admin | Update video title, URL, quality, or order. |
| `DELETE` | `/api/v1/videos/:id` | Admin | Remove video association. |

### 4. Frontend & User Experience
- **Interactive Notes Hub (`NotesPage.jsx` & `NoteCard.jsx`)**:
  - Distinct **FREE PDF** and **PREMIUM PDF** badges with exact pricing in ₹ INR.
  - **Locked Resource States**: Padlock indicators, disabled direct downloads, and one-click purchase/unlock modals.
  - **In-App PDF Reader Modal**: Authenticated reader window for previewing unlocked documents directly without leaving the app.
  - **Modular Hierarchy View (`ModularNoteViewer.jsx`)**: Organizes PDFs cleanly by Subject → Chapter → PDF 1 / PDF 2 modules.
- **Course Video Watch Studio (`CourseVideoWatchPage.jsx`)**:
  - Full-screen 16:9 YouTube video player with custom controls, duration display, and chapter markers.
  - Collapsible course curriculum sidebar with lecture progress markers.
  - Embedded Study Notes tab for rapid downloading of PDFs attached to the current lesson.
  - Prev / Next lecture quick navigation.
- **Admin Video & Notes Management**:
  - `ManageVideos.jsx`: Dynamic cascading dropdowns (Course → Subject → Chapter → Lesson) and live YouTube preview before saving.
  - `ManageNotes.jsx`: PDF file upload, pricing controls, page count configuration, and download tracking.

---

## 🏛️ Current Architecture

The platform uses a strict decoupled PERN architecture with clean separation of concerns:

```
[ Frontend Client (React 18 + Vite + React Router v6) ]
                         │
                         ▼ (Axios REST API Calls)
[ Express.js Application Server (Port 3000) ]
                         │
                         ▼
[ Middleware Pipeline ] (Helmet → CORS → CookieParser → Morgan → Validate/Auth)
                         │
                         ▼
[ Route Definitions ] (/api/v1/health, /api/v1/auth, /api/v1/courses, ...)
                         │
                         ▼
[ Controller Layer ] (Extracts params, calls services, formats JSON response)
                         │
                         ▼
[ Service Layer ] (Executes business rules, password hashing, token creation)
                         │
                         ▼
[ Repository Layer ] (Constructs parameterized SQL queries)
                         │
                         ▼
[ PostgreSQL Database ] (Relational schema with foreign key integrity)
```

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + React Router v6 |
| Backend | Node.js + Express.js |
| Database | PostgreSQL + node-postgres (`pg`) |
| Architecture | Controller → Service → Repository → PostgreSQL |
| Auth | JWT (Access + Refresh Tokens) + bcryptjs |
| Payments | Razorpay (UPI, Cards, Net Banking) |
| File Storage | Local Disk (swappable to Cloudinary/S3) |
| Emails | Nodemailer |

## 📁 Project Structure

```
sidd-academy/
├── client/                 # React frontend (Vite)
│   └── src/
│       ├── api/            # Axios API modules
│       ├── components/     # Reusable components
│       ├── context/        # Auth context
│       ├── hooks/          # Custom hooks
│       ├── pages/          # Page components
│       ├── routes/         # Router + guards
│       ├── styles/         # Global CSS design system
│       └── utils/          # Helper functions
└── server/                 # Node.js + Express backend
    └── src/
        ├── config/         # DB, Razorpay config
        ├── controllers/    # Route handlers
        ├── middleware/     # Auth, admin, upload guards
        ├── models/         # Mongoose schemas
        ├── routes/         # Express route definitions
        └── utils/          # Helpers, email, tokens
```

## ⚡ Quick Start

### Prerequisites
- Node.js >= 18
- MongoDB Atlas account (or local MongoDB)
- Razorpay account (for payments)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd sidd-academy
npm run install:all
```

### 2. Configure Environment

```bash
# Server
cp server/.env.example server/.env
# Edit server/.env with your values:
# - MONGODB_URI
# - JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
# - RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
# - SMTP credentials (for emails)

# Client
cp client/.env.example client/.env
# Edit client/.env:
# - VITE_RAZORPAY_KEY_ID
```

### Phase 7 — Student Experience and Dashboard

#### 1. Overview & Objectives
Phase 7 introduces a dedicated, high-performance Student Learning Portal and Dashboard featuring:
- **Welcome & Learning Stats Section**: Real-time progress metrics (enrolled courses, purchased notes, completed lessons, and overall syllabus completion percentage).
- **Enrolled Courses Explorer**: Rich course cards with syllabus completion meters, instructor information, and instant "Resume Learning" actions.
- **Purchased Notes & Digital Library**: Digital viewer with in-browser PDF reader, chapter filtering, and secure tokenized download triggers.
- **Scheduled & Recent Classes**: Direct access to classroom video lectures and recorded sessions.
- **Available Courses Catalog**: Catalog recommendations highlighting new batches, pricing, and discount tags.
- **Interactive Course Learning Interface**:
  - Hierarchical structure: `Course` → `Subjects` → `Chapters` → `Lessons` → `Video Player` + `Attached Notes`.
  - State management for completed lessons with optimistic UI updates and backend progress recalculation.
  - Distinct UX for locked vs. accessible content with transparent price tags and direct enrollment CTAs.
- **Responsive Navigation**: Desktop sidebar with active states and mobile quick-access tabs, skeleton loaders, and empty/error states.

#### 2. Student Flow Architecture
```
Student Login / Registration
  ↓
Student Dashboard (/student/dashboard)
  ├── 1. Welcome & Continue Learning Hero
  ├── 2. Enrolled Courses (/student/my-courses)
  │      ↓
  │    Course Learning Room (/courses/:id/watch)
  │      ├── Subject Accordion
  │      │     └── Chapter Accordion
  │      │           └── Lesson Item
  │      ├── Video Player (YouTube HD / HTML5)
  │      ├── Toggle "Mark as Completed"
  │      └── Chapter Study Notes (In-App PDF Reader / Download)
  ├── 3. Purchased Digital Notes (/student/notes)
  │      ├── Subject Filter Tabs & Search
  │      ├── Read Online Modal
  │      └── Secure Download Link
  ├── 4. Order & Transaction History (/student/orders)
  └── 5. Student Profile & Password Security (/student/profile)
```

#### 3. Database Schema: Lesson Progress (`lesson_progress`)
```sql
CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id VARCHAR(255) NOT NULL,
  is_completed BOOLEAN DEFAULT TRUE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_user_lesson UNIQUE (user_id, course_id, lesson_id)
);
```

#### 4. Student API Endpoints (`/api/v1/student`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/v1/student/dashboard` | Aggregated dashboard data (stats, courses, notes, classes, activities, profile) | Student / Auth |
| `GET` | `/api/v1/student/courses` | Enrolled courses with calculated progress percentages | Student / Auth |
| `GET` | `/api/v1/student/notes` | Purchased digital notes with secure access | Student / Auth |
| `GET` | `/api/v1/student/recent-classes` | Recent video lectures for enrolled courses | Student / Auth |
| `GET` | `/api/v1/student/activities` | Student activity timeline and progress events | Student / Auth |
| `POST` | `/api/v1/student/lesson-progress` | Toggle lesson completion and recalculate syllabus percentage | Student / Auth |

### 3. Start Development

```bash
npm run dev
```

This starts:
- **API Server** → http://localhost:5000
- **React Client** → http://localhost:5173

## 🔑 API Endpoints

### Auth
| Method | Endpoint | Access |
|---|---|---|
| POST | /api/v1/auth/register | Public |
| POST | /api/v1/auth/login | Public |
| POST | /api/v1/auth/logout | Auth |
| GET | /api/v1/auth/me | Auth |

### Courses
| Method | Endpoint | Access |
|---|---|---|
| GET | /api/v1/courses | Public |
| GET | /api/v1/courses/:id | Public |
| GET | /api/v1/courses/:id/content | Auth + Purchased |
| POST | /api/v1/courses | Admin |
| PUT | /api/v1/courses/:id | Admin |
| DELETE | /api/v1/courses/:id | Admin |

### Notes
| Method | Endpoint | Access |
|---|---|---|
| GET | /api/v1/notes | Public (metadata) |
| GET | /api/v1/notes/:id/download | Auth + Purchased (for paid) |
| POST | /api/v1/notes | Admin |

### Payments
| Method | Endpoint | Access |
|---|---|---|
| POST | /api/v1/payments/create-order | Auth |
| POST | /api/v1/payments/verify | Auth |
| GET | /api/v1/payments/my-orders | Auth |

## 👤 User Roles

| Role | Access |
|---|---|
| `student` | Browse, purchase, access purchased content |
| `admin` | Full CRUD, user management, dashboard |

## 🔐 Environment Variables

### Server (`server/.env`)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
CLIENT_URL=http://localhost:5173
```

### Client (`client/.env`)
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_RAZORPAY_KEY_ID=...
```

## 🏗️ Deployment

### Backend
- Deploy to **Railway**, **Render**, or **VPS**
- Set all environment variables
- `npm start` runs the production server

### Frontend
- Run `npm run build` in client/
- Deploy `dist/` to **Netlify**, **Vercel**, or serve via Nginx

## 📦 Adding New Features

The codebase is modular. To add a new feature (e.g., Live Quiz):

1. **Model**: `server/src/models/Quiz.model.js`
2. **Controller**: `server/src/controllers/quiz.controller.js`
3. **Routes**: `server/src/routes/quiz.routes.js`
4. **Mount**: Add to `server/server.js`
5. **API**: `client/src/api/quizApi.js`
6. **Pages**: `client/src/pages/Quiz*.jsx`
7. **Routes**: Add to `AppRouter.jsx`

## 🔄 Storage Migration

PDFs are stored locally in `server/uploads/`. To migrate to **Cloudinary** or **AWS S3**:
1. Create `server/src/config/storage.js` with the new provider
2. Replace `uploadPDF` middleware in `upload.middleware.js`
3. Update `downloadNote` controller to use signed URLs

---
*Developed by Website Development Team, SOE, JNU — New Delhi, India*
