# BedsideRelay — Clinical Shift Handover

**Clear shifts. Continuous care.**

BedsideRelay is a private hospital web application for nursing shift handovers. Outgoing nurses record structured, staff-entered patient information so incoming nurses can continue care.

This application only stores information entered by authorized staff. It does **not** diagnose patients, recommend treatment, calculate unapproved clinical scores, or invent clinical alerts or normal ranges.

> Production use requires review and approval by hospital clinical leadership, IT, privacy, security, and legal teams under applicable local laws and hospital policy. This project does **not** claim HIPAA, GDPR, certification, or hospital deployment approval.

## Structure

Frontend and backend are **separate** packages (not an npm workspace monorepo):

```
HandOver/
  frontend/     → React + Vite  (host on Vercel)
  backend/      → Express API   (host on Render)
  docs/
  docker-compose.yml
```

Each has its own `package.json` and dependencies. Shared Zod schemas live under each app’s `src/shared/` (copied into both so deploys stay independent).

## Stack

- React + Vite + TypeScript + Tailwind CSS
- React Router, React Hook Form, Zod, TanStack Query
- Node.js + Express + TypeScript
- MongoDB + Mongoose
- Secure cookie sessions (HttpOnly, SameSite)
- Vitest, React Testing Library, Supertest, Playwright

## Prerequisites

- Node.js 20+
- npm 10+
- MongoDB 7+ (local install or Docker)

## Quick start

```bash
# 1. MongoDB (Docker)
docker compose up -d

# 2. Backend
cd backend
copy .env.example .env
npm install
npm run seed
npm run dev

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev
```

- Web UI: http://localhost:5173  
- API: http://localhost:4000/api/health  

Optional: from repo root, `npm install` then `npm run install:all` / `npm run dev` to run both together.

### Development accounts (synthetic only)

| Role  | Email                         | Password (from `backend/.env`) |
|-------|-------------------------------|--------------------------------|
| Nurse | `nurse.dev@bedsiderelay.local`  | `SEED_NURSE_PASSWORD` (`NurseDev!234`) |
| Admin | `admin.dev@bedsiderelay.local`  | `SEED_ADMIN_PASSWORD` (`AdminDev!234`) |

Never use real patient information in development, tests, seed data, or documentation.

## Deploy separately (Vercel + Render)

Full checklist: **[docs/DEPLOY_SPLIT.md](docs/DEPLOY_SPLIT.md)**

| Part | Host | Root directory | Notes |
|------|------|----------------|--------|
| Frontend | **Vercel** | `frontend` | Leave `VITE_API_URL` empty (`/api` rewritten to Render) |
| Backend | **Render** | `backend` | Set `CLIENT_ORIGIN=https://nursehandover.online` and `COOKIE_SAMESITE=lax` |

Local development: leave `VITE_API_URL` empty; Vite proxies `/api` → `localhost:4000`.

> **iPhone / Safari:** do not call the Render URL from the browser. Use the Vercel `/api` rewrite so session cookies stay first-party.
