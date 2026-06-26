/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  id: string;
  label: string;
  currencySymbol: string;
  value: number | '';
  onChange: (value: number | '') => void;
  helperText?: string;
  error?: string;
}

export function CurrencyInput({
  id,
  label,
  currencySymbol,
  value,
  onChange,
  helperText,
  error,
  className = '',
  ...props
}: CurrencyInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange('');
    } else {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        onChange(num);
      }
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <label
        htmlFor={id}
        className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5"
      >
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold font-mono text-xs">
          {currencySymbol}
        </span>
        <input
          {...props}
          id={id}
          type="number"
          step="any"
          value={value === 0 ? '0' : value === '' ? '' : value}
          onChange={handleChange}
          className={`w-full bg-slate-50 dark:bg-slate-900 border ${
            error
              ? 'border-rose-400 focus:ring-rose-500/20'
              : 'border-slate-150 dark:border-slate-800 focus:ring-indigo-500/20'
          } rounded-2xl pl-8 pr-4 py-3 text-xs font-semibold focus:outline-none focus:ring-4 transition`}
        />
      </div>
      {error && <p className="text-[10px] font-bold text-rose-500 mt-1">{error}</p>}
      {!error && helperText && <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-1">{helperText}</p>}
    </div>
  );
}
