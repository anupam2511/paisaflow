/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, helperText, className = '', id, ...props }, ref) => {
    const selectId = id || `select_${Math.random().toString(36).substring(2, 9)}`;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={`block w-full px-3.5 py-2 pr-10 text-sm text-slate-900 bg-white border rounded-lg transition-all duration-200 outline-none appearance-none
              dark:bg-slate-900 dark:text-slate-100
              ${error 
                ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500' 
                : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400'
              }
              disabled:bg-slate-50 dark:disabled:bg-slate-950 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed
              ${className}`}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500 dark:text-slate-400">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
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

Select.displayName = 'Select';
