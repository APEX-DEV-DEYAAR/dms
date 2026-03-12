import { api } from './client';
import { DashboardSummary, AuditLogEntry } from '../types';

export const dashboardApi = {
  getSummary: () => api.get<DashboardSummary>('/dashboard/summary'),
  getActivityLog: (limit = 50) => api.get<AuditLogEntry[]>(`/dashboard/activity-log?limit=${limit}`),
};
