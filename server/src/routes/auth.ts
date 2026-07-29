import { Router } from 'express';
import bcrypt from 'bcrypt';
import { loginSchema, registerSchema } from '@bedsiderelay/shared';
import { User } from '../models/User.js';
import { Unit } from '../models/Unit.js';
import { AppError } from '../middleware/errorHandler.js';
import { requireAuth, toSessionUser, noStore } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimit.js';
import { csrfTokenHandler } from '../middleware/csrf.js';
import { recordAudit } from '../services/auditService.js';
import { findOrCreateUnit } from '../services/unitService.js';
import { env } from '../config/env.js';

export const authRouter = Router();

authRouter.use(noStore);

authRouter.get('/csrf-token', (req, res, next) => {
  void csrfTokenHandler(req, res, next);
});

authRouter.post('/register', loginLimiter, async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION', 'Invalid registration payload.', parsed.error.flatten());
    }

    const { fullName, unitName, password } = parsed.data;
    const email = parsed.data.email.toLowerCase();

    const existing = await User.findOne({ email });
    if (existing) {
      throw new AppError(409, 'EMAIL_EXISTS', 'An account with this email already exists.');
    }

    const unit = await findOrCreateUnit(unitName);

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      fullName,
      email,
      passwordHash,
      role: 'nurse',
      unitId: unit._id,
      active: true,
    });

    await recordAudit({
      actorId: user._id,
      action: 'register',
      entityType: 'User',
      entityId: user._id,
      requestId: req.requestId,
    });

    res.status(201).json({
      message: 'Registration successful. You can now sign in.',
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION', 'Invalid login payload.', parsed.error.flatten());
    }

    const email = parsed.data.email.toLowerCase();
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
    }

    if (!user.active) {
      throw new AppError(
        403,
        'ACCOUNT_DISABLED',
        'This account has been disabled. Contact your hospital administrator.',
      );
    }

    const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!ok) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
    }

    await new Promise<void>((resolve, reject) => {
      req.session.regenerate((err) => (err ? reject(err) : resolve()));
    });

    req.session.userId = user._id.toString();
    req.session.lastActivityAt = Date.now();

    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => (err ? reject(err) : resolve()));
    });

    user.lastLoginAt = new Date();
    await user.save();

    await recordAudit({
      actorId: user._id,
      action: 'login',
      entityType: 'User',
      entityId: user._id,
      requestId: req.requestId,
    });

    const unit = await Unit.findById(user.unitId).lean();
    const sessionUser = toSessionUser(user);

    res.json({
      user: sessionUser,
      unit: unit
        ? { id: unit._id.toString(), name: unit.name, code: unit.code }
        : null,
      timezone: env.appTimezone,
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/logout', requireAuth, async (req, res, next) => {
  try {
    if (req.user) {
      await recordAudit({
        actorId: req.user.id,
        action: 'logout',
        entityType: 'User',
        entityId: req.user.id,
        requestId: req.requestId,
      });
    }
    await new Promise<void>((resolve, reject) => {
      req.session.destroy((err) => (err ? reject(err) : resolve()));
    });
    res.clearCookie(env.cookieName, { path: '/' });
    res.clearCookie('br.csrf', { path: '/' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const unit = await Unit.findById(req.user!.unitId).lean();
    res.json({
      user: req.user,
      unit: unit
        ? { id: unit._id.toString(), name: unit.name, code: unit.code }
        : null,
      timezone: env.appTimezone,
    });
  } catch (err) {
    next(err);
  }
});
