import { api } from './client';
import { LoginResponse, AuthPayload } from '../types';

export const authApi = {
  login: (username: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { username, password }),

  me: () => api.get<AuthPayload>('/auth/me'),
};
