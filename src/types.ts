/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
}

export interface SavingGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  category: string;
  goalType?: 'flexible' | 'fixed' | 'investment';
  installmentAmount?: number;
  totalInstallments?: number;
  paidInstallments?: number;
  startDate?: string; // YYYY-MM-DD
}

export interface Income {
  id: string;
  source: string;     // e.g., "Software Engineer Salary", "Freelance Web Design"
  amount: number;
  frequency: 'monthly' | 'one-time';
  date: string;       // YYYY-MM-DD
}

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

export interface CategoryBudget {
  category: string;
  limit: number;
}

export interface EmiItem {
  id: string;
  name: string;             // e.g. "iPhone 15 Pro Max", "Home Loan Premium"
  amount: number;           // Monthly payment amount (e.g. ₹5,400)
  category: string;         // Spend Category (e.g. "Shopping", "Rent & Utilities")
  accountId: string;        // Connected Card or Bank Account ID
  totalTenure: number;      // Total number of months/installments (e.g. 12, 24, 120)
  installmentsPaid: number; // Number of payments already completed
  startDate: string;        // YYYY-MM-DD or YYYY-MM
  interestRate?: number;    // Interest Rate as a percentage (e.g. 12.5)
  isActive: boolean;
  notes?: string;
}

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

export interface Preferences {
  currencySymbol: string;     // default "₹"
  largeExpenseThreshold: number; // default 4000
  investmentCategories?: string[]; // user-defined investment holding categories
  themeMode?: 'light' | 'dark' | 'system'; // default "light"
  accentColor?: 'blue' | 'emerald' | 'yellow' | 'rose' | 'violet'; // default "blue"
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
}
