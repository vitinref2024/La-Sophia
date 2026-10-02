import React, { useEffect } from 'react';
import { Check, ShoppingBag, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  subtitle?: string;
  actionText?: string;
  onAction?: () => void;
}

interface ToastNotificationProps {
  toast: ToastMessage | null;
  onClose: () => void;
  hasBottomCartBar?: boolean;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  toast,
  onClose,
  hasBottomCartBar = false,
}) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 2800);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed left-4 right-4 sm:left-auto sm:right-6 z-50 max-w-sm sm:max-w-md mx-auto sm:mx-0 transition-all duration-300 animate-slide-up ${
        hasBottomCartBar
          ? 'bottom-[76px] sm:bottom-6'
          : 'bottom-4 sm:bottom-6'
      }`}
    >
      <div className="bg-[#1C1C1C] text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center justify-between gap-3 backdrop-blur-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-semibold truncate text-white">
              {toast.title}
            </p>
            {toast.subtitle && (
              <p className="text-[11px] text-neutral-400 truncate">
                {toast.subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {toast.onAction && (
            <button
              type="button"
              onClick={() => {
                toast.onAction?.();
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg bg-[#E4171E] hover:bg-[#B80F16] active:scale-95 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{toast.actionText || 'Ver'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer rounded-lg"
            aria-label="Fechar notificação"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
