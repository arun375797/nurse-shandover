import type { Request, Response, NextFunction } from 'express';
import { doubleCsrf } from 'csrf-csrf';
import { env } from '../config/env.js';

const { generateToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => env.sessionSecret,
  // Bind CSRF to the express-session id so tokens rotate when the session regenerates.
  getSessionIdentifier: (req) => req.sessionID || 'anonymous',
  cookieName: 'br.csrf',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProd,
    path: '/',
  },
  getTokenFromRequest: (req) => {
    const header = req.headers['x-csrf-token'];
    if (typeof header === 'string' && header.length > 0) return header;
    return undefined;
  },
  skipCsrfProtection: (req) => {
    if (env.isTest) return true;
    const path = req.originalUrl.split('?')[0];
    return path === '/api/auth/login' || path === '/api/auth/register';
  },
});

export async function csrfTokenHandler(req: Request, res: Response, next: NextFunction) {
  try {
    // Ensure the session is created/saved so the CSRF hash binds to a stable session id.
    if (req.session) {
      req.session.lastActivityAt = req.session.lastActivityAt ?? Date.now();
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => (err ? reject(err) : resolve()));
      });
    }

    const token = generateToken(req, res, true, false);
    res.json({ csrfToken: token });
  } catch (err) {
    next(err);
  }
}

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  return doubleCsrfProtection(req, res, next);
}

export { generateToken as generateCsrfToken };
