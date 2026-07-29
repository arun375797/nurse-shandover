/**
 * Safe logger — never logs patient identifiers, clinical values, passwords, or cookies.
 */
export const safeLog = {
  info(message: string, meta?: Record<string, string | number | boolean | undefined>) {
    if (meta) {
      console.info(`[info] ${message}`, sanitize(meta));
    } else {
      console.info(`[info] ${message}`);
    }
  },
  warn(message: string, meta?: Record<string, string | number | boolean | undefined>) {
    if (meta) {
      console.warn(`[warn] ${message}`, sanitize(meta));
    } else {
      console.warn(`[warn] ${message}`);
    }
  },
  error(message: string, meta?: Record<string, string | number | boolean | undefined>) {
    if (meta) {
      console.error(`[error] ${message}`, sanitize(meta));
    } else {
      console.error(`[error] ${message}`);
    }
  },
};

const FORBIDDEN_KEYS = new Set([
  'password',
  'passwordHash',
  'cookie',
  'authorization',
  'patientName',
  'mrNumber',
  'mrNumberDisplay',
  'mrNumberNormalized',
  'search',
  'body',
  'notes',
  'token',
]);

function sanitize(meta: Record<string, string | number | boolean | undefined>) {
  const out: Record<string, string | number | boolean | undefined> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (FORBIDDEN_KEYS.has(key) || key.toLowerCase().includes('patient')) {
      continue;
    }
    out[key] = value;
  }
  return out;
}
