import { LetterheadRepository } from '../repositories/letterhead.repository';
import { AuditRepository } from '../repositories/audit.repository';
import { DashboardSummary, LetterheadFilter } from '../types';

export class DashboardService {
  constructor(
    private letterheadRepo: LetterheadRepository,
    private auditRepo: AuditRepository
  ) {}

  async getSummary(): Promise<DashboardSummary> {
    const [totalLetterheads, thisMonthCount, departmentBreakdown, recentResult] = await Promise.all([
      this.letterheadRepo.getTotal(),
      this.letterheadRepo.getMonthlyCount(),
      this.letterheadRepo.getDepartmentCounts(),
      this.letterheadRepo.findFiltered({ page: 1, limit: 10 }),
    ]);

    return {
      totalLetterheads,
      thisMonthCount,
      departmentBreakdown,
      recentActivity: recentResult.data,
    };
  }

  async getActivityLog(limit = 50) {
    return this.auditRepo.findRecent(limit);
  }
}
