/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: string;
}

export function LoadingSpinner({
  size = 'md',
  className = '',
  color = 'text-indigo-600 dark:text-indigo-400',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <Loader2 
      className={`animate-spin ${sizeClasses[size]} ${color} ${className}`} 
    />
  );
}

interface LoadingOverlayProps {
  message?: string;
  submessage?: string;
  className?: string;
}

export function LoadingOverlay({
  message = 'Processing financial transactions...',
  submessage = 'Securing cloud databases & recalculating balances',
  className = '',
}: LoadingOverlayProps) {
  return (
    <div
      id="loading-overlay"
      className={`fixed inset-0 z-[9999] bg-slate-900/40 dark:bg-[#030712]/60 backdrop-blur-md flex flex-col justify-center items-center p-6 ${className}`}
    >
      <div className="bg-white dark:bg-[#0b1329] p-8 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-2xl flex flex-col items-center text-center max-w-sm w-full animate-scale-in">
        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/45 rounded-2.5xl flex items-center justify-center border border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 mb-5 relative">
          <LoadingSpinner size="md" />
          <div className="absolute w-2 h-2 bg-indigo-600 rounded-full animate-ping top-1 right-1" />
        </div>
        
        <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 leading-tight">
          {message}
        </h3>
        
        {submessage && (
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-2">
            {submessage}
          </p>
        )}
      </div>
    </div>
  );
}

export function PageLoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 border border-indigo-100 dark:border-indigo-900/30">
        <LoadingSpinner size="sm" />
      </div>
      <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
        Syncing Balances
      </h3>
      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold max-w-xs mt-1 uppercase tracking-wider">
        Verifying cryptographic ledgers
      </p>
    </div>
  );
}
