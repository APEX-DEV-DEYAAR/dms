import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthPayload } from '../types';
import { authApi } from '../services/auth.api';

interface AuthContextType {
  user: AuthPayload | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isMonitor: boolean;
  canUpload: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthPayload | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      authApi.me()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (username: string, password: string) => {
    const result = await authApi.login(username, password);
    localStorage.setItem('token', result.token);
    setToken(result.token);
    setUser(result.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const isMonitor = user?.role === 'ceo_office' || user?.role === 'compliance' || user?.role === 'admin';
  const canUpload = user?.role === 'department_user' || user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, isMonitor, canUpload }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
