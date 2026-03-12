import { Router } from 'express';
import { healthRoutes } from './health.routes';
import { authRoutes } from './auth.routes';
import { departmentRoutes } from './department.routes';
import { letterheadRoutes } from './letterhead.routes';
import { dashboardRoutes } from './dashboard.routes';
import { HealthController } from '../controllers/health.controller';
import { AuthController } from '../controllers/auth.controller';
import { DepartmentController } from '../controllers/department.controller';
import { LetterheadController } from '../controllers/letterhead.controller';
import { DashboardController } from '../controllers/dashboard.controller';

export interface Controllers {
  health: HealthController;
  auth: AuthController;
  department: DepartmentController;
  letterhead: LetterheadController;
  dashboard: DashboardController;
}

export function createRouter(controllers: Controllers): Router {
  const router = Router();
  router.use('/health', healthRoutes(controllers.health));
  router.use('/auth', authRoutes(controllers.auth));
  router.use('/departments', departmentRoutes(controllers.department));
  router.use('/letterheads', letterheadRoutes(controllers.letterhead));
  router.use('/dashboard', dashboardRoutes(controllers.dashboard));
  return router;
}
