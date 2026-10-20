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
  continueAsGuest: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [needsAuth, setNeedsAuth] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(() => {
    return {
      uid: 'guest_local',
      displayName: 'Peladeiro',
      email: '',
      photoURL: '',
    } as unknown as User;
  });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser);
          setNeedsAuth(false);
        }
      },
      () => {
        // Keep guest user so app is always interactive
        setUser((curr) => {
          if (curr && curr.uid !== 'guest_local') {
            return {
              uid: 'guest_local',
              displayName: 'Peladeiro',
              email: '',
              photoURL: '',
            } as unknown as User;
          }
          return curr;
        });
        setNeedsAuth(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const clearError = () => setError(null);

  const continueAsGuest = () => {
    localStorage.setItem('grota_guest_mode', 'true');
    setUser({
      uid: 'guest_local',
      displayName: 'Peladeiro (Modo Local)',
      email: '',
      photoURL: '',
    } as unknown as User);
    setNeedsAuth(false);
    setError(null);
  };

  const login = async () => {
    setError(null);
    try {
      // Start sign in immediately to avoid popup blocker
      const signInPromise = googleSignIn();
      setIsLoggingIn(true);
      const result = await signInPromise;

      if (result) {
        localStorage.removeItem('grota_guest_mode');
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err: any) {
      if (err?.code === 'auth/unauthorized-domain') {
        setError('O domínio da Hostinger ainda não foi liberado no Firebase Auth. Você pode usar o aplicativo normalmente clicando em "Entrar no Grota F.C (Modo Local)" abaixo!');
      } else if (err?.code === 'auth/popup-blocked') {
        setError('O popup de login foi bloqueado pelo navegador. Por favor, libere popups ou clique em "Entrar no Grota F.C (Modo Local)" para continuar.');
      } else {
        setError('Erro ao fazer login: ' + (err?.message || 'Falha na autenticação') + '. Você pode usar o "Modo Local" para acessar agora.');
      }
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem('grota_guest_mode');
    await logoutAuth();
    setUser(null);
    setToken(null);
    setNeedsAuth(true);
  };

  return (
    <AuthContext.Provider value={{ user, token, needsAuth, isLoggingIn, error, login, logout, continueAsGuest, clearError }}>
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
