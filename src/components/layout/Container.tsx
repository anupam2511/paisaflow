/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  clean?: boolean;
  className?: string;
  id?: string;
}

export function Container({
  children,
  clean = false,
  className = '',
  id,
  ...props
}: ContainerProps) {
  const containerId = id || `container_${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div
      id={containerId}
      className={`w-full mx-auto px-4 sm:px-6 lg:px-8 ${clean ? '' : 'max-w-7xl'} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
