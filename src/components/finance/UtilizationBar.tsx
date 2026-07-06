/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CurrencyValue } from './CurrencyValue';

export interface UtilizationBarProps {
  value: number; // utilized amount
  limit: number; // total limit/budget
  warningThreshold?: number; // percentage where bar turns warning (yellow), default 50
  dangerThreshold?: number; // percentage where bar turns danger (red), default 80
  showLabels?: boolean;
  privacyMode?: boolean;
  className?: string;
  id?: string;
}

export function UtilizationBar({
  value,
  limit,
  warningThreshold = 50,
  dangerThreshold = 80,
  showLabels = true,
  privacyMode = false,
  className = '',
  id,
}: UtilizationBarProps) {
  const barId = id || `util_bar_${Math.random().toString(36).substring(2, 9)}`;

  const percent = limit > 0 ? (value / limit) * 100 : 0;
  const clampedPercent = Math.min(100, Math.max(0, percent));

  let barColor = 'bg-emerald-500 dark:bg-emerald-600';
  let textColor = 'text-emerald-700 dark:text-emerald-400';

  if (percent >= dangerThreshold) {
    barColor = 'bg-rose-500 dark:bg-rose-600';
    textColor = 'text-rose-700 dark:text-rose-400';
  } else if (percent >= warningThreshold) {
    barColor = 'bg-amber-500 dark:bg-amber-600';
    textColor = 'text-amber-700 dark:text-amber-400';
  }

  return (
    <div id={barId} className={`w-full flex flex-col space-y-1.5 ${className}`}>
      {showLabels && (
        <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
          <span className="flex items-center space-x-1">
            <CurrencyValue value={value} privacyMode={privacyMode} compact />
            <span className="text-slate-400 dark:text-slate-500 font-normal">of</span>
            <CurrencyValue value={limit} privacyMode={privacyMode} compact />
          </span>
          <span className={textColor}>
            {clampedPercent.toFixed(0)}%
          </span>
        </div>
      )}

      {/* Progress Track */}
      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>
    </div>
  );
}
