/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type InvestmentType =
  | 'mutual_fund'
  | 'stock'
  | 'ppf'
  | 'nps'
  | 'ssy'
  | 'ulip'
  | 'gold'
  | 'fd';

export interface Investment {
  id: string;
  name: string;
  type: string; // e.g. "Mutual Funds", "Alternative Assets" or custom user categories
  investmentType: 'recurring' | 'spot';
  amount: number;             // Periodic amount for recurring, lump sum for spot
  frequency?: 'monthly' | 'quarterly' | 'yearly'; // for recurring
  hasEndDate: boolean;
  endDate?: string;           // YYYY-MM
  startDate: string;         // YYYY-MM-DD or YYYY-MM
  totalInvested: number;      // Current or total accrued value
  accountId: string;          // Selected Bank Account
  notes?: string;
  isAutoDebit?: boolean;      // If true, automatically logs expense & transfers to investment total on due date
  billingDay?: number;        // Day of month (1-31) for the SIP/recurring payment
  nextBillingDate?: string;   // YYYY-MM-DD representing when next auto-debit triggers
}
