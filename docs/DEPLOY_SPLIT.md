# Split hosting — separate frontend + backend (Safari / iPhone safe)

| Part | Folder | Host |
|------|--------|------|
| Frontend | `frontend/` | **Vercel** |
| Backend | `backend/` | **Render** |

Live URLs:

| Role | URL |
|------|-----|
| Frontend | `https://nursehandover.online` |
| Backend (direct) | `https://nurse-shandover-1.onrender.com` |

**Important for iPhone/Safari:** the browser must call the API on the **same site** as the UI.  
`frontend/vercel.json` rewrites `/api/*` → Render, so cookies (`br.sid`, `br.csrf`) are first-party on `nursehandover.online`.

Each folder is a standalone npm package (own `package.json`). No npm workspaces.

---

## 1. Render (backend)

1. Web Service from this repo  
2. **Root Directory:** `backend`  
3. **Build:** `npm install --include=dev && npm run build`  
4. **Start:** `npm start`  
5. Health: `https://nurse-shandover-1.onrender.com/api/health`

### Environment variables

| KEY | VALUE |
|-----|--------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | your Atlas URI |
| `SESSION_SECRET` | random string ≥ 32 chars |
| `CLIENT_ORIGIN` | `https://nursehandover.online` |
| `COOKIE_SAMESITE` | `lax` |
| `APP_TIMEZONE` | `Asia/Kolkata` |
| `COOKIE_NAME` | `br.sid` |
| `SESSION_MAX_AGE_MS` | `28800000` |
| `INACTIVITY_TIMEOUT_MS` | `1800000` |

**Critical:** `CLIENT_ORIGIN` must be **`https://`** (no trailing slash).  
Use **`COOKIE_SAMESITE=lax`** with the Vercel `/api` proxy (required for Safari).

If your Render URL is not `nurse-shandover-1.onrender.com`, update the rewrite destination in `frontend/vercel.json`.

Seed once (local machine, production `MONGODB_URI` in `backend/.env`):

```bash
cd backend
npm install
npm run seed
```

---

## 2. Vercel (frontend)

1. New project from this repo  
2. **Root Directory:** `frontend`  
3. Framework: Vite  
4. Install / Build / Output: defaults

### Environment variable

| KEY | VALUE |
|-----|--------|
| `VITE_API_URL` | **leave unset / empty** |

Do **not** point `VITE_API_URL` at Render. Same-origin `/api` + Vercel rewrite keeps sessions working on iPhone.

`vercel.json` already proxies:

```text
/api/:path*  →  https://nurse-shandover-1.onrender.com/api/:path*
```

Redeploy the frontend after changing `vercel.json`.

---

## 3. Verify (including iPhone Safari)

1. Open `https://nursehandover.online` and log in  
2. DevTools → Network → `csrf-token` should be  
   `https://nursehandover.online/api/auth/csrf-token` (same host)  
3. Cookies `br.sid` / `br.csrf` on `nursehandover.online` with `SameSite=Lax`  
4. Refresh the page — you should stay logged in  
5. Add a patient — it should save and appear on Home  

---

## Local development

```bash
cd backend
copy .env.example .env
npm install
npm run seed
npm run dev

# other terminal
cd frontend
npm install
npm run dev
```

Leave `VITE_API_URL` empty. In `backend/.env`:

```
CLIENT_ORIGIN=http://localhost:5173
COOKIE_SAMESITE=lax
```

Vite proxies `/api` → port 4000.
