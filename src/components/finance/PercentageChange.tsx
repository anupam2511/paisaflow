/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export interface PercentageChangeProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number; // e.g. 5.4 for +5.4%, or -3.2 for -3.2%
  showIcon?: boolean;
  neutralZero?: boolean;
  className?: string;
  id?: string;
}

export function PercentageChange({
  value,
  showIcon = true,
  neutralZero = true,
  className = '',
  id,
  ...props
}: PercentageChangeProps) {
  const spanId = id || `percent_${Math.random().toString(36).substring(2, 9)}`;

  const isPositive = value > 0;
  const isZero = value === 0;

  let textClass = 'text-slate-500';
  if (!isZero || !neutralZero) {
    textClass = isPositive 
      ? 'text-emerald-600 dark:text-emerald-400 font-medium' 
      : 'text-rose-600 dark:text-rose-400 font-medium';
  }

  const sign = isPositive ? '+' : '';
  const formattedVal = `${sign}${value.toFixed(1)}%`;

  return (
    <span
      id={spanId}
      className={`inline-flex items-center space-x-0.5 text-xs ${textClass} ${className}`}
      {...props}
    >
      {showIcon && !isZero && (
        isPositive 
          ? <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0" /> 
          : <ArrowDownRight className="w-3.5 h-3.5 flex-shrink-0" />
      )}
      <span>{formattedVal}</span>
    </span>
  );
}
