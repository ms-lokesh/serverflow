import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, ApiError } from '../services/api';
import { wsClient } from '../services/websocket';
import { Role } from '../types';

export interface AuthUser {
  id: string;
  restaurantId: string;
  employeeId: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'ADMIN' | 'DINING' | 'KITCHEN' | 'TAKEAWAY';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  avatar?: string;
  restaurantName?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  role: Role | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Map backend uppercase role to frontend lowercase Role type
  const normalizedRole: Role | null = user
    ? (user.role.toLowerCase() as Role)
    : null;

  // Restore authenticated session on page load / refresh
  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const res = await api.auth.me();
        if (mounted && res.success && res.data?.user) {
          setUser(res.data.user);
          setPermissions(res.data.permissions || []);
          wsClient.connect();
        }
      } catch {
        // Not logged in or expired session
        if (mounted) {
          setUser(null);
          setPermissions([]);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (identifier: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.auth.login(identifier, password);
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        setPermissions(res.data.permissions || []);
        wsClient.connect();
        setIsLoading(false);
        return { success: true };
      }
      setIsLoading(false);
      return { success: false, error: 'Authentication failed' };
    } catch (err: any) {
      setIsLoading(false);
      const message = err.message || 'Invalid employee ID or password.';
      setError(message);
      return { success: false, error: message };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await api.auth.logout();
    } catch {
      // Proceed with local logout regardless
    } finally {
      setUser(null);
      setPermissions([]);
      wsClient.disconnect();
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return permissions.includes(permission);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        role: normalizedRole,
        permissions,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        logout,
        hasPermission,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
