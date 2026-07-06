import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';

const ToastContext = createContext(null);

const toastIcons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const toastStyles = {
  success: 'border-[#D8F3E3] bg-[#F0FBF5] text-[#159455]',
  error: 'border-[#FFE0E3] bg-[#FFF4F5] text-[#D92D20]',
  info: 'border-[#DCEBFF] bg-[#F2F7FF] text-[#2F7BFF]',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ message, type = 'success', duration = 2200 }) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((current) => [...current, { id, message, type }]);
      window.setTimeout(() => removeToast(id), duration);
      return id;
    },
    [removeToast],
  );

  const value = useMemo(() => ({ showToast, removeToast }), [showToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastViewport({ toasts, onClose }) {
  return (
    <div className="fixed right-5 top-20 z-50 flex w-[320px] flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => onClose(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }) {
  const Icon = toastIcons[toast.type] ?? Info;
  const style = toastStyles[toast.type] ?? toastStyles.info;

  return (
    <div className={`flex items-center gap-2 rounded-[12px] border px-3 py-2.5 shadow-[var(--shadow-toast)] ${style}`}>
      <Icon className="h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1 text-sm font-medium">{toast.message}</div>
      <button className="rounded p-1 opacity-70 hover:opacity-100" onClick={onClose} type="button">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default ToastProvider;
