/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  id?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  className = '',
  id,
}: PageHeaderProps) {
  const headerId = id || `page_header_${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div
      id={headerId}
      className={`flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 pb-6 border-b border-slate-100 dark:border-slate-800 mb-6 ${className}`}
    >
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 font-sans">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center space-x-3 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
