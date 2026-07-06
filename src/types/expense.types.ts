/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PaymentStatus = 'pending' | 'paid' | 'overdue';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;   // e.g., "Rent & Utilities", "Food & Dining", "Travel", "Shopping", "Entertainment", "Groceries", "Miscellaneous"
  date: string;       // YYYY-MM-DD
  accountId: string;  // ID of the bank or card used
  isRecurring: boolean;
  recurringId?: string; // Links to subscription if created automatically
  savingGoalId?: string; // Links to a savings goal if it represents a goal contribution
}

export interface RecurringSpend {
  id: string;
  name: string;       // e.g., "Netflix Premium", "Amazon Prime"
  amount: number;
  category: string;
  accountId: string;  // Connected account or credit card
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  billingDay: number; // Day of month (1-31)
  billingMonth?: number; // Starting month (1-12, optional/used for quarterly and yearly)
  nextBillingDate: string; // YYYY-MM-DD
  isActive: boolean;
  isVariableDate?: boolean; // If true, the billing date and account are variable and the user manually triggers payments
  isAutoDebit?: boolean; // If true, automatically logs expense and advances date when due
}
