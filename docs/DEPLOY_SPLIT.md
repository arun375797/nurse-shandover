# Split hosting — separate frontend + backend

| Part | Folder | Host |
|------|--------|------|
| Frontend | `frontend/` | **Vercel** |
| Backend | `backend/` | **Render** |

Live URLs:

| Role | URL |
|------|-----|
| Frontend | `https://nursehandover.online` |
| Backend | `https://nurse-shandover.onrender.com` |

Each folder is a **standalone** npm package (own `package.json`, own `node_modules`). No npm workspaces.

---

## 1. Render (backend)

1. New **Web Service** from this repo
2. **Root Directory:** `backend`
3. **Build:** `npm install && npm run build`
4. **Start:** `npm start`
5. Health: `https://nurse-shandover.onrender.com/api/health`

### Environment variables

| KEY | VALUE |
|-----|--------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | your Atlas URI |
| `SESSION_SECRET` | random string ≥ 32 chars |
| `CLIENT_ORIGIN` | `https://nursehandover.online` |
| `COOKIE_SAMESITE` | `none` |
| `APP_TIMEZONE` | `Asia/Kolkata` |
| `COOKIE_NAME` | `br.sid` |
| `SESSION_MAX_AGE_MS` | `28800000` |
| `INACTIVITY_TIMEOUT_MS` | `1800000` |

**Critical:** `CLIENT_ORIGIN` must be **`https://`** not `http://`.

Seed once (from your machine, with production `MONGODB_URI` in `backend/.env`):

```bash
cd backend
npm install
npm run seed
```

---

## 2. Vercel (frontend)

1. New project from this repo
2. **Root Directory:** `frontend`
3. Framework: Vite (auto)
4. Install / Build / Output: defaults (`npm install`, `npm run build`, `dist`)

### Environment variable (required)

| KEY | VALUE |
|-----|--------|
| `VITE_API_URL` | `https://nurse-shandover.onrender.com` |

No trailing `/`, no `/api`. Apply to **Production** (and Preview if needed).

**Redeploy after changing `VITE_API_URL`** (it is baked in at build time).

---

## 3. Verify

1. Open `https://nursehandover.online/register`
2. DevTools → Network → `csrf-token` should hit  
   `https://nurse-shandover.onrender.com/api/auth/csrf-token`
3. Response headers should include:

```http
Access-Control-Allow-Origin: https://nursehandover.online
```

4. Cookies `br.sid` / `br.csrf` should show `SameSite=None; Secure`

---

## Local development

```bash
# Terminal 1 — API
cd backend
copy .env.example .env   # first time only
npm install
npm run seed
npm run dev

# Terminal 2 — UI
cd frontend
npm install
npm run dev
```

Or from repo root (after `npm install` once for the helper scripts):

```bash
npm run install:all
npm run seed
npm run dev
```

Leave `VITE_API_URL` empty locally. In `backend/.env`:

```
CLIENT_ORIGIN=http://localhost:5173
COOKIE_SAMESITE=lax
```

Vite proxies `/api` → port 4000.
