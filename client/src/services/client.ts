const BASE_URL = '/api';
const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';

let refreshPromise: Promise<string | null> | null = null;

function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function storeTokens(token: string, refreshToken: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearAuthStorage(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem('user');
}

export function persistAuthSession(token: string, refreshToken: string): void {
  storeTokens(token, refreshToken);
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  refreshPromise = (async () => {
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearAuthStorage();
      return null;
    }

    const result = await response.json() as { token: string; refreshToken: string };
    storeTokens(result.token, result.refreshToken);
    return result.token;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

function redirectToLogin(): void {
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

async function request<T>(url: string, options?: RequestInit, allowRetry = true): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (!(options?.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && allowRetry && url !== '/auth/refresh') {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return request<T>(url, options, false);
    }

    clearAuthStorage();
    redirectToLogin();
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return parseJsonResponse<T>(response);
}

async function requestBlob(url: string, allowRetry = true): Promise<Blob> {
  const token = getAccessToken();
  const response = await fetch(`${BASE_URL}${url}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (response.status === 401 && allowRetry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return requestBlob(url, false);
    }

    clearAuthStorage();
    redirectToLogin();
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    throw new Error('Download failed');
  }

  return response.blob();
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body?: any) =>
    request<T>(url, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  put: <T>(url: string, body?: any) =>
    request<T>(url, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  delete: <T>(url: string) =>
    request<T>(url, { method: 'DELETE' }),
  getBlob: (url: string) => requestBlob(url),
};
