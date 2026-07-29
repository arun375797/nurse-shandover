import mongoose from 'mongoose';
import { env } from './config/env.js';

declare global {
  // Reuse the connection across hot reloads / serverless invocations.
  // eslint-disable-next-line no-var
  var __bedsiderelayMongoPromise: Promise<typeof mongoose> | undefined;
}

/** Connect once and reuse (safe for Vercel serverless cold starts). */
export async function connectMongo(uri = env.mongodbUri): Promise<typeof mongoose> {
  if (mongoose.connection.readyState >= 1) {
    return mongoose;
  }

  if (!globalThis.__bedsiderelayMongoPromise) {
    globalThis.__bedsiderelayMongoPromise = mongoose.connect(uri);
  }

  try {
    await globalThis.__bedsiderelayMongoPromise;
  } catch (err) {
    globalThis.__bedsiderelayMongoPromise = undefined;
    throw err;
  }

  return mongoose;
}
