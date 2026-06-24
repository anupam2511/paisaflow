/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Preferences } from '../types';

export function formatCurrency(amount: number, preferences: Preferences, decimals?: number): string {
  // Format Indian National Rupees style with proper commas if applicable, else native
  const symbol = preferences.currencySymbol || '₹';
  const dec = decimals !== undefined ? decimals : 0;
  try {
    const formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec
    }).format(amount);
    return `${symbol}${formatted}`;
  } catch (e) {
    return `${symbol}${amount.toFixed(dec)}`;
  }
}

export function formatCompactCurrency(amount: number, preferences: Preferences): string {
  const symbol = preferences.currencySymbol || '₹';
  const absVal = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  
  if (absVal >= 10000000) { // 1 Crore = 10,000,000
    const val = absVal / 10000000;
    return `${sign}${symbol}${val.toFixed(1).replace(/\.0$/, '')}Cr`;
  }
  if (absVal >= 100000) { // 1 Lakh = 100,000
    const val = absVal / 100000;
    return `${sign}${symbol}${val.toFixed(1).replace(/\.0$/, '')}L`;
  }
  if (absVal >= 1000) { // 1k = 1,000
    const val = absVal / 1000;
    return `${sign}${symbol}${val.toFixed(1).replace(/\.0$/, '')}k`;
  }
  return `${sign}${symbol}${absVal}`;
}

export function formatMonthYear(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function getDaysRemaining(targetDateStr: string): number {
  const target = new Date(targetDateStr);
  const now = new Date();
  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}
