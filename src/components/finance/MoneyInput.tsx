/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useFinance } from '../../context/FinanceContext';

export interface MoneyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  value: number | string;
  onChange: (value: number) => void;
  currencySymbol?: string;
  error?: string;
  helperText?: string;
}

export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ label, value, onChange, currencySymbol, error, helperText, className = '', id, ...props }, ref) => {
    const { financeData } = useFinance();
    const symbol = currencySymbol || financeData?.preferences?.currencySymbol || '₹';

    const inputId = id || `money_${Math.random().toString(36).substring(2, 9)}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/[^0-9.]/g, '');
      const parsedValue = parseFloat(rawValue);
      onChange(isNaN(parsedValue) ? 0 : parsedValue);
    };

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative rounded-lg shadow-sm">
          {/* Prefix */}
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <span className="text-slate-500 dark:text-slate-400 text-sm font-semibold select-none">
              {symbol}
            </span>
          </div>
          <input
            ref={ref}
            id={inputId}
            type="text"
            inputMode="decimal"
            value={value === 0 ? '' : value}
            onChange={handleInputChange}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={`block w-full pl-8 pr-3.5 py-2 text-sm text-slate-900 bg-white border rounded-lg transition-all duration-200 outline-none font-mono font-medium
              dark:bg-slate-900 dark:text-slate-100
              ${error 
                ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500' 
                : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400'
              }
              placeholder-slate-400 dark:placeholder-slate-500
              disabled:bg-slate-50 dark:disabled:bg-slate-950 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed
              ${className}`}
            placeholder="0"
            {...props}
          />
        </div>
        {error && (
          <p id={errorId} className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

MoneyInput.displayName = 'MoneyInput';
