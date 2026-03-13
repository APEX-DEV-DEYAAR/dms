import { api } from './client';
import { LoginResponse, AuthPayload, RefreshTokenResponse } from '../types';

export const authApi = {
  login: (username: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { username, password }),

  refresh: (refreshToken: string) =>
    api.post<RefreshTokenResponse>('/auth/refresh', { refreshToken }),

  me: () => api.get<AuthPayload>('/auth/me'),
};
