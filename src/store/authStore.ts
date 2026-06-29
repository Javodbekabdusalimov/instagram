import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  savedPosts: string[];
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  updateUser: (user: User) => void;
  setSavedPosts: (ids: string[]) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  savedPosts: [],
  isAuthenticated: !!localStorage.getItem('token'),
  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    set({
      user,
      token,
      isAuthenticated: true,
      savedPosts: (user as any).savedPosts ?? [],
    });
  },
  updateUser: (user) => set({ user }),
  setSavedPosts: (ids) => set({ savedPosts: ids }),
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false, savedPosts: [] });
  },
}));
