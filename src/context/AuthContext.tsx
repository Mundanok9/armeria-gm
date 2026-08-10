import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState } from '../types/index';
import { ApiService } from '../services/api';

interface AuthContextType extends AuthState {
  login: (matricula: string, pass: string) => Promise<void>;
  logout: () => void;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('armeria_gm_token'),
    isAuthenticated: false,
    isLoading: true,
  });

  const checkAuth = async () => {
    const token = localStorage.getItem('armeria_gm_token');
    if (!token) {
      setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const user = await ApiService.getProfile();
      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      console.error('Session validation error:', err);
      ApiService.clearToken();
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (matricula: string, pass: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const res = await ApiService.login(matricula, pass);
      setState({
        user: res.user,
        token: res.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = () => {
    ApiService.clearToken();
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refetchUser: checkAuth }}>
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
