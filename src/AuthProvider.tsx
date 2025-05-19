'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from './i18n/routing';

interface AuthContextType {
  isLoggedIn: boolean;
  checkLogin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const checkLogin = (): boolean => {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    return !!token;
  };

  useEffect(() => {
    const loggedIn = checkLogin();

    const publicPaths = ['/login', '/signup', '/public'];
    const pathIsPublic = publicPaths.some((path) => window.location.pathname.startsWith(path));

    if (!loggedIn && !pathIsPublic) {
      router.push(`/signin`);
    }
  }, [router]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, checkLogin }}>
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
