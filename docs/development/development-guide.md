# Sidd Academy — Developer & Contributor Guide

## 1. Quick Start

### 1.1 Prerequisites
- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v14.0 or higher (optional, in-memory mock store activates automatically if unavailable)
- **Package Manager**: npm workspaces or bun

### 1.2 Installation
```bash
# Clone the repository
git clone https://github.com/sidd-academy/sidd-academy.git
cd sidd-academy

# Install dependencies for both client and server workspaces
npm install
```

### 1.3 Environment Configuration
Copy the template configuration:
```bash
cp .env.example .env
```

### 1.4 Database Initialization
```bash
# Run schema migrations
npm run db:migrate

# Seed initial courses, subjects, chapters, notes, and demo accounts
npm run db:seed
```

### 1.5 Launching Services
```bash
# Run backend server
npm --workspace=server run dev

# Run frontend client (Vite)
npm --workspace=client run dev
```

---

## 2. Seed Credentials for Local Testing

| Role | Email | Password |
|---|---|---|
| **Administrator** | `admin@siddacademy.com` | `Admin@123` |
| **Enrolled Student** | `student@siddacademy.com` | `Student@123` |

---

## 3. Code Quality & Standards

- **Linting**: Ensure zero lint errors before pushing changes (`npm run lint`).
- **Production Build**: Verify static bundling passes cleanly (`npm run build`).
- **Security Protocols**:
  - Never execute raw string SQL queries. Always pass parameterized arguments `$1, $2, ...`.
  - Always guard administrative controllers with `authorize('ADMIN')`.
  - Do not hardcode API keys or credentials in client bundles.
