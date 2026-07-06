/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';

export interface ChartContainerProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  height?: number | string;
  extraHeaderActions?: React.ReactNode;
  className?: string;
  id?: string;
}

export function ChartContainer({
  title,
  description,
  children,
  height = 300,
  extraHeaderActions,
  className = '',
  id,
}: ChartContainerProps) {
  const containerId = id || `chart_container_${Math.random().toString(36).substring(2, 9)}`;

  return (
    <Card id={containerId} className={`overflow-hidden ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {extraHeaderActions && (
          <div className="flex items-center space-x-2">
            {extraHeaderActions}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-6 pt-4">
        <div style={{ width: '100%', height }}>
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

// Common Recharts Theme Configuration Constants
export const CHART_THEME = {
  gridLight: '#f1f5f9', // slate-100
  gridDark: '#1e293b',  // slate-800
  textLight: '#64748b', // slate-500
  textDark: '#94a3b8',  // slate-400
  
  // High contrast palette
  colors: {
    indigo: '#4f46e5',
    emerald: '#10b981',
    rose: '#f43f5e',
    amber: '#f59e0b',
    sky: '#0ea5e9',
    violet: '#8b5cf6',
  }
};
