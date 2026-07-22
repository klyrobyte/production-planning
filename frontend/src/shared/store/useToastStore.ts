import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastData {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
}

interface ToastState {
  toast: ToastData | null;
  showToast: (message: string, type?: ToastType, title?: string) => void;
  hideToast: () => void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState>((set) => ({
  toast: null,

  showToast: (message: string, type: ToastType = 'success', title?: string) => {
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }

    const id = Date.now().toString();
    set({ toast: { id, message, type, title } });

    // Auto dismiss after 4 seconds
    toastTimer = setTimeout(() => {
      set({ toast: null });
      toastTimer = null;
    }, 4000);
  },

  hideToast: () => {
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }
    set({ toast: null });
  },
}));
