/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  id,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm border border-transparent',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-transparent dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100',
    outline: 'border border-slate-300 hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:hover:bg-slate-850 dark:text-slate-300',
    ghost: 'hover:bg-slate-100 text-slate-700 dark:hover:bg-slate-800 dark:text-slate-300',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm border border-transparent',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  const buttonId = id || `btn_${Math.random().toString(36).substring(2, 9)}`;

  return (
    <button
      id={buttonId}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
