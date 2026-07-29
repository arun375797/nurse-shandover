# BedsideRelay — Clinical Shift Handover

**Clear shifts. Continuous care.**

BedsideRelay is a private hospital web application for nursing shift handovers. Outgoing nurses record structured, staff-entered patient information so incoming nurses can continue care.

This application only stores information entered by authorized staff. It does **not** diagnose patients, recommend treatment, calculate unapproved clinical scores, or invent clinical alerts or normal ranges.

> Production use requires review and approval by hospital clinical leadership, IT, privacy, security, and legal teams under applicable local laws and hospital policy. This project does **not** claim HIPAA, GDPR, certification, or hospital deployment approval.

## Stack

- React + Vite + TypeScript + Tailwind CSS
- React Router, React Hook Form, Zod, TanStack Query
- Node.js + Express + TypeScript
- MongoDB + Mongoose
- Secure cookie sessions (HttpOnly, SameSite)
- Vitest, React Testing Library, Supertest, Playwright
- npm workspaces: `client`, `server`, `shared`

## Prerequisites

- Node.js 20+
- npm 10+
- MongoDB 7+ (local install or Docker)

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
copy .env.example .env

# 3. Start MongoDB (Docker)
docker compose up -d

# 4. Build shared package, seed synthetic accounts
npm run build -w shared
npm run seed

# 5. Run API + web app
npm run dev
```

- Web UI: http://localhost:5173  
- API: http://localhost:4000/api/health  

### Development accounts (synthetic only)

| Role  | Email                         | Password (from `.env`) |
|-------|-------------------------------|-------------------------|
| Nurse | `nurse.dev@bedsiderelay.local`  | `SEED_NURSE_PASSWORD` (`NurseDev!234`) |
| Admin | `admin.dev@bedsiderelay.local`  | `SEED_ADMIN_PASSWORD` (`AdminDev!234`) |

Never use real patient information in development, tests, seed data, or documentation.

## Root scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API and Vite client |
| `npm run build` | Production build (shared → server → client) |
| `npm run start` | Start compiled API (`NODE_ENV=production`) |
| `npm run test` | Unit/API/frontend tests |
| `npm run test:e2e` | Playwright critical path |
| `npm run lint` | Lint packages |
| `npm run typecheck` | TypeScript checks |
| `npm run seed` | Seed units, users, sample synthetic patient |

## Workspace layout

```
client/     React UI
server/     Express API, Mongoose models, seed
shared/     Zod schemas + hospital option catalogs
docs/       API reference + production checklist
```

Important files:

- `shared/src/options.ts` — terminology / combobox suggestions
- `shared/src/schemas.ts` — shared validation
- `server/src/models/` — User, Unit, PatientHandover, AuditEvent
- `server/src/routes/` — auth + patients API
- `client/src/components/CreatableCombobox.tsx`
- `client/src/pages/HomePage.tsx`, `PatientFormPage.tsx`

## Security notes (summary)

- Argon2/bcrypt password hashing (bcrypt)
- MongoDB-backed sessions, HttpOnly cookies, CSRF protection
- Helmet, exact-origin CORS, rate limits, small body limits
- Unit-scoped patient queries for nurses
- Soft archive (no hard delete from UI)
- `Cache-Control: no-store` on authenticated responses
- No tokens in localStorage; no service worker clinical cache
- Safe logging (no names, MR numbers, clinical values, passwords, cookies)

See [docs/PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md).

## API

See [docs/API.md](docs/API.md).

## Testing

```bash
npm run test
npm run test:e2e
```

E2E boots an in-memory MongoDB API via `server` `e2e:serve` and a Vite preview client. No real patient data is used.

## Privacy footer

The UI includes:

> BedsideRelay records staff-entered handover information. Follow your hospital’s approved clinical and emergency procedures.
