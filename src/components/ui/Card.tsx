/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverable?: boolean;
  className?: string;
  id?: string;
}

export function Card({
  children,
  hoverable = false,
  className = '',
  id,
  ...props
}: CardProps) {
  const cardId = id || `card_${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div
      id={cardId}
      className={`bg-white dark:bg-[#0b1329] border border-slate-100 dark:border-slate-800/80 rounded-3xl shadow-xs transition-all duration-200
        ${hoverable ? 'hover:shadow-md hover:border-slate-200/80 dark:hover:border-slate-700/80 cursor-pointer' : ''}
        ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function CardHeader({
  children,
  className = '',
  id,
  ...props
}: CardHeaderProps) {
  const headerId = id || `card_header_${Math.random().toString(36).substring(2, 9)}`;
  return (
    <div
      id={headerId}
      className={`p-6 pb-4 flex flex-col space-y-1.5 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function CardTitle({
  children,
  className = '',
  id,
  ...props
}: CardTitleProps) {
  const titleId = id || `card_title_${Math.random().toString(36).substring(2, 9)}`;
  return (
    <h3
      id={titleId}
      className={`text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function CardDescription({
  children,
  className = '',
  id,
  ...props
}: CardDescriptionProps) {
  const descId = id || `card_desc_${Math.random().toString(36).substring(2, 9)}`;
  return (
    <p
      id={descId}
      className={`text-xs text-slate-500 dark:text-slate-400 ${className}`}
      {...props}
    >
      {children}
    </p>
  );
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function CardContent({
  children,
  className = '',
  id,
  ...props
}: CardContentProps) {
  const contentId = id || `card_content_${Math.random().toString(36).substring(2, 9)}`;
  return (
    <div
      id={contentId}
      className={`p-6 pt-0 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function CardFooter({
  children,
  className = '',
  id,
  ...props
}: CardFooterProps) {
  const footerId = id || `card_footer_${Math.random().toString(36).substring(2, 9)}`;
  return (
    <div
      id={footerId}
      className={`p-6 pt-0 flex items-center border-t border-slate-50 dark:border-slate-850 mt-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
