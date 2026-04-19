import React from 'react';
import { useToastStore } from '../store/useToastStore';

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md border animate-in slide-in-from-right-10 duration-300
            ${toast.type === 'error' 
              ? 'bg-destructive/10 border-destructive/20 text-red-400' 
              : toast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-primary/10 border-primary/20 text-primary'
            }
          `}
        >
          <span className="material-symbols-outlined text-[20px]">
            {toast.type === 'error' ? 'report' : toast.type === 'success' ? 'check_circle' : 'info'}
          </span>
          <span className="text-sm font-bold tracking-tight">{toast.message}</span>
          <button 
            onClick={() => removeToast(toast.id)}
            className="ml-2 p-1 hover:bg-white/5 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      ))}
    </div>
  );
}
