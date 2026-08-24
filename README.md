# Sidd Academy — Online Coaching Platform

> **Full-Stack MERN Platform** for online coaching, structured courses, digital notes & video classes.

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + React Router v6 |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (Access + Refresh Tokens) |
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
