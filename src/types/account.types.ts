/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavingGoal } from './goal.types';
import { Income } from './income.types';
import { Expense, RecurringSpend } from './expense.types';
import { CategoryBudget } from './budget.types';
import { Investment } from './investment.types';
import { EmiItem, CreditCardEmiMaster } from './emi.types';
import { CcTransaction } from './creditCard.types';

export type CurrencyCode = 'INR';

export interface FinancialAccount {
  id: string;
  name: string;        // e.g. "Primary Savings", "Cash Back Visa"
  type: 'bank' | 'credit_card';
  institution: string; // e.g. "HDFC Bank", "ICICI", "SBI"
  balance: number;     // Current balance (positive for cash, outstanding debt for credit cards)
  color: string;       // Tailwind hex or CSS class color identifier
  limit?: number;      // Credit limit for credit cards
  linkedGroupId?: string;
  isMainCard?: boolean;
  billingCycleStartDay?: number; // e.g. 1-28/31 representing the start day of monthly statement cycle
  paymentDueDay?: number;        // e.g. Day of the month when payment is due
  mabRequired?: boolean;         // Has Minimum Average Balance requirement
  minimumAverageBalance?: number;// Required minimal balance amount
}

export interface NetWorthCategoryConfig {
  key: string;
  label: string;
  isManual: boolean;
  manualValue: number;
}

export interface Preferences {
  currencySymbol: string;     // default "₹"
  largeExpenseThreshold: number; // default 4000
  investmentCategories?: string[]; // user-defined investment holding categories
  themeMode?: 'light' | 'dark' | 'system'; // default "light"
  accentColor?: 'blue' | 'emerald' | 'yellow' | 'rose' | 'violet' | 'silver' | 'purple' | 'pink' | 'neon_green' | 'sky_blue'; // default "blue"
  emergencyAllocated?: number; // persistent allocated reserve for emergency fund
  netWorthSettings?: {
    categories: NetWorthCategoryConfig[];
  };
}

export interface FinanceData {
  accounts: FinancialAccount[];
  savingGoals: SavingGoal[];
  incomes: Income[];
  expenses: Expense[];
  recurringSpends: RecurringSpend[];
  budgets: CategoryBudget[];
  preferences: Preferences;
  investments?: Investment[]; // optional for backward compatibility, will initiate standard defaults if undefined
  emis?: EmiItem[]; // Equated Monthly Installments registry
  ccEmis?: CreditCardEmiMaster[]; // Credit Card EMI management registry
  ccTransactions?: CcTransaction[]; // Credit Card transaction tracking registry
}
