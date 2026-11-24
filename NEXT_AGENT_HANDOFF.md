# Sidd Academy Next-Agent Handoff

Date: 2026-10-29

## Latest Handoff Update

### RESOLVED: Frontend UI/UX Polish & Teacher/Student Workflow Fixes

1. **Teacher Curriculum & Study Material Attachment (`CurriculumPage.jsx`, `ManageCourses.jsx`):**
   - Added direct "Curriculum" action button in `ManageCourses.jsx` rows.
   - Synchronized `?courseId=` query param in `CurriculumPage.jsx` so selecting or arriving from a course auto-loads its curriculum tree.
   - Restored and rendered the previously unrendered Study Material / Notes attachment section in `CurriculumPage.jsx`, enabling teachers to attach and detach PDFs directly from the Lesson Editor.

2. **Student Watch & Classroom Experience (`CourseVideoWatchPage.jsx`, `CourseDetailPage.jsx`):**
   - Fixed non-responsive watch page grid by replacing inline styles with `.watch-grid` in `index.css` (stacks on screens < 1024px, eliminating player squishing on mobile/tablets).
   - Enrolled students now see "Play in Classroom" links in `CourseDetailPage.jsx` syllabus, linking directly into the video watch page with the selected lecture preloaded.
   - Replaced hardcoded dark colors (`#161826`, `#121420`, `#2d3047`) and `#fff` text with design tokens (`var(--bg-card)`, `var(--bg-secondary)`, `var(--text-primary)`, `var(--border)`).

3. **Navigation & Global Polish (`Navbar.jsx`, `NotesPage.jsx`, `HomePage.jsx`):**
   - Added click-outside listener to the user account dropdown in `Navbar.jsx` so it closes reliably.
   - Fixed hardcoded `#ffffff` on mobile drawer in `Navbar.jsx` to use `var(--bg-card)`.
   - Cleaned up PDF preview modals in `NotesPage.jsx` and `CourseVideoWatchPage.jsx` to match theme tokens.
   - Replaced `#ffffff` backgrounds in `HomePage.jsx` with `var(--bg-secondary)`.

### RESOLVED: HTTP 401 on Enroll / Payment Flow

**Root cause:** The JWT access token was configured to expire in **15 minutes** (`JWT_ACCESS_EXPIRES=15m` in `server/.env`). There was no automatic silent token-refresh mechanism in the frontend Axios client. Users who spent more than 15 minutes browsing before clicking Enroll received a 401 from the `authenticate` middleware, which displayed as a generic "Internal Server Error" in the UI.

**Fixes applied (2026-10-29):**

1. **`server/.env`** — Changed `JWT_ACCESS_EXPIRES` from `15m` → `7d`. Users now stay logged in for 7 days matching the refresh-token window, eliminating spurious session expiry mid-flow.

2. **`client/src/api/axiosInstance.js`** — Added silent token-refresh interceptor:
   - When any non-auth-check endpoint returns 401, the interceptor fires a single `POST /auth/refresh-token` call (using the httpOnly refresh cookie set at login).
   - Concurrent requests that also receive 401 are queued and retried once the new token arrives.
   - If refresh also fails (cookie expired / revoked), the 401 propagates as before.
   - `/auth/me` and `/auth/refresh-token` itself still cause hard logout + redirect.

3. **`client/src/pages/public/CourseDetailPage.jsx`** — Improved enrollment error handling:
   - 401 errors now show "Your session has expired" and redirect to login (with return-to URL).
   - 400 "already enrolled" responses correctly set `purchased=true` without an error toast.
   - Enroll button shows an animated spinner ("Opening Checkout…") during order creation.
   - `priceLabel` shown directly on the button (`Enroll — ₹999`) for clarity.
   - Guard added: if `razorpayOrderId` is missing from the order response, an explicit error is thrown before attempting to open the Razorpay modal.

4. **`client/src/pages/public/NotesPage.jsx`** — Applied same 401 / already-purchased error handling.

### RESOLVED: Paid Enrollment Logout & Checkout Hang Bugs
1. **Apparent Logout on Razorpay/Order Failures**:
   - Root Cause: `client/src/api/axiosInstance.js` had an aggressive response interceptor that treated ANY 401 on `/orders` as a session expiration, clearing `localStorage.getItem('siddToken')`, dispatching `sidd-auth-expired`, and immediately redirecting to `/login`.
   - Resolution: Confined 401 session-clear and redirect exclusively to session verification (`/auth/me`). Operational checkout and order failures now propagate their error messages to the calling UI so toasts display without wiping user authentication.
   - Header Formatting: In `server/src/middleware/authenticate.js`, replaced rigid `startsWith('Bearer ')` check with a case-insensitive regex pattern extracting the bearer token while stripping trailing delimiters.
   - Request Interceptor: Normalized `axiosInstance` to ensure `Authorization: Bearer <token>` is reliably assigned directly on request config headers.

2. **Divergent API Implementations**:
   - `client/src/api/orderApi.js` was passing a manual `authConfig()` with duplicated uppercase and lowercase headers (`Authorization` and `authorization`) and passing `undefined` body payload to `PATCH /orders/:id/cancel` and `/fail`.
   - `client/src/api/paymentApi.js` was a separate diverging wrapper.
   - Resolution: Consolidated `orderApi.js` to send standard clean payloads (`{}` for patch) and re-exported it directly from `paymentApi.js` for 100% backwards compatibility.

3. **Stuck "Processing..." Spinner on Checkout Dismissal / Timeout**:
   - In `CourseDetailPage.jsx` and `NotesPage.jsx`, the timeout guard captured `paymentLoading` from the initial closure (which was `false`), so `if (paymentLoading) finishCheckout()` never executed.
   - Resolution: Directly invoke `finishCheckout()` in the safety timer, reset `paymentLoading` immediately when `modal.ondismiss` or `payment.failed` triggers, and notify the user cleanly without leaving button disabled.

4. **Order Ownership & Mock ID Boundary in order.repository.js**:
   - Fixed `cancelOrder` and `failOrder` user checks to compare `order.userId === userId || order.user?.id === userId || order.user?._id === userId`.
   - Fixed `findById` so that if PostgreSQL returns 0 rows or non-UUID, it falls through to check `mockData.orders` instead of returning `null`.
- Confirm the exact token user ID and `req.user` shape reaching `OrderController`.
- Confirm whether order ownership checks compare UUID and mock IDs consistently.

Required payment debugging sequence:

1. Log/inspect the response status and body for create order, cancel, fail, and verify.
2. Verify the order ID returned by create order is the same ID sent to cancel/fail/verify.
3. Verify `req.user.id` matches the order's `user_id` for database users.
4. Verify no 401/403 is being converted into an apparent logout during Razorpay callbacks.
5. Verify the database row after dismissal: `orders.status`, `orders.payment_status`, and the related `payments.status`.
6. Add a server-side Razorpay webhook/reconciliation path before production. Browser dismissal alone cannot guarantee state after network loss or tab closure.
7. Add a retry-payment flow for `FAILED` and `CANCELLED` orders instead of creating confusing duplicate pending orders.

### Paid lesson access was recently corrected, but verify live data

The previous bug was caused by PostgreSQL hierarchy results returning `is_free` while the frontend checked `isFree`. The backend now maps both `lessons` and `dailyClasses` to camelCase fields in `server/src/repositories/course.repository.js`.

The course service now calculates effective price and does not treat a nonzero-price course as free solely because a stale `isFree` flag is true.

Still verify with real data:

- `GET /api/v1/courses/:id` must return each lesson with `isFree` and `isProtected`.
- A paid, unenrolled lesson must render locked in `CourseVideoWatchPage.jsx`.
- An enrolled student/admin may watch it.
- Do not rely only on frontend locking; protected video/PDF access must also be enforced server-side.

### Teacher/admin UX remains unfinished

There is now a Course Studio prototype, but it is not a finished teacher dashboard. The user explicitly said the current admin UX still feels confusing.

- `client/src/pages/admin/AdminDashboard.jsx` has been reframed as `Teacher workspace`, but it is still mostly metrics and links.
- `client/src/pages/admin/CurriculumPage.jsx` is a Course Studio tree/editor prototype, not a polished authoring workflow.
- General `Study Materials` and `Lesson Videos` pages must remain available; they are separate libraries from lesson-specific attachments.
- Course Studio can attach existing PDFs to a lesson, but the live workflow still needs real browser testing.
- Do not remove general resource management while improving in-course attachment.

### Course thumbnail upload

Course thumbnails now use multipart upload instead of a URL field:

- Frontend: `client/src/pages/admin/ManageCourses.jsx`, `client/src/api/courseApi.js`
- Backend: `server/src/routes/course.routes.js`, `server/src/controllers/course.controller.js`, `server/src/middleware/upload.middleware.js`
- Upload field: `thumbnail`
- Allowed types: JPEG, PNG, WebP; maximum 5 MB
- Stored under `/uploads/images`

Verify this against a running server and confirm the uploaded URL is visible in public course cards/detail pages.

### UUID/mock data boundary

Several guards were added so legacy mock IDs such as `user_admin_01` do not reach PostgreSQL UUID columns. If any SQL logs still show a mock ID, fix the boundary at the owning repository rather than silently swallowing the error.

Important files:

- `server/src/repositories/auth.repository.js`
- `server/src/repositories/user.repository.js`
- `server/src/repositories/student.repository.js`
- `server/src/repositories/order.repository.js`

Do not treat fallback-to-mock after a real database error as a production-safe behavior.

## Mission

Continue the Sidd Academy cleanup. The main remaining work is a complete frontend UX pass, especially consistency across public, student, and admin screens. Do not start the dev servers automatically. The user runs them manually.

## Project

- Root workspace: `sidd-academy`
- Frontend: Vite + React 18 in `client/`
- Backend: Express + PostgreSQL in `server/`
- Frontend API base: `client/.env` -> `http://localhost:5000/api/v1`
- Backend default port: `5000`
- Frontend default port: `5173`
- Main build command: `npm run build`
- Backend syntax checks: `node --check server/<file>.js`

## Already Implemented

### Payments

Razorpay Standard Checkout is integrated through the existing authenticated order routes:

- Create order: `POST /api/v1/orders`
- Verify payment: `POST /api/v1/orders/verify`
- Cancel pending order: `PATCH /api/v1/orders/:id/cancel`
- Mark failed order: `PATCH /api/v1/orders/:id/fail`

Important behavior:

- Paid orders are created through the Razorpay SDK.
- Server validates the minimum order amount of 100 paise.
- Server verifies HMAC-SHA256 using `razorpay_order_id|razorpay_payment_id`.
- Fake/simulated payment verification was removed.
- Razorpay `payment.failed` marks the order `FAILED`.
- Razorpay modal dismissal marks the order `CANCELLED`.
- Cancellation cannot overwrite a failed or paid order.
- The user receives an immediate browser toast from the Razorpay event callback, normally within seconds. A webhook is still recommended for browser closure/network-loss cases.

Never put `RAZORPAY_KEY_SECRET` in frontend files. The secret currently lives in ignored `server/.env`; rotate it before production because it was exposed during development conversation.

### Auth / stale token handling

- PostgreSQL user IDs are UUIDs.
- Legacy mock IDs such as `user_admin_01` are now prevented from reaching UUID SQL queries in `AuthRepository` and `UserRepository`.
- If `/auth/me` returns 401, the Axios client clears `siddToken`, clears GET cache, and redirects to `/login`.
- If testing after old mock auth, clear browser local storage once or log in again.

### Course access and performance

- Course detail now returns `isEnrolled` based on the real `enrollments` table.
- Watch/course detail pages use the authoritative enrollment flag.
- Course hierarchy loading was changed from nested N+1 queries to batched queries.
- Lesson `is_free` and `is_protected` are returned by the hierarchy query.
- Lesson progress loads on watch-page entry and submits the correct object payload.
- Paid-course price calculation no longer treats missing/zero discount as a free course.

### Frontend infrastructure

- Axios has short-lived GET caching and in-flight GET deduplication.
- Cache keys include the current auth token to prevent cross-user response reuse.
- Mutations clear GET caches.
- Shared `Loader` component now uses shared CSS animation/styles.
- Shared select styling was added to `client/src/styles/index.css`.
- Login, register, contact, and most admin mutation forms have pending guards.
- Admin deletes/toggles for courses, subjects, chapters, banners, lectures, notes, and videos have busy guards.
- Free/paid price rendering now uses `getEffectivePrice()` and robust `formatPrice()`.

### Admin

- Responsive admin sidebar/mobile drawer exists.
- Admin dashboard uses contextual skeleton loading and retry state.
- New unified curriculum workspace exists at `/admin/curriculum`.
- Curriculum Builder supports Course -> Subject -> Chapter -> Lesson in one screen, with inline create forms and explicit loading/error/empty states.
- Existing specialist admin pages remain available.

## Most Important Remaining Work

### 1. Complete frontend visual consistency

The frontend still contains many legacy inline styles and mixed visual languages. Continue systematically:

- Replace remaining dark/white hard-coded colors with CSS design tokens.
- Remove remaining `color: '#fff'`, dark backgrounds, translucent white borders, and ad-hoc gradients from light pages.
- Standardize cards, headings, tables, tabs, badges, buttons, empty states, and modals.
- Make public, student, and admin typography feel like one product.
- Check mobile layouts, especially tables, course cards, watch page, admin forms, and modals.
- Avoid rewriting working APIs while polishing UI.

Useful searches:

```bash
rg "#fff|#ffffff|#1[0-9a-f]|rgba\\(255, 255, 255|backgroundColor" client/src
rg "<Loader|setLoading\\(true\\)|type=\"submit\"" client/src
```

### 2. Finish all loading UX

Some pages still use full-page loaders for page-local refreshes:

- `client/src/pages/admin/ManageBanners.jsx`
- `ManageCourses.jsx`
- `ManageClasses.jsx`
- `ManageNotes.jsx`
- `ManageVideos.jsx`
- `ManageOrders.jsx`
- public course detail/watch pages
- student list pages

Prefer:

- Skeleton on first load.
- Inline spinner or `aria-live` message on filters/refreshes.
- Preserve existing content while refreshing.
- Do not display multiple competing spinners.
- Avoid refetching unchanged data after every small interaction.

### 3. Finish admin curriculum workflow

The new `/admin/curriculum` page is the preferred path, but it is intentionally minimal. Remaining improvements:

- Add edit/delete actions inline for subjects, chapters, and lessons.
- Add video URL, duration, free/paid, protected, order, and notes fields to lesson creation.
- Add inline course creation or a clear link to create a course.
- Show selected hierarchy breadcrumb.
- Preserve selection after create/update/delete.
- Add per-step retry buttons instead of only a shared error banner.
- Consider replacing old sidebar entries for Subjects/Chapters/Video Lectures with links under Curriculum, or keep them as advanced pages with clear labels.
- Verify backend response shapes against real database data; do not silently swallow failed subject/chapter requests.

### 4. Fix remaining form UX

Audit every admin/student/public form:

- Every mutation needs a local `submitting`/`busyId` guard.
- Submit button must disable immediately and show a clear pending label.
- Cancel/close should disable while upload/save is active.
- Validate required fields before requests.
- Numeric fields must allow empty intermediate input and enforce sensible min/max.
- Upload forms need visible progress or at least `Uploading...` feedback.
- Delete/status actions need per-row busy state.

Known areas worth checking:

- `ManageOrders.jsx` search button/loading state.
- `ManageUsers.jsx` role/status update feedback.
- `ProfilePage.jsx` password/profile feedback.
- Any forms added after this handoff.

### 5. Payment status and recovery UX

Backend status transitions now work for new orders. Remaining UI work:

- Show clear labels: `Pending checkout`, `Paid`, `Payment failed`, `Checkout cancelled`.
- Add a retry-payment action for failed/cancelled orders where appropriate.
- Do not call failed orders "processing".
- Show the gateway order ID and failure reason in admin audit details when available.
- Add a Razorpay webhook endpoint for robust server-side reconciliation after browser closure/network loss.
- Consider an expiry job/endpoint for abandoned pending orders.
- Old rows already stored as `PENDING` will remain pending unless migrated/reconciled; do not silently rewrite history without a deliberate migration.

### 6. Backend query efficiency

The frontend has request caching/deduplication, but the backend still has query hotspots:

- `server/src/repositories/order.repository.js` admin `findAll()` loads items/payments one order at a time.
- Student dashboard aggregation may still issue several independent queries.
- Several repositories fall back to mock data after SQL errors, which can hide real schema/data issues.
- Add indexes where query logs show repeated slow filters.
- Prefer batched `WHERE ... = ANY($1::uuid[])` queries and grouped response assembly.
- Add server-side response caching only for safe public catalog/banner data, not user-specific data unless keyed by user/auth context.
- Keep auth and payment data uncached across users.

### 7. Data/auth consistency

The database uses UUID primary keys while mock data uses string IDs. Do not mix them in PostgreSQL queries. Better long-term options:

- Use PostgreSQL seeded users/courses consistently during real DB development.
- Keep mock store strictly for no-database mode.
- Add clear environment/runtime mode boundaries instead of silently falling back after arbitrary SQL errors.
- Never use mock data as a silent fallback for a real production database failure.

## BCNF Evaluation Answer

Do not claim every table is formally BCNF. A defensible answer is:

> The schema is predominantly normalized and several associative tables are in BCNF-like form, but claiming that every table is BCNF would require proving all functional dependencies. Some tables intentionally contain derived or duplicated operational data for performance/auditability, such as course enrollment counters, order totals, payment amounts, and lesson progress course references. The safer claim is that the core relationship tables are normalized, with intentional denormalization in selected tables.

Examples to mention:

- `enrollments(user_id, course_id)` has a unique constraint.
- `note_purchases(user_id, note_id)` has a unique constraint.
- `order_items` is normalized around `order_id` and item identity.
- `courses.enrolled_students` is derived/cached data.
- `lesson_progress.course_id` can be transitively determined through `lesson_id` and chapter/subject relationships, so it may be redundant.

## Validation Rules

Do not start either dev server unless the user explicitly asks.

Use:

```bash
npm run build
node --check server/src/repositories/<file>.js
node --check server/src/services/<file>.js
node --check server/src/controllers/<file>.js
```

The client production build has passed repeatedly as of this handoff.

## Important Cautions

- Do not commit `.env` files or expose database/JWT/Razorpay secrets.
- Do not use `git reset --hard` or revert unrelated user changes.
- The worktree intentionally contains many uncommitted changes from this overhaul. Read and preserve them.
- Do not add a second payment system; extend the existing order/payment architecture.
- Do not reintroduce simulated successful payments for paid resources.
- Do not treat HTTP 304 as a failure; it is a valid cache response.
