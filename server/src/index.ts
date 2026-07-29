import mongoose from 'mongoose';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectMongo } from './db.js';
import { safeLog } from './utils/safeLog.js';

process.on('unhandledRejection', (reason) => {
  safeLog.error('Unhandled promise rejection');
  console.error(reason instanceof Error ? reason.name : 'UnhandledRejection');
});

process.on('uncaughtException', (err) => {
  safeLog.error('Uncaught exception');
  console.error(err.name);
});

async function main() {
  if (env.isProd && env.sessionSecret.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters in production.');
  }

  await connectMongo();
  mongoose.connection.on('error', (err) => {
    safeLog.error('MongoDB connection error');
    console.error(err.name);
  });
  safeLog.info('Connected to MongoDB', {
    host: mongoose.connection.host,
    db: mongoose.connection.name,
  });

  const app = createApp();
  app.listen(env.port, () => {
    safeLog.info('BedsideRelay API listening', { port: env.port });
  });
}

main().catch((err) => {
  safeLog.error('Failed to start server');
  console.error(err instanceof Error ? err.name : 'StartupError');
  process.exit(1);
});
