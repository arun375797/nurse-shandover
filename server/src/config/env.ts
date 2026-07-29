import { config } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Resolve repo-root .env from either src/config or dist/config. */
function loadEnvFile() {
  const candidates = [
    path.resolve(__dirname, '../../../.env'), // HandOver/.env
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../.env'),
  ];

  for (const envPath of candidates) {
    if (!fs.existsSync(envPath)) continue;
    config({ path: envPath, override: false });
    return envPath;
  }

  // Last resort: default dotenv cwd lookup (no-op if missing)
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
    return required('CLIENT_ORIGIN', 'http://localhost:5173');
  },
  get appTimezone() {
    return process.env.APP_TIMEZONE ?? 'Asia/Kolkata';
  },
  get cookieName() {
    return process.env.COOKIE_NAME ?? 'br.sid';
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
