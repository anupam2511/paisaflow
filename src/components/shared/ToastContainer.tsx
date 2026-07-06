/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useSettings, ToastMessage } from '../../context/SettingsContext';

export function ToastContainer() {
  const { toasts, removeToast } = useSettings();

  return (
    <div 
      id="toast-notifications-container" 
      className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 w-full max-w-sm px-4 sm:px-0 pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastItemProps {
  key?: string;
  toast: ToastMessage;
  onClose: (id: string) => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const config = {
    success: {
      bg: 'bg-white dark:bg-[#0b1329]',
      border: 'border-emerald-500/30 dark:border-emerald-500/20',
      icon: CheckCircle2,
      iconColor: 'text-emerald-500',
      shadow: 'shadow-emerald-500/10 dark:shadow-emerald-500/5',
      glow: 'shadow-[0_0_15px_-3px_rgba(16,185,129,0.15)]',
    },
    error: {
      bg: 'bg-white dark:bg-[#0b1329]',
      border: 'border-rose-500/30 dark:border-rose-500/20',
      icon: AlertTriangle,
      iconColor: 'text-rose-500',
      shadow: 'shadow-rose-500/10 dark:shadow-rose-500/5',
      glow: 'shadow-[0_0_15px_-3px_rgba(244,63,94,0.15)]',
    },
    info: {
      bg: 'bg-white dark:bg-[#0b1329]',
      border: 'border-indigo-500/30 dark:border-indigo-500/20',
      icon: Info,
      iconColor: 'text-indigo-500',
      shadow: 'shadow-indigo-500/10 dark:shadow-indigo-500/5',
      glow: 'shadow-[0_0_15px_-3px_rgba(99,102,241,0.15)]',
    },
  };

  const { bg, border, icon: Icon, iconColor, glow } = config[toast.type] || config.info;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
      className={`pointer-events-auto flex items-start gap-3.5 p-4 rounded-2xl border ${border} ${bg} ${glow} shadow-lg backdrop-blur-md w-full`}
    >
      <div className="shrink-0 mt-0.5">
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-normal break-words">
          {toast.message}
        </p>
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="shrink-0 p-0.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}
