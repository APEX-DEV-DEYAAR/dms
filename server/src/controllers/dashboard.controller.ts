import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';

export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  getSummary = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await this.dashboardService.getSummary();
      res.json(summary);
    } catch (err) {
      next(err);
    }
  };

  getActivityLog = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const log = await this.dashboardService.getActivityLog(limit);
      res.json(log);
    } catch (err) {
      next(err);
    }
  };
}
