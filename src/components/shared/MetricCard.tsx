/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  id?: string;
  title: string;
  value: string | number;
  icon?: LucideIcon;
  subtext?: string;
  trend?: {
    value: string | number;
    type: 'positive' | 'negative' | 'neutral';
  };
  colorClassName?: string;
  iconColorClassName?: string;
  className?: string;
}

export function MetricCard({
  id,
  title,
  value,
  icon: Icon,
  subtext,
  trend,
  colorClassName = 'text-slate-800 dark:text-slate-100',
  iconColorClassName = 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/35',
  className = '',
}: MetricCardProps) {
  return (
    <div
      id={id}
      className={`bg-white dark:bg-[#0b1329] p-5 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-xs flex items-center justify-between gap-4 transition duration-200 hover:shadow-md ${className}`}
    >
      <div className="min-w-0">
        <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest block leading-none mb-1">
          {title}
        </span>
        <span className={`text-base md:text-xl font-black font-mono tracking-tight block ${colorClassName}`}>
          {value}
        </span>
        {(subtext || trend) && (
          <div className="flex items-center gap-1.5 mt-1.5 min-w-0">
            {trend && (
              <span
                className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shrink-0 ${
                  trend.type === 'positive'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-450'
                    : trend.type === 'negative'
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-450'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-500'
                }`}
              >
                {trend.value}
              </span>
            )}
            {subtext && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold truncate leading-none">
                {subtext}
              </span>
            )}
          </div>
        )}
      </div>

      {Icon && (
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0 ${iconColorClassName}`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}
