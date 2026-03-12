import { api } from './client';
import { Department } from '../types';

export const departmentApi = {
  getAll: () => api.get<Department[]>('/departments'),
  getById: (id: number) => api.get<Department>(`/departments/${id}`),
};
