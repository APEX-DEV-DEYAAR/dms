import { Request, Response, NextFunction } from 'express';
import { DepartmentService } from '../services/department.service';

export class DepartmentController {
  constructor(private deptService: DepartmentService) {}

  getAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const departments = await this.deptService.getAll();
      res.json(departments);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dept = await this.deptService.getById(parseInt(req.params.id));
      res.json(dept);
    } catch (err) {
      next(err);
    }
  };
}
