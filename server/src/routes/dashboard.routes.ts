import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authMiddleware } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

export function dashboardRoutes(controller: DashboardController): Router {
  const router = Router();

  router.use(authMiddleware);
  router.use(authorize('ceo_office', 'compliance', 'admin'));

  router.get('/summary', controller.getSummary);
  router.get('/activity-log', controller.getActivityLog);

  return router;
}
