import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import morgan from 'morgan';
import crypto from 'node:crypto';
import { env } from './config/env.js';
import { loadUser } from './middleware/auth.js';
import { csrfProtection } from './middleware/csrf.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRouter } from './routes/auth.js';
import { patientsRouter } from './routes/patients.js';
import { unitsRouter } from './routes/units.js';
import { adminRouter } from './routes/admin/index.js';
import { formOptionsRouter } from './routes/formOptions.js';

export function createApp(mongoUrl = env.mongodbUri) {
  const app = express();

  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use((_req, res, next) => {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    next();
  });

  app.use(
    cors({
      origin(origin, callback) {
        // Same-origin / non-browser clients may omit Origin.
        if (!origin || env.clientOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      credentials: true,
    }),
  );

  app.use(express.json({ limit: '512kb' }));
  app.use(express.urlencoded({ extended: false, limit: '512kb' }));
  // Do not pass a secret here — express-session manages its own signed cookie.
  app.use(cookieParser());

  if (!env.isTest) {
    app.use(
      morgan(':method :url :status :res[content-length] - :response-time ms', {
        skip: (req) => req.path === '/api/health',
      }),
    );
  }

  app.use((req, _res, next) => {
    req.requestId = crypto.randomUUID();
    next();
  });

  app.use(
    session({
      name: env.cookieName,
      secret: env.sessionSecret,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      store: env.isTest
        ? undefined
        : MongoStore.create({
            mongoUrl,
            ttl: Math.floor(env.sessionMaxAgeMs / 1000),
            // Avoid encrypting the session blob — simpler and more reliable with Atlas.
          }),
      cookie: {
        httpOnly: true,
        sameSite: env.cookieSameSite,
        secure: env.cookieSecure,
        maxAge: env.sessionMaxAgeMs,
        path: '/',
      },
    }),
  );

  app.use(loadUser);
  app.use('/api', apiLimiter);
  app.use(csrfProtection);

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'bedsiderelay' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/units', unitsRouter);
  app.use('/api/patients', patientsRouter);
  app.use('/api/form-options', formOptionsRouter);
  app.use('/api/admin', adminRouter);

  app.use(errorHandler);

  return app;
}
