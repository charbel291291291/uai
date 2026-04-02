import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  retry?: () => Promise<void>;
}

export interface ToastOptions {
  title: string;
  message?: string;
  duration?: number;
  retry?: () => Promise<void>;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (type: ToastType, options: ToastOptions) => string;
  removeToast: (id: string) => void;
  success: (options: ToastOptions) => string;
  error: (options: ToastOptions) => string;
  warning: (options: ToastOptions) => string;
  info: (options: ToastOptions) => string;
  dismissAll: () => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface ToastProviderProps {
  children: ReactNode;
  defaultDuration?: number;
  maxToasts?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  defaultDuration = 5000,
  maxToasts = 5,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, options: ToastOptions): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const newToast: Toast = {
        id,
        type,
        title: options.title,
        message: options.message,
        duration: options.duration ?? defaultDuration,
        retry: options.retry,
      };

      setToasts((prev) => {
        const updated = [...prev, newToast];
        // Keep only the most recent toasts if we exceed max
        if (updated.length > maxToasts) {
          return updated.slice(updated.length - maxToasts);
        }
        return updated;
      });

      // Auto-dismiss if duration is set
      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, newToast.duration);
      }

      return id;
    },
    [defaultDuration, maxToasts, removeToast]
  );

  const success = useCallback(
    (options: ToastOptions) => addToast('success', options),
    [addToast]
  );

  const error = useCallback(
    (options: ToastOptions) => addToast('error', options),
    [addToast]
  );

  const warning = useCallback(
    (options: ToastOptions) => addToast('warning', options),
    [addToast]
  );

  const info = useCallback(
    (options: ToastOptions) => addToast('info', options),
    [addToast]
  );

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, success, error, warning, info, dismissAll }}
    >
      {children}
    </ToastContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;
