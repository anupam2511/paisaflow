/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Preferences } from '../../types';
import { formatCurrency, formatCompactCurrency } from '../../utils/formatters';

export interface CurrencyValueProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number;
  decimals?: number;
  compact?: boolean;
  privacyMode?: boolean;
  allowClickToReveal?: boolean;
  className?: string;
  id?: string;
}

export function CurrencyValue({
  value,
  decimals,
  compact = false,
  privacyMode = false,
  allowClickToReveal = true,
  className = '',
  id,
  ...props
}: CurrencyValueProps) {
  const { financeData } = useFinance();
  const [revealed, setRevealed] = useState(false);

  const defaultPreferences: Preferences = {
    currencySymbol: '₹',
    largeExpenseThreshold: 4000,
    themeMode: 'light',
    accentColor: 'blue'
  };

  const preferences: Preferences = financeData?.preferences || defaultPreferences;
  
  const spanId = id || `currency_${Math.random().toString(36).substring(2, 9)}`;

  // Determine if we should mask
  const shouldMask = privacyMode && !revealed;

  const formattedText = compact
    ? formatCompactCurrency(value, preferences)
    : formatCurrency(value, preferences, decimals);

  const handleClick = (e: React.MouseEvent) => {
    if (privacyMode && allowClickToReveal) {
      e.stopPropagation();
      setRevealed(!revealed);
    }
  };

  return (
    <span
      id={spanId}
      className={`font-mono transition-colors duration-150 select-none
        ${shouldMask ? 'bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded cursor-pointer select-none border border-slate-200/50 hover:bg-slate-200/80 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700/50 dark:hover:bg-slate-750' : ''}
        ${className}`}
      onClick={handleClick}
      title={shouldMask ? 'Click to reveal balance' : undefined}
      {...props}
    >
      {shouldMask ? '••••' : formattedText}
    </span>
  );
}
