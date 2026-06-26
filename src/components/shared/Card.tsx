/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface CardProps {
  id?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  extra?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  accent?: 'blue' | 'emerald' | 'yellow' | 'rose' | 'violet' | 'none';
}

export function Card({
  id,
  title,
  subtitle,
  extra,
  children,
  className = '',
  bodyClassName = '',
  accent = 'none',
}: CardProps) {
  const accentClasses = {
    none: 'border-slate-100 dark:border-slate-800/80',
    blue: 'border-blue-100 dark:border-blue-900/50 border-t-4 border-t-indigo-600',
    emerald: 'border-emerald-100 dark:border-emerald-900/50 border-t-4 border-t-emerald-600',
    yellow: 'border-yellow-100 dark:border-yellow-900/50 border-t-4 border-t-amber-500',
    rose: 'border-rose-100 dark:border-rose-900/50 border-t-4 border-t-rose-600',
    violet: 'border-violet-100 dark:border-violet-900/50 border-t-4 border-t-violet-600',
  };

  return (
    <div
      id={id}
      className={`bg-white dark:bg-[#0b1329] rounded-3xl border shadow-xs overflow-hidden transition duration-250 ${accentClasses[accent]} ${className}`}
    >
      {(title || subtitle || extra) && (
        <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800/40 flex items-center justify-between gap-4">
          <div>
            {title && (
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 leading-snug">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {extra && <div className="shrink-0">{extra}</div>}
        </div>
      )}
      <div className={`p-6 ${bodyClassName}`}>{children}</div>
    </div>
  );
}
