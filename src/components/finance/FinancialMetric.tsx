/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { CurrencyValue } from './CurrencyValue';
import { PercentageChange } from './PercentageChange';

export interface FinancialMetricProps {
  label: string;
  value: number;
  trend?: number; // percentage change value
  description?: string;
  decimals?: number;
  compact?: boolean;
  privacyMode?: boolean;
  icon?: React.ReactNode;
  className?: string;
  id?: string;
}

export function FinancialMetric({
  label,
  value,
  trend,
  description,
  decimals,
  compact = false,
  privacyMode = false,
  icon,
  className = '',
  id,
}: FinancialMetricProps) {
  const metricId = id || `metric_${Math.random().toString(36).substring(2, 9)}`;

  return (
    <Card id={metricId} className={`overflow-hidden ${className}`}>
      <CardContent className="p-5 flex flex-col justify-between h-full">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wide uppercase">
              {label}
            </p>
            <h4 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1.5 flex items-baseline space-x-1.5">
              <CurrencyValue
                value={value}
                decimals={decimals}
                compact={compact}
                privacyMode={privacyMode}
              />
            </h4>
          </div>
          {icon && (
            <div className="p-2 bg-slate-50 dark:bg-slate-850 rounded-lg text-slate-600 dark:text-slate-400 flex items-center justify-center">
              {icon}
            </div>
          )}
        </div>

        {(trend !== undefined || description) && (
          <div className="flex items-center space-x-2 mt-4 text-xs">
            {trend !== undefined && (
              <PercentageChange value={trend} />
            )}
            {description && (
              <span className="text-slate-500 dark:text-slate-400 font-normal">
                {description}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
