import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { createRouter, Controllers } from './routes';
import { errorHandler } from './middleware/errorHandler';
import { requestIdMiddleware } from './middleware/requestId';

export function createApp(controllers: Controllers): express.Application {
  const app = express();
  app.disable('x-powered-by');

  // Request ID — first middleware so every response gets it
  app.use(requestIdMiddleware);

  // Security headers
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'same-site' },
    referrerPolicy: { policy: 'no-referrer' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
  }));

  // CORS - restrict to known origins
  app.use(cors({
    origin: config.corsOrigins,
    credentials: true,
  }));

  // Rate limiting
  app.use('/api/auth/login', rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 15, // max 15 login attempts per window
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many login attempts, please try again later', statusCode: 429 },
  }));

  app.use('/api', rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    limit: 100, // max 100 requests per minute
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later', statusCode: 429 },
  }));

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb', parameterLimit: 50 }));

  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    next();
  });

  app.use('/api', createRouter(controllers));

  app.use(errorHandler);

  return app;
}
