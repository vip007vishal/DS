import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

interface AuthContextType {
  user: any | null;
  token: string | null;
  vaultToken: string | null;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  setVaultToken: (token: string | null) => void;
  isVaultUnlocked: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [vaultToken, setVaultTokenState] = useState<string | null>(localStorage.getItem('vaultToken'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.auth.me(token)
        .then(setUser)
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (data: any) => {
    const res = await api.auth.login(data);
    localStorage.setItem('token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (data: any) => {
    const res = await api.auth.register(data);
    localStorage.setItem('token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('vaultToken');
    setToken(null);
    setUser(null);
    setVaultTokenState(null);
  };

  const setVaultToken = (t: string | null) => {
    if (t) localStorage.setItem('vaultToken', t);
    else localStorage.removeItem('vaultToken');
    setVaultTokenState(t);
  };

  const isVaultUnlocked = !!vaultToken;

  return (
    <AuthContext.Provider value={{ user, token, vaultToken, login, register, logout, setVaultToken, isVaultUnlocked }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
