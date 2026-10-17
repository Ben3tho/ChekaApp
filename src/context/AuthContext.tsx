import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem('cheka_access_token');
  });
  const [refreshToken, setRefreshToken] = useState<string | null>(() => {
    return localStorage.getItem('cheka_refresh_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Rotate token or check session on mount
  useEffect(() => {
    const initSession = async () => {
      // If we have an access token, verify it
      if (accessToken) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            setIsLoading(false);
            return;
          }
        } catch {
          // Token might be expired, try refresh below
        }
      }

      // Try refresh token rotation
      const storedRefresh = refreshToken || localStorage.getItem('cheka_refresh_token');
      if (storedRefresh) {
        try {
          const refreshRes = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: storedRefresh }),
          });
          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            setAccessToken(refreshData.accessToken);
            setRefreshToken(refreshData.refreshToken);
            localStorage.setItem('cheka_access_token', refreshData.accessToken);
            localStorage.setItem('cheka_refresh_token', refreshData.refreshToken);
            setUser(refreshData.user);
          } else {
            // Revoked or expired
            setAccessToken(null);
            setRefreshToken(null);
            localStorage.removeItem('cheka_access_token');
            localStorage.removeItem('cheka_refresh_token');
            setUser(null);
          }
        } catch {
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      localStorage.setItem('cheka_access_token', data.accessToken);
      localStorage.setItem('cheka_refresh_token', data.refreshToken);
      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during login' };
    }
  };

  const signup = async (username: string, email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        const detailMsg = Array.isArray(data.details) ? data.details.join(', ') : data.error;
        return { success: false, error: detailMsg || 'Signup failed' };
      }

      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      localStorage.setItem('cheka_access_token', data.accessToken);
      localStorage.setItem('cheka_refresh_token', data.refreshToken);
      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during signup' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
    } catch (e) {
      console.warn('Logout request failed:', e);
    } finally {
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      localStorage.removeItem('cheka_access_token');
      localStorage.removeItem('cheka_refresh_token');
    }
  };

  // Authenticated fetch wrapper that automatically attaches Bearer token
  const authFetch = async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    let response = await fetch(url, { ...options, headers });

    // If token expired (401), attempt 1 refresh rotation automatically
    if (response.status === 401 && refreshToken) {
      try {
        const refreshRes = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setAccessToken(refreshData.accessToken);
          setRefreshToken(refreshData.refreshToken);
          localStorage.setItem('cheka_access_token', refreshData.accessToken);
          localStorage.setItem('cheka_refresh_token', refreshData.refreshToken);

          // Retry original request with new token
          headers.set('Authorization', `Bearer ${refreshData.accessToken}`);
          response = await fetch(url, { ...options, headers });
        } else {
          // Token expired and refresh failed
          logout();
        }
      } catch {
        logout();
      }
    }

    return response;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        login,
        signup,
        logout,
        authFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
