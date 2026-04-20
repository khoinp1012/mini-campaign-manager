import { create } from 'zustand';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastStore {
  toasts: Toast[];
  addToast: (message: string, type: Toast['type']) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, type) => {
    set((state) => {
      // FE-14: Toast De-duplication Logic
      // Prevents UI spam and stabilizes deterministic tests
      const isDuplicate = state.toasts.some(t => t.message === message && t.type === type);
      if (isDuplicate) return state;

      const id = Math.random().toString(36).substring(2, 9);
      
      setTimeout(() => {
        useToastStore.getState().removeToast(id);
      }, 5000);

      return {
        toasts: [...state.toasts, { id, message, type }],
      };
    });
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
