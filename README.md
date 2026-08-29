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
