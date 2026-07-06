/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'error' | 'warning' | 'info' | 'neutral' | 'indigo';
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function Badge({
  variant = 'neutral',
  className = '',
  children,
  id,
  ...props
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-colors duration-150';

  const variants = {
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30',
    error: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30',
    info: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-200/50 dark:border-sky-900/30',
    indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/30',
    neutral: 'bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-300 border border-slate-200/50 dark:border-slate-800/50',
  };

  const badgeId = id || `badge_${Math.random().toString(36).substring(2, 9)}`;

  return (
    <span
      id={badgeId}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
