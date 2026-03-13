import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { config } from '../config';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  const requestId = req.requestId;

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
      ...(requestId && { requestId }),
    });
  }

  console.error('Unhandled error:', err);

  // In production, do not leak internal error details
  const message = config.env === 'production' ? 'Internal server error' : err.message;

  return res.status(500).json({
    error: message,
    statusCode: 500,
    ...(requestId && { requestId }),
  });
}
