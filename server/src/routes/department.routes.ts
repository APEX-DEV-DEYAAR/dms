import { Router } from 'express';
import { DepartmentController } from '../controllers/department.controller';
import { authMiddleware } from '../middleware/auth';

export function departmentRoutes(controller: DepartmentController): Router {
  const router = Router();
  router.get('/', authMiddleware, controller.getAll);
  router.get('/:id', authMiddleware, controller.getById);
  return router;
}
