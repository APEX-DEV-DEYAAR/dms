import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthPayload } from '../types';
import { UnauthorizedError } from '../errors/AppError';

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('No token provided'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      algorithms: [config.jwt.algorithm],
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    }) as AuthPayload & { userId: number | string; departmentId: number | string | null };

    const userId = Number(decoded.userId);
    const departmentId =
      decoded.departmentId === null || decoded.departmentId === undefined
        ? null
        : Number(decoded.departmentId);

    if (!Number.isFinite(userId) || typeof decoded.username !== 'string' || typeof decoded.role !== 'string') {
      throw new UnauthorizedError('Invalid token payload');
    }

    if (departmentId !== null && !Number.isFinite(departmentId)) {
      throw new UnauthorizedError('Invalid token payload');
    }

    req.user = {
      userId,
      username: decoded.username,
      role: decoded.role,
      departmentId,
    };
    next();
  } catch {
    next(new UnauthorizedError('Invalid token'));
  }
}
