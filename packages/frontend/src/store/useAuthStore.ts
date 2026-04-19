import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isSessionLoading: boolean;
  setAuth: (user: User) => void;
  setSessionLoaded: () => void;
  logout: () => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isSessionLoading: true,
  setAuth: (user) => {
    set({ user, isAuthenticated: true, isSessionLoading: false });
  },
  setSessionLoaded: () => {
    set({ isSessionLoading: false });
  },
  logout: () => {
    set({ user: null, isAuthenticated: false, isSessionLoading: false });
  },
  clearAuth: () => {
    set({ user: null, isAuthenticated: false, isSessionLoading: false });
  },
}));
