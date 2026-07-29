import type { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';
import { User, type UserDocument } from '../models/User.js';
import { env } from '../config/env.js';

export type SessionUser = {
  id: string;
  fullName: string;
  email: string;
  role: 'nurse' | 'admin';
  unitId: string;
};

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    lastActivityAt?: number;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
      requestId?: string;
    }
  }
}

export async function loadUser(req: Request, _res: Response, next: NextFunction) {
  try {
    if (!req.session.userId) {
      return next();
    }

    const now = Date.now();
    const last = req.session.lastActivityAt ?? now;
    if (now - last > env.inactivityTimeoutMs) {
      await new Promise<void>((resolve, reject) => {
        req.session.destroy((err) => (err ? reject(err) : resolve()));
      });
      return next();
    }

    req.session.lastActivityAt = now;

    const user = await User.findById(req.session.userId).lean();
    if (!user || !user.active) {
      await new Promise<void>((resolve, reject) => {
        req.session.destroy((err) => (err ? reject(err) : resolve()));
      });
      return next();
    }

    req.user = toSessionUser(user as UserDocument & { _id: { toString(): string } });
    return next();
  } catch (err) {
    return next(err);
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new AppError(401, 'UNAUTHENTICATED', 'Authentication required.'));
  }
  return next();
}

export function requireRole(...roles: Array<'nurse' | 'admin'>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'UNAUTHENTICATED', 'Authentication required.'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'FORBIDDEN', 'Insufficient permissions.'));
    }
    return next();
  };
}

export function toSessionUser(user: {
  _id: { toString(): string };
  fullName: string;
  email: string;
  role: 'nurse' | 'admin';
  unitId: { toString(): string };
}): SessionUser {
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    unitId: user.unitId.toString(),
  };
}

export function noStore(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  return next();
}
