# Sidd Academy — API Reference Documentation

All endpoints are prefixed with `/api/v1` and return standardized JSON payloads:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

---

## 1. Authentication Endpoints (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Register new student account with name, email, password, phone | None |
| `POST` | `/api/v1/auth/login` | Authenticate user and return access & refresh JWT tokens | None |
| `POST` | `/api/v1/auth/refresh-token` | Generate new access token using valid refresh token | None |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile and active permissions | Yes |
| `POST` | `/api/v1/auth/logout` | Invalidate current session | Yes |
| `POST` | `/api/v1/auth/forgot-password`| Send password reset instructions to registered email | None |
| `POST` | `/api/v1/auth/reset-password` | Reset password using reset token | None |

---

## 2. Public Catalog Endpoints

### 2.1 Courses (`/api/v1/courses`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/courses` | List published courses with query filters (`search`, `category`, `page`) | None |
| `GET` | `/api/v1/courses/:id` | Retrieve comprehensive course details and curriculum tree | None / Optional |

### 2.2 Notes & Study Material (`/api/v1/notes`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/notes` | List published digital notes with search, class, and price filters | None |
| `GET` | `/api/v1/notes/:id` | Get note metadata and preview pages | None |
| `GET` | `/api/v1/notes/:id/download` | Download full PDF (validates entitlement or free status) | Yes |

### 2.3 Banners (`/api/v1/banners`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/banners` | Get active promotional hero banners | None |

---

## 3. Student Portal Endpoints (`/api/v1/student`)

All student routes require standard user authentication (`authenticate` middleware).

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/student/dashboard` | Aggregated student statistics, active courses, and recent classes |
| `GET` | `/api/v1/student/courses` | List enrolled courses with calculated syllabus completion percentage |
| `GET` | `/api/v1/student/notes` | List purchased digital PDF notes with read & download links |
| `GET` | `/api/v1/student/recent-classes` | List recent video lectures from enrolled courses |
| `GET` | `/api/v1/student/activities` | Student activity timeline and progress events |
| `POST` | `/api/v1/student/lesson-progress` | Toggle lesson completion status and recalculate course progress |

---

## 4. Checkout & Payment Endpoints (`/api/v1/payments` & `/api/v1/orders`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/orders/checkout` | Create order for course enrollment or note purchase | Yes |
| `GET` | `/api/v1/orders` | List user's historical orders and transaction status | Yes |
| `GET` | `/api/v1/orders/:id` | Retrieve specific order details and receipt | Yes |
| `POST` | `/api/v1/payments/verify` | Verify Razorpay payment signature and provision access | Yes |

---

## 5. Administrative CMS Endpoints (`/api/v1/admin`)

All administrative routes require `authenticate` and `authorize('ADMIN')` middleware.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/admin/dashboard` | Telemetry overview: total students, courses, notes, orders, revenue |
| `GET` | `/api/v1/admin/users` | List registered users with search and role filters |
| `PUT` | `/api/v1/admin/users/:id/role` | Update user role (`student` ↔ `admin`) |
| `PUT` | `/api/v1/admin/users/:id/status` | Update account status (`active` ↔ `suspended`) |
| `GET` | `/api/v1/admin/orders` | List all platform orders with status filtering |
| `POST` | `/api/v1/admin/courses` | Create new course batch |
| `PUT` | `/api/v1/admin/courses/:id` | Update course details, pricing, and status |
| `DELETE` | `/api/v1/admin/courses/:id` | Remove course |
| `POST` | `/api/v1/admin/subjects` | Create subject under a course |
| `POST` | `/api/v1/admin/chapters` | Create chapter under a subject |
| `POST` | `/api/v1/admin/classes` | Create video lesson under a chapter |
| `POST` | `/api/v1/admin/notes` | Create or upload digital study PDF note |
| `POST` | `/api/v1/admin/banners` | Create promotional banner slide |
