# HRMS - Human Resource Management System

A MERN-stack (MongoDB, Express, React, Node) application for managing employees, daily attendance,
leave requests and monthly payroll, with two roles: **Admin** and **Employee**.

## Live deployment

| | Address |
|---|---|
| **Website (frontend)** | https://frontend-tan-beta-88.vercel.app |
| **API (backend)** | Render web service, `https://<your-service>.onrender.com` (health check: `/api/health`) |

The frontend is hosted on Vercel and the backend on Render. Both redeploy automatically on every
push to `main` (see `DEPLOYMENT.md`).

## Features

| Area | Admin | Employee |
|---|---|---|
| Authentication | Register, login / logout, forgot and reset password, HTTP-only JWT cookie, bcrypt-hashed passwords | Same |
| Dashboard | Totals, present today, pending/approved leaves, departments, payroll overview, recent employees, attendance trend | Profile card, today's check-in status, recent attendance, leave requests, latest payslip |
| Employees | Add, edit, deactivate / reactivate, search, filter by department and status, sort | View and edit own profile (name, phone, address), change password |
| Attendance | See everyone's records, filter by date | Check in / check out (Present or Late), own history |
| Leave | See all requests, approve or reject, filter by status | Apply (Sick, Casual, Annual, Other), own history |
| Payroll | Generate for one or all employees, edit amounts of pending payslips, mark as paid, print payslips | View and print own payslips |

Salary rule: `Net salary = Basic + Bonus - Deductions` (never below 0).

## Tech stack

- **Frontend:** React 19, Vite, Tailwind CSS 4, React Router, Axios, react-hot-toast, lucide-react
- **Backend:** Node.js, Express 5, Mongoose, JWT (`jsonwebtoken`), `bcryptjs`, `zod`, `helmet`, `cors`, `express-rate-limit`
- **Database:** MongoDB (local for development, MongoDB Atlas in production)

## Project structure

```
backend/    Express API  (models, routes, middleware, utils/validation.js, scripts/)
frontend/   React app    (pages, components, context, utils/validation.js)
DEPLOYMENT.md  Step-by-step hosting guide
```

## Run it locally

Requirements: Node.js 18+ and either a local MongoDB or a MongoDB Atlas connection string.

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env        # then edit .env (MONGO_URI, JWT_SECRET, ADMIN_* ...)
npm run db                  # optional: starts a local MongoDB on port 27017 (keep it running)
npm run dev                 # API on http://localhost:5000 (creates the first admin from ADMIN_* on an empty database)

# 2. Frontend (new terminal)
cd frontend
npm install
cp .env.example .env
npm run dev                 # site on http://localhost:5173
```

Sign in with the admin you seeded, then add employees from **Employees -> Add Employee**.

### Backend scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the API with auto-restart (nodemon) |
| `npm start` | Start the API (production) |
| `npm run db` | Start a local development MongoDB (data kept in `backend/.data`) |

### Environment variables (`backend/.env`)

See `backend/.env.example` for the full list and comments. Required: `MONGO_URI`, `JWT_SECRET`.
Never commit `.env`.

## API overview

All routes are under `/api`. Everything except `register`, `login`, `forgot-password`, `reset-password` and `health` needs a logged-in user (cookie).

| Route | Access | Purpose |
|---|---|---|
| `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` | public / user | Session |
| `POST /auth/register`, `POST /auth/forgot-password`, `POST /auth/reset-password` | public | Sign up as Employee; emailed 15-minute reset link |
| `PUT /auth/profile`, `PUT /auth/change-password` | user | Own profile and password |
| `GET /employees`, `POST /employees`, `PUT /employees/:id` | admin | List, create, update |
| `PATCH /employees/:id/deactivate`, `PATCH /employees/:id/reactivate` | admin | Account status |
| `POST /attendance/check-in`, `POST /attendance/check-out` | user | Daily attendance |
| `GET /attendance?date=` | user (own) / admin (all) | History |
| `POST /leaves`, `GET /leaves?status=` | user (own) / admin (all) | Apply, list |
| `PATCH /leaves/:id/status` | admin | Approve or reject |
| `GET /payroll?month=&status=` | user (own) / admin (all) | Payslips |
| `POST /payroll`, `PUT /payroll/:id`, `PATCH /payroll/:id/pay`, `DELETE /payroll/:id` | admin | Create, edit, pay, delete |
| `GET /dashboard` | user | Role-specific dashboard data |
| `GET /health` | public | Health check |

## Validation rules

The same rules run in the browser (`frontend/src/utils/validation.js`) and on the server
(`backend/utils/validation.js`). The server answers invalid data with HTTP 400 and a clear message.

- **Name:** letters and single spaces only, 2-50 characters
- **Email:** `^[a-zA-Z0-9]+([._-]?[a-zA-Z0-9]+)*@[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+$`, stored in lowercase
- **Phone:** optional, exactly 10 digits
- **Password:** 8+ characters with an uppercase letter, a lowercase letter, a number and a symbol
- **Department / designation:** letters (plus spaces and `/ & - .`), 2-50 characters
- **Leave:** end date not before start date, reason 10-500 characters

## Security notes

- Passwords are hashed with bcrypt and never returned by the API.
- The login token lives in an HTTP-only cookie (`SameSite=Lax`, `Secure` in production).
- CORS only allows `FRONTEND_URL`; `helmet` sets security headers.
- Only failed login attempts are rate-limited (20 per 15 minutes per address).
- Register, forgot-password and reset-password are rate-limited too. Reset links need the `SMTP_*` variables in `backend/.env` (without them the link is shown on the page in development only).
- Admin-only routes are protected on the server, not just hidden in the interface.
- One attendance record per employee per day and one payslip per employee per month (unique indexes).

## Responsive layout

Summary cards flow 4 -> 3 -> 2 per row as the screen narrows and show a single card below 400px wide.
Employee and payslip cards follow the same pattern. Wide tables scroll inside their own card.
