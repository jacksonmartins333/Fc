import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logout as logoutAuth } from '../lib/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  needsAuth: boolean;
  isLoggingIn: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [needsAuth, setNeedsAuth] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setUser(user);
        setNeedsAuth(false);
      },
      () => {
        setUser(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  const clearError = () => setError(null);

  const login = async () => {
    setError(null);
    try {
      // Start sign in immediately to avoid popup blocker
      const signInPromise = googleSignIn();
      setIsLoggingIn(true);
      const result = await signInPromise;

      if (result) {
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err: any) {
      if (err?.code === 'auth/popup-blocked') {
        setError('O popup de login foi bloqueado pelo navegador. Por favor, clique em "Open in new tab" (ícone no topo direito) para acessar o aplicativo em uma nova aba e fazer login.');
      } else {
        setError('Erro ao fazer login: ' + err.message + '. Caso o login não abra, clique em "Open in new tab" (ícone no topo direito).');
      }
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    await logoutAuth();
    setUser(null);
    setToken(null);
    setNeedsAuth(true);
  };

  return (
    <AuthContext.Provider value={{ user, token, needsAuth, isLoggingIn, error, login, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
