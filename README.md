# Sidd Academy

An enterprise-grade, full-stack educational platform for online coaching, structured courses, hierarchical video classrooms, chapter-wise digital notes, and integrated payment workflows.

---

## Project Overview

**Sidd Academy** is engineered to deliver a seamless learning experience for students and an intuitive content management system for educators. The platform bridges the gap between structured academic curricula and digital distribution by providing:
- High-definition video lecture streaming with structured course trees (`Course` → `Subject` → `Chapter` → `Lesson`).
- Digital PDF study notes with in-browser previewers, free sample pages, and tokenized download security.
- Comprehensive student dashboards tracking syllabus completion, active enrollments, and study milestones.
- Integrated payment processing via Razorpay with immediate automated access provisioning.
- A full-featured administrative CMS allowing instructors to manage courses, batches, materials, banners, and student access without developer intervention.

---

## Features

### 🎓 Student Experience
- **Interactive Course Player**: Hierarchical curriculum sidebar, YouTube HD playback, and previous/next lesson controls.
- **Granular Progress Tracking**: Interactive "Mark as Complete" action that persists lesson state and recalculates syllabus completion metrics.
- **Digital Notes Library**: Instant in-app PDF reader modal, subject filtering, and tokenized download links for purchased and free materials.
- **Student Dashboard**: Telemetry overview showing enrolled batches, completed lectures, total notes, and a one-click **Resume Learning** banner.
- **Order & Transaction History**: Transparent breakdown of payment receipts and Razorpay gateway transaction references.

### 🛠️ Instructor & Admin CMS
- **Academic Hierarchy Manager**: Full CRUD operations for Courses, Subjects, Chapters, Lessons, and Video streams.
- **Digital Notes Management**: Upload study PDFs, configure free or paid pricing in ₹ INR, and audit download statistics.
- **User & Student Administration**: Directory of registered users, role elevation (`Student` ↔ `Admin`), and account status controls.
- **Order & Payment Auditing**: Real-time status filters (`PAID`, `PENDING`, `FAILED`) and itemized receipt inspection.
- **Dynamic Banners**: Management of homepage promotional carousels, discount tags, and active visibility toggles.

### 🛡️ Security & Enterprise Resilience
- **Dual-Layer RBAC**: Middleware-enforced server-side route guards (`authenticate` + `authorize('ADMIN')`).
- **SQL Injection Prevention**: 100% parameterized database queries across all PostgreSQL repositories.
- **Hybrid Storage Engine**: Resilient PostgreSQL persistence with automatic in-memory fallback for zero-downtime environments.
- **Cryptographic Security**: BCrypt password hashing and stateless JSON Web Tokens (JWT) with access and refresh cycles.

---

## Technology Stack

### Frontend
- **Framework**: React 18 with Vite
- **Routing**: React Router v6 with authenticated and role-protected route guards
- **Styling**: Tailwind CSS utility architecture with modern CSS custom properties
- **Icons**: React Icons (Feather Icon pack)
- **HTTP Client**: Axios with request/response interceptors for token refresh

### Backend
- **Runtime**: Node.js & Express.js (REST API architecture)
- **Security**: Helmet, CORS, Express-Rate-Limit, BCryptJS, JSONWebToken
- **Validation**: Express-Validator with sanitization rules
- **Database Client**: `pg` (node-postgres connection pool)
- **Payment Processing**: Razorpay Node SDK with HMAC-SHA256 signature verification

### Database
- **Engine**: PostgreSQL 14+
- **Migrations**: 15 version-controlled raw SQL migration scripts
- **Seeding**: Deterministic initial dataset for courses, curriculum trees, notes, and demo accounts

---

## System Architecture

```mermaid
flowchart TD
    subgraph Client ["Client Layer (React 18 + Vite)"]
        UI[Tailwind UI & Responsive Components]
        Router[AppRouter + Protected Route Guards]
        AuthCtx[Auth Context & Token Interceptors]
    end

    subgraph Server ["Server Layer (Express.js API)"]
        Gateway[Express REST Gateway :3000]
        Security[Helmet + CORS + Rate Limiter]
        AuthMW[JWT Auth & RBAC Middleware]
        Controllers[API Controllers]
        Services[Business Logic & Payment Services]
        Repos[Parameterized SQL Repositories]
        MockStore[Resilient In-Memory Mock Store]
    end

    subgraph Database ["Persistence Layer"]
        PG[(PostgreSQL Relational DB)]
    end

    subgraph External ["External Services"]
        Razorpay[Razorpay Payment Gateway]
        YouTube[YouTube Video Streams]
    end

    Client <-->|REST API JSON| Gateway
    Gateway --> Security --> AuthMW --> Controllers --> Services --> Repos
    Repos <-->|Parameterized Queries| PG
    Repos -.->|Automatic Fallback| MockStore
    Services <-->|Signature Verification| Razorpay
    Client <-->|Embedded Player| YouTube
```

---

## Database Architecture

The persistence model utilizes strict foreign keys, cascade rules on parent deletions, and unique constraints to prevent duplicate enrollments or duplicate progress entries.

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
    CHAPTERS ||--o{ LESSONS : "contains"
    LESSONS ||--o| VIDEOS : "streams"
    LESSONS ||--o{ LESSON_PROGRESS : "recorded_in"
    
    NOTES ||--o{ NOTE_PURCHASES : "purchased_as"
    ORDERS ||--o{ ORDER_ITEMS : "contains"
    ORDERS ||--o| PAYMENTS : "verified_by"
```

---

## ER Diagram

The complete database schema diagram and detailed field definitions are documented in [`docs/database/schema-and-er-diagram.md`](docs/database/schema-and-er-diagram.md).

---

## Project Structure

```
.
├── .env.example                # Template configuration for environment variables
├── README.md                   # Comprehensive platform documentation
├── metadata.json               # Application metadata and platform capabilities
├── package.json                # Root workspace configuration
├── docs/                       # Architectural and technical documentation
│   ├── api/                    # API reference specifications
│   ├── architecture/           # System and component diagrams
│   ├── database/               # Relational schemas and ER diagrams
│   └── development/            # Developer setup and contribution guides
├── client/                     # Frontend Single Page Application (React 18 + Vite)
│   ├── index.html              # HTML entry point with synchronized meta tags
│   ├── vite.config.js          # Vite compilation configuration
│   └── src/
│       ├── api/                # Axios endpoints (auth, courses, student, admin, orders)
│       ├── components/         # Shared layouts, navigation, and student/admin sidebars
│       ├── context/            # AuthContext and state providers
│       ├── pages/              # Public, student portal, and admin CMS pages
│       └── routes/             # AppRouter and ProtectedRoute wrappers
└── server/                     # Backend REST API Server (Node.js + Express)
    ├── server.js               # Application entry point & HTTP listener
    └── src/
        ├── config/             # Database connection pool and environment loading
        ├── controllers/        # Request handlers with validation & error formatting
        ├── database/           # 15 SQL migrations and database seeders
        ├── middleware/         # Authentication, RBAC, error handlers, and rate limiters
        ├── repositories/       # Parameterized SQL data access layer
        ├── routes/             # Versioned REST route definitions (/api/v1/*)
        └── services/           # Business logic, Razorpay gateway, and token managers
```

---

## Installation

```bash
# 1. Clone repository
git clone https://github.com/sidd-academy/sidd-academy.git
cd sidd-academy

# 2. Install workspace dependencies
npm install
```

---

## Environment Variables

Configure `.env` in the project root:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sidd_academy
CORS_ORIGIN=http://localhost:3000

# Authentication Secrets
JWT_SECRET=your_super_secret_jwt_key
JWT_ACCESS_SECRET=your_access_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Razorpay Gateway
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_secret_key

# Vite Frontend Variables
VITE_API_URL=http://localhost:3000/api/v1
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id
```

---

## Database Setup

```bash
# Execute 15 versioned migrations
npm run db:migrate

# Seed initial courses, subjects, chapters, notes, and demo accounts
npm run db:seed
```

---

## Running the Backend

```bash
# Start backend server with live reload
npm --workspace=server run dev
```

---

## Running the Frontend

```bash
# Start Vite development server
npm --workspace=client run dev
```

---

## API Documentation

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Register student account | Public |
| `POST` | `/api/v1/auth/login` | Authenticate and obtain JWTs | Public |
| `GET` | `/api/v1/courses` | List published courses | Public |
| `GET` | `/api/v1/notes` | List published digital notes | Public |
| `GET` | `/api/v1/student/dashboard` | Student learning metrics & active courses | Student / Auth |
| `POST` | `/api/v1/student/lesson-progress`| Toggle lesson completion status | Student / Auth |
| `POST` | `/api/v1/orders/checkout` | Create checkout order for course or note | Student / Auth |
| `POST` | `/api/v1/payments/verify` | Verify payment and provision access | Student / Auth |
| `GET` | `/api/v1/admin/dashboard` | Telemetry metrics (students, courses, revenue) | Admin |
| `POST` | `/api/v1/admin/courses` | Create new course batch | Admin |
| `POST` | `/api/v1/admin/notes` | Upload study PDF note | Admin |

*For complete API specifications, see [`docs/api/api-reference.md`](docs/api/api-reference.md).*

---

## Authentication

Authentication is managed via JSON Web Tokens:
1. **Access Tokens**: Short-lived (15 minutes) bearer tokens sent in `Authorization: Bearer <token>` headers.
2. **Refresh Tokens**: Long-lived (7 days) tokens used to obtain new access tokens without requiring re-login.
3. **Password Security**: Salted hashes generated using BCrypt with 10 salt rounds.

---

## RBAC

Role-Based Access Control is enforced on the server:
- **`STUDENT`**: Access to personal dashboard, enrolled courses, purchased notes, and checkout workflows.
- **`ADMIN`**: Comprehensive access to all CMS modules, user management, course editing, and financial transaction auditing.

---

## Student Flow

```
Student Registration / Login
  ↓
Student Dashboard (/student/dashboard)
  ├── 1. View Enrolled Courses & Click "Resume Learning"
  │      ↓
  │    Course Learning Room (/courses/:id/watch)
  │      ├── Select Subject → Chapter → Lesson
  │      ├── Watch HD Video Lecture
  │      ├── Toggle "Mark as Completed"
  │      └── Open Attached Chapter PDF Notes
  ├── 2. Browse & Read Digital Notes (/student/notes)
  ├── 3. Purchase New Batches via Razorpay Checkout
  └── 4. Inspect Orders & Receipts (/student/orders)
```

---

## Admin Flow

```
Admin Login (admin@siddacademy.com)
  ↓
Admin CMS Dashboard (/admin/dashboard)
  ├── Manage Courses & Pricing (/admin/courses)
  ├── Build Academic Curriculum (/admin/subjects & /admin/chapters)
  ├── Schedule Lessons & Attach Videos (/admin/classes & /admin/videos)
  ├── Upload Digital Study Notes & Set Pricing (/admin/notes)
  ├── Oversee Student Directory & Roles (/admin/users)
  └── Audit Transactions & Razorpay Gateway IDs (/admin/orders)
```

---

## Payment Flow

1. Student initiates checkout for a Course or PDF Note (`POST /api/v1/orders/checkout`).
2. Server validates item pricing and creates a Razorpay Order ID.
3. Client opens Razorpay Checkout modal with the Order ID.
4. On successful transaction, client transmits `razorpay_payment_id`, `razorpay_order_id`, and `razorpay_signature` to `/api/v1/payments/verify`.
5. Server recalculates HMAC-SHA256 signature; upon match, automatically provisions course enrollment or note purchase entitlement.

---

## Development Progress

### Phase 0 — Architecture & Repository Initialization
- Repository structuring, workspace configuration, Tailwind setup, and base dependencies.

### Phase 1 — Database Architecture & Migrations
- 15 incremental SQL migrations establishing relational tables, foreign key cascades, and unique constraints.

### Phase 2 — Authentication & Authorization Subsystem
- JWT token lifecycle, refresh mechanics, BCrypt password hashing, and role middleware.

### Phase 3 — Public Course Catalog & Curriculum Discovery
- Public course listings, filtering, detailed course pages, and batch curriculum outlines.

### Phase 4 — Digital Study Materials & PDF Notes Hub
- Digital notes store, pricing configuration, in-browser PDF reader, and download security.

### Phase 5 — Promotional Banners & Daily Classes
- Homepage announcement carousel and daily lecture schedule modules.

### Phase 6 — Orders, Checkout & Razorpay Integration
- Order generation, Razorpay payment verification, and automated entitlement provisioning.

### Phase 7 — Student Learning Portal & Watch Interface
- Student dashboard, hierarchical curriculum tree, lesson completion persistence, and watch room.

### Phase 8 — Administrative CMS & Platform Management
- Complete administrative dashboard, curriculum CRUD, user role management, and financial audit tools.

### Phase 9 — Final QA, Security, Documentation & Production Polish
- Comprehensive QA, parameterized query audits, security hardening, full documentation suite, and zero-error production build.

---

## Testing

```bash
# Run linting across workspaces
npm run lint

# Run production compilation build
npm run build
```

---

## Security

- **SQL Injection Prevention**: All queries execute via parameterized placeholders (`$1, $2, ...`).
- **XSS & Header Protection**: Helmet configuration enforces strict CSP and prevents MIME-type sniffing.
- **Authentication**: Stateless tokens with cryptographic signature validation on every protected route.
- **Access Control**: Strict role verification at the controller level prevents privilege escalation.

---

## Future Improvements

- **Offline Lecture Downloads**: Mobile progressive web app caching for offline lecture viewing.
- **Live Interactive Quizzes**: Real-time chapter assessment tests and automated scoring.
- **Automated Doubt Clearing Forum**: Student discussion threads linked directly to specific timestamps in video lectures.
