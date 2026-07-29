import { config } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Load backend/.env (standalone package — not a monorepo root). */
function loadEnvFile() {
  const candidates = [
    path.resolve(__dirname, '../../.env'), // backend/.env from src/config or dist/config
    path.resolve(process.cwd(), '.env'),
  ];

  for (const envPath of candidates) {
    if (!fs.existsSync(envPath)) continue;
    config({ path: envPath, override: false });
    return envPath;
  }

  config({ override: false });
  return null;
}

loadEnvFile();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function collectClientOrigins(): string[] {
  const raw = process.env.CLIENT_ORIGIN?.trim() || 'http://localhost:5173';
  return [
    ...new Set(
      raw
        .split(',')
        .map((s) => s.trim().replace(/\/$/, ''))
        .filter(Boolean),
    ),
  ];
}

export const env = {
  get nodeEnv() {
    return process.env.NODE_ENV ?? 'development';
  },
  get port() {
    return Number(process.env.PORT ?? 4000);
  },
  get mongodbUri() {
    return required('MONGODB_URI', 'mongodb://127.0.0.1:27017/bedsiderelay');
  },
  get sessionSecret() {
    return required(
      'SESSION_SECRET',
      'dev-only-session-secret-change-in-production-32c',
    );
  },
  get clientOrigin() {
    return collectClientOrigins()[0]!;
  },
  get clientOrigins() {
    return collectClientOrigins();
  },
  get appTimezone() {
    return process.env.APP_TIMEZONE ?? 'Asia/Kolkata';
  },
  get cookieName() {
    return process.env.COOKIE_NAME ?? 'br.sid';
  },
  /**
   * Prefer `lax` when the browser talks to the API on the same site
   * (Vercel rewrites `/api` → Render). Use `none` only for true cross-site
   * calls (different registrable domains, no proxy) — Safari/iOS often blocks those.
   */
  get cookieSameSite(): 'lax' | 'strict' | 'none' {
    const raw = process.env.COOKIE_SAMESITE?.toLowerCase();
    if (raw === 'none' || raw === 'strict' || raw === 'lax') return raw;
    return 'lax';
  },
  get cookieSecure() {
    if (this.cookieSameSite === 'none') return true;
    return this.isProd;
  },
  get sessionMaxAgeMs() {
    return Number(process.env.SESSION_MAX_AGE_MS ?? 8 * 60 * 60 * 1000);
  },
  get inactivityTimeoutMs() {
    return Number(process.env.INACTIVITY_TIMEOUT_MS ?? 30 * 60 * 1000);
  },
  get seedNursePassword() {
    return process.env.SEED_NURSE_PASSWORD ?? 'NurseDev!234';
  },
  get seedAdminPassword() {
    return process.env.SEED_ADMIN_PASSWORD ?? 'AdminDev!234';
  },
  get isProd() {
    return (process.env.NODE_ENV ?? 'development') === 'production';
  },
  get isTest() {
    return process.env.NODE_ENV === 'test';
  },
};
