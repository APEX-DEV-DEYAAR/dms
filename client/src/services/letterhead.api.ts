import { api } from './client';
import { Letterhead, PaginatedResult, VersionInfo, UpdateLetterheadPayload } from '../types';

export interface LetterheadFilter {
  departmentId?: number;
  startDate?: string;
  endDate?: string;
  approvalAuthority?: string;
  search?: string;
  isArchived?: boolean;
  page?: number;
  limit?: number;
}

export const letterheadApi = {
  getList: (filter: LetterheadFilter = {}) => {
    const params = new URLSearchParams();
    if (filter.departmentId) params.set('departmentId', String(filter.departmentId));
    if (filter.startDate) params.set('startDate', filter.startDate);
    if (filter.endDate) params.set('endDate', filter.endDate);
    if (filter.approvalAuthority) params.set('approvalAuthority', filter.approvalAuthority);
    if (filter.search) params.set('search', filter.search);
    if (filter.isArchived !== undefined) params.set('isArchived', String(filter.isArchived));
    if (filter.page) params.set('page', String(filter.page));
    if (filter.limit) params.set('limit', String(filter.limit));
    return api.get<PaginatedResult<Letterhead>>(`/letterheads?${params.toString()}`);
  },

  getById: (id: number) => api.get<Letterhead>(`/letterheads/${id}`),

  create: (formData: FormData) => api.post<Letterhead>('/letterheads', formData),

  update: (id: number, data: UpdateLetterheadPayload) => {
    const formData = new FormData();
    formData.append('departmentId', String(data.departmentId));
    formData.append('letterDate', data.letterDate);
    formData.append('approvalAuthority', data.approvalAuthority);
    formData.append('description', data.description);
    formData.append('notes', data.notes || '');
    formData.append('iomNumber', data.iomNumber || '');
    formData.append('justification', data.justification);
    if (data.file) {
      formData.append('file', data.file);
    }
    return api.put<Letterhead>(`/letterheads/${id}`, formData);
  },

  download: (id: number) => api.getBlob(`/letterheads/${id}/download`),

  getNextReference: (departmentId: number) =>
    api.get<{ nextReference: string }>(`/letterheads/next-reference?departmentId=${departmentId}`),

  getVersions: (id: number) =>
    api.get<VersionInfo[]>(`/letterheads/${id}/versions`),

  exportExcel: (filter: LetterheadFilter = {}) => {
    const params = new URLSearchParams();
    if (filter.departmentId) params.set('departmentId', String(filter.departmentId));
    if (filter.startDate) params.set('startDate', filter.startDate);
    if (filter.endDate) params.set('endDate', filter.endDate);
    if (filter.approvalAuthority) params.set('approvalAuthority', filter.approvalAuthority);
    if (filter.search) params.set('search', filter.search);
    return api.getBlob(`/letterheads/export?${params.toString()}`);
  },
};
