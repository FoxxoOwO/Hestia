import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('hestia_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async (authToken: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        return true;
      } else {
        setToken(null);
        setUser(null);
        localStorage.removeItem('hestia_token');
        return false;
      }
    } catch {
      setToken(null);
      setUser(null);
      localStorage.removeItem('hestia_token');
      return false;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('hestia_token');
      if (savedToken) {
        await fetchProfile(savedToken);
      } else {
        setToken(null);
        setUser(null);
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.access_token);
        setUser(data.user);
        localStorage.setItem('hestia_token', data.access_token);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Login request failed', e);
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('hestia_token');
  };

  const refreshUser = async () => {
    const currentToken = token || localStorage.getItem('hestia_token');
    if (currentToken) {
      await fetchProfile(currentToken);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, refreshUser }}>
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
