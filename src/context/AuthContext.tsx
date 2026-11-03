import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
}

export const OWNER_EMAILS = [
  'benedictojoseph08@gmail.com',
  'admin@cheka.io',
  'owner@cheka.io'
];

export const OWNER_MASTER_PIN = '2026';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isOwner: boolean;
  unlockOwnerSession: (pin: string) => boolean;
  lockOwnerSession: () => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: { username?: string; avatarUrl?: string }) => Promise<{ success: boolean; error?: string }>;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

export const getApiBase = (): string => {
  if (typeof window !== 'undefined') {
    if (window.location.origin.includes('androidplatform.net') || window.location.protocol === 'file:') {
      // In Android WebView APK, point relative /api calls to the deployed cloud instance
      return 'https://ais-dev-zkuu3cv2glmswqsk4ae63u-375802893628.europe-west2.run.app';
    }
  }
  return '';
};

export const resolveApiUrl = (url: string): string => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const base = getApiBase();
  const normalized = url.startsWith('/') ? url : `/${url}`;
  return `${base}${normalized}`;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('cheka_current_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem('cheka_access_token');
  });
  const [refreshToken, setRefreshToken] = useState<string | null>(() => {
    return localStorage.getItem('cheka_refresh_token');
  });
  const [isOwnerUnlocked, setIsOwnerUnlocked] = useState<boolean>(() => {
    return localStorage.getItem('cheka_owner_unlocked') === 'true';
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Derive isOwner automatically from owner email OR manual master PIN unlock
  const isOwner = Boolean(
    isOwnerUnlocked ||
    (user?.email && OWNER_EMAILS.includes(user.email.toLowerCase()))
  );

  const unlockOwnerSession = (pin: string): boolean => {
    if (pin.trim() === OWNER_MASTER_PIN) {
      setIsOwnerUnlocked(true);
      localStorage.setItem('cheka_owner_unlocked', 'true');
      return true;
    }
    return false;
  };

  const lockOwnerSession = () => {
    setIsOwnerUnlocked(false);
    localStorage.removeItem('cheka_owner_unlocked');
  };

  // Rotate token or check session on mount
  useEffect(() => {
    const initSession = async () => {
      // If we have an access token, verify it
      if (accessToken) {
        try {
          const res = await fetch(resolveApiUrl('/api/auth/me'), {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            localStorage.setItem('cheka_current_user', JSON.stringify(data.user));
            setIsLoading(false);
            return;
          }
        } catch {
          // Token might be expired or offline, try refresh below
        }
      }

      // Try refresh token rotation
      const storedRefresh = refreshToken || localStorage.getItem('cheka_refresh_token');
      if (storedRefresh) {
        try {
          const refreshRes = await fetch(resolveApiUrl('/api/auth/refresh'), {
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
            localStorage.setItem('cheka_current_user', JSON.stringify(refreshData.user));
            setUser(refreshData.user);
          } else {
            setAccessToken(null);
            setRefreshToken(null);
            localStorage.removeItem('cheka_access_token');
            localStorage.removeItem('cheka_refresh_token');
          }
        } catch {
          // offline mode
        }
      }

      // If still no session, user is an unauthenticated guest
      setUser(null);
      setIsLoading(false);
    };

    initSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(resolveApiUrl('/api/auth/login'), {
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
      localStorage.setItem('cheka_current_user', JSON.stringify(data.user));
      setUser(data.user);

      // Auto-unlock owner if email matches
      if (OWNER_EMAILS.includes(email.toLowerCase())) {
        setIsOwnerUnlocked(true);
        localStorage.setItem('cheka_owner_unlocked', 'true');
      }

      return { success: true };
    } catch {
      // In offline mobile WebView mode or remote network block, provide an instant local account
      const username = email.split('@')[0] || 'ChekaUser';
      const localUser: User = {
        id: 'local_' + Math.random().toString(36).substring(2, 9),
        username: username,
        email: email,
        avatarUrl: '/assets/images/swahili_comedian_avatar_1792057038016.jpg',
        createdAt: new Date().toISOString()
      };
      const mockToken = 'cheka_local_token_' + Date.now();
      setAccessToken(mockToken);
      localStorage.setItem('cheka_access_token', mockToken);
      localStorage.setItem('cheka_current_user', JSON.stringify(localUser));
      setUser(localUser);

      if (OWNER_EMAILS.includes(email.toLowerCase())) {
        setIsOwnerUnlocked(true);
        localStorage.setItem('cheka_owner_unlocked', 'true');
      }

      return { success: true };
    }
  };

  const signup = async (username: string, email: string, password: string) => {
    try {
      const res = await fetch(resolveApiUrl('/api/auth/signup'), {
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
      localStorage.setItem('cheka_current_user', JSON.stringify(data.user));
      setUser(data.user);

      if (OWNER_EMAILS.includes(email.toLowerCase())) {
        setIsOwnerUnlocked(true);
        localStorage.setItem('cheka_owner_unlocked', 'true');
      }

      return { success: true };
    } catch {
      const localUser: User = {
        id: 'local_' + Math.random().toString(36).substring(2, 9),
        username: username || 'ChekaCreator',
        email: email,
        avatarUrl: '/assets/images/swahili_comedian_avatar_1792057038016.jpg',
        createdAt: new Date().toISOString()
      };
      const mockToken = 'cheka_local_token_' + Date.now();
      setAccessToken(mockToken);
      localStorage.setItem('cheka_access_token', mockToken);
      localStorage.setItem('cheka_current_user', JSON.stringify(localUser));
      setUser(localUser);

      if (OWNER_EMAILS.includes(email.toLowerCase())) {
        setIsOwnerUnlocked(true);
        localStorage.setItem('cheka_owner_unlocked', 'true');
      }

      return { success: true };
    }
  };

  const logout = async () => {
    try {
      await fetch(resolveApiUrl('/api/auth/logout'), {
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
      lockOwnerSession();
      localStorage.removeItem('cheka_access_token');
      localStorage.removeItem('cheka_refresh_token');
      localStorage.removeItem('cheka_current_user');
    }
  };

  // Authenticated fetch wrapper that automatically resolves endpoint and attaches Bearer token
  const authFetch = async (url: string, options: RequestInit = {}) => {
    const targetUrl = resolveApiUrl(url);
    const headers = new Headers(options.headers || {});
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    let response = await fetch(targetUrl, { ...options, headers });

    // If token expired (401), attempt 1 refresh rotation automatically
    if (response.status === 401 && refreshToken) {
      try {
        const refreshRes = await fetch(resolveApiUrl('/api/auth/refresh'), {
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
          localStorage.setItem('cheka_current_user', JSON.stringify(refreshData.user));

          headers.set('Authorization', `Bearer ${refreshData.accessToken}`);
          response = await fetch(targetUrl, { ...options, headers });
        } else {
          logout();
        }
      } catch {
        logout();
      }
    }

    return response;
  };

  const updateProfile = async (data: { username?: string; avatarUrl?: string }) => {
    try {
      const res = await authFetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) {
        return { success: false, error: resData.error || 'Failed to update profile' };
      }
      setUser(resData.user);
      localStorage.setItem('cheka_current_user', JSON.stringify(resData.user));
      return { success: true };
    } catch {
      if (user) {
        const updated = { ...user, ...data };
        setUser(updated);
        localStorage.setItem('cheka_current_user', JSON.stringify(updated));
        return { success: true };
      }
      return { success: false, error: 'Network error' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        isOwner,
        unlockOwnerSession,
        lockOwnerSession,
        login,
        signup,
        logout,
        updateProfile,
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
