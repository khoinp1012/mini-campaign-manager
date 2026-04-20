import React from 'react';
import { useToastStore } from '../store/useToastStore';

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border-2 backdrop-blur-md animate-in slide-in-from-right-10 duration-300
            ${toast.type === 'error' 
              ? 'bg-red-500/30 border-red-500/50 text-white shadow-[0_0_30px_rgba(239,68,68,0.2)]' 
              : toast.type === 'success'
              ? 'bg-emerald-500/30 border-emerald-500/50 text-white shadow-[0_0_30px_rgba(16,185,129,0.2)]'
              : 'bg-primary/30 border-primary/50 text-white shadow-[0_0_30px_rgba(62,73,187,0.2)]'
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
