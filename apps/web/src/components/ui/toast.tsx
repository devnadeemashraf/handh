'use client';

import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ToastItem {
  id: string;
  message: string;
  variant?: 'default' | 'success' | 'error' | 'info';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: ToastItem[];
  toast: (item: Omit<ToastItem, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback(
    (item: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => {
        // Enforce max 2 stacked toasts rule from design spec (third replaces oldest)
        const current = prev.length >= 2 ? prev.slice(1) : prev;
        return [...current, { ...item, id }];
      });

      // Auto dismiss after 3.5 seconds
      setTimeout(() => {
        dismiss(id);
      }, 3500);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastViewport({
  toasts,
  onDismiss
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      className="fixed z-50 flex flex-col gap-2 max-w-[360px] w-[calc(100%-2rem)] bottom-[72px] left-4 md:bottom-6 md:left-6 pointer-events-none"
    >
      {toasts.map((item) => (
        <ToastSingle key={item.id} item={item} onDismiss={() => onDismiss(item.id)} />
      ))}
    </div>
  );
}

function ToastSingle({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const variantIcons = {
    default: Info,
    info: Info,
    success: CheckCircle2,
    error: AlertCircle
  };
  const Icon = variantIcons[item.variant || 'default'];

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto flex items-center justify-between gap-3 p-3.5 bg-surface text-text-primary rounded-md border border-border-subtle shadow-elevation-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-base ease-decelerate select-none'
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon
          className={cn(
            'h-4 w-4 shrink-0',
            item.variant === 'success' && 'text-status-success',
            item.variant === 'error' && 'text-status-error',
            item.variant === 'info' && 'text-royal',
            (!item.variant || item.variant === 'default') && 'text-royal'
          )}
          aria-hidden="true"
        />
        <p className="text-sm font-medium leading-snug truncate">{item.message}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {item.action && (
          <button
            type="button"
            onClick={item.action.onClick}
            className="text-xs font-semibold text-royal hover:underline focus:outline-none"
          >
            {item.action.label}
          </button>
        )}
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Close notification"
          className="text-text-tertiary hover:text-text-primary p-0.5 rounded-sm"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
