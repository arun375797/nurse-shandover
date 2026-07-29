import type { Request, Response, NextFunction } from 'express';
import createHttpError from 'http-errors';
import mongoose from 'mongoose';

export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (res.headersSent) {
    console.error('[error]', err instanceof Error ? err.name : 'UnknownError');
    return;
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  if (createHttpError.isHttpError(err)) {
    return res.status(err.statusCode).json({
      error: {
        code: (err as { code?: string }).code ?? 'HTTP_ERROR',
        message: err.message,
      },
    });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION',
        message: 'Invalid patient data.',
        details: err.errors,
      },
    });
  }

  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION',
        message: 'Invalid data format in request.',
      },
    });
  }

  if (err && typeof err === 'object' && 'code' in err && (err as { code?: number }).code === 11000) {
    return res.status(409).json({
      error: {
        code: 'DUPLICATE_MR',
        message: 'A patient with this MR number already exists in your unit.',
      },
    });
  }

  if (err && typeof err === 'object' && 'name' in err && (err as { name?: string }).name === 'MongoNetworkError') {
    return res.status(503).json({
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'Unable to reach the database. Please try again in a moment.',
      },
    });
  }

  const message =
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred.'
      : err instanceof Error
        ? err.message
        : 'Unknown error';

  console.error('[error]', err instanceof Error ? err.name : 'UnknownError');

  return res.status(500).json({
    error: {
      code: 'INTERNAL',
      message,
    },
  });
}
