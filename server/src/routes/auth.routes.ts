import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth';

export function authRoutes(controller: AuthController): Router {
  const router = Router();
  router.post('/login', controller.login);
  router.get('/me', authMiddleware, controller.me);
  return router;
}
