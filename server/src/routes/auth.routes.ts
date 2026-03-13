import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../validation';
import { loginSchema, refreshTokenSchema } from '../validation/schemas';

export function authRoutes(controller: AuthController): Router {
  const router = Router();
  router.post('/login', validate(loginSchema), controller.login);
  router.post('/refresh', validate(refreshTokenSchema), controller.refresh);
  router.get('/me', authMiddleware, controller.me);
  return router;
}
