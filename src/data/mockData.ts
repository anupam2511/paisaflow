/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FinanceData } from '../types';

export const INITIAL_FINANCE_DATA: FinanceData = {
  accounts: [
    {
      id: 'acc-1',
      name: 'HDFC Savings Account',
      type: 'bank',
      institution: 'HDFC Bank',
      balance: 145000,
      color: '#004481', // hdfc blue
    },
    {
      id: 'acc-2',
      name: 'SBI Salary Account',
      type: 'bank',
      institution: 'State Bank of India',
      balance: 85200,
      color: '#00bfff', // sbi teal-blue
    },
    {
      id: 'cc-1',
      name: 'ICICI Amazon Pay Card',
      type: 'credit_card',
      institution: 'ICICI Bank',
      balance: 12400, // outstanding
      color: '#ff9900', // amazon orange
      limit: 150000,
      billingCycleStartDay: 15,
    },
    {
      id: 'cc-2',
      name: 'HDFC Regalia Credit Card',
      type: 'credit_card',
      institution: 'HDFC Bank',
      balance: 8500, // outstanding
      color: '#1a1a1a', // premium dark gray
      limit: 500000,
      billingCycleStartDay: 5,
    },
  ],
  savingGoals: [
    {
      id: 'goal-1',
      name: 'Emergency Fund',
      targetAmount: 150000,
      currentAmount: 90000,
      targetDate: '2026-12-31',
      category: 'Security',
    },
    {
      id: 'goal-2',
      name: 'New Laptop',
      targetAmount: 85000,
      currentAmount: 45000,
      targetDate: '2026-09-15',
      category: 'Electronics',
    },
    {
      id: 'goal-3',
      name: 'Europe Summer Trip',
      targetAmount: 300000,
      currentAmount: 60000,
      targetDate: '2027-06-01',
      category: 'Travel',
    },
  ],
  incomes: [
    {
      id: 'inc-1',
      source: 'Primary Monthly Salary',
      amount: 95000,
      frequency: 'monthly',
      date: '2026-06-01',
    },
    {
      id: 'inc-2',
      source: 'Freelance UI/UX Design',
      amount: 22000,
      frequency: 'one-time',
      date: '2026-06-08',
    },
    {
      id: 'inc-3',
      source: 'Stock Dividend Yield',
      amount: 4500,
      frequency: 'monthly',
      date: '2026-06-10',
    },
  ],
  recurringSpends: [
    {
      id: 'rec-1',
      name: 'Netflix Premium 4K',
      amount: 649,
      category: 'Entertainment',
      accountId: 'cc-1',
      billingCycle: 'monthly',
      billingDay: 25,
      nextBillingDate: '2026-06-25',
      isActive: true,
    },
    {
      id: 'rec-2',
      name: 'Spotify Premium Family',
      amount: 179,
      category: 'Entertainment',
      accountId: 'cc-1',
      billingCycle: 'monthly',
      billingDay: 20,
      nextBillingDate: '2026-06-20',
      isActive: true,
    },
    {
      id: 'rec-3',
      name: 'Anytime Fitness Gym Club',
      amount: 3200,
      category: 'Miscellaneous',
      accountId: 'acc-1',
      billingCycle: 'monthly',
      billingDay: 18,
      nextBillingDate: '2026-06-18',
      isActive: true,
    },
    {
      id: 'rec-4',
      name: 'Google One Cloud Storage',
      amount: 210,
      category: 'Rent & Utilities',
      accountId: 'cc-2',
      billingCycle: 'monthly',
      billingDay: 28,
      nextBillingDate: '2026-06-28',
      isActive: true,
    },
  ],
  budgets: [
    { category: 'Rent & Utilities', limit: 25000 },
    { category: 'Food & Dining', limit: 12000 },
    { category: 'Groceries', limit: 8000 },
    { category: 'Shopping', limit: 10000 },
    { category: 'Travel & Transport', limit: 7000 },
    { category: 'Entertainment', limit: 6000 },
    { category: 'Miscellaneous', limit: 10000 },
  ],
  expenses: [
    {
      id: 'exp-1',
      description: 'Monthly Apartment Rent',
      amount: 18000,
      category: 'Rent & Utilities',
      date: '2026-06-01',
      accountId: 'acc-1',
      isRecurring: true,
    },
    {
      id: 'exp-2',
      description: 'Fine Dining Weekend Dinner',
      amount: 4200, // Large expense (exceeds ₹4k)
      category: 'Food & Dining',
      date: '2026-06-05',
      accountId: 'cc-2',
      isRecurring: false,
    },
    {
      id: 'exp-3',
      description: 'Weekly Supermarket Run',
      amount: 3200,
      category: 'Groceries',
      date: '2026-06-03',
      accountId: 'acc-2',
      isRecurring: false,
    },
    {
      id: 'exp-4',
      description: 'Fuel Refill & Car Wash',
      amount: 2800,
      category: 'Travel & Transport',
      date: '2026-06-04',
      accountId: 'cc-1',
      isRecurring: false,
    },
    {
      id: 'exp-5',
      description: 'Nike Running Sneakers',
      amount: 6800, // Large expense (exceeds ₹4k)
      category: 'Shopping',
      date: '2026-06-07',
      accountId: 'cc-1',
      isRecurring: false,
    },
    {
      id: 'exp-6',
      description: 'Electricity Bill Payment',
      amount: 3850,
      category: 'Rent & Utilities',
      date: '2026-06-02',
      accountId: 'acc-1',
      isRecurring: false,
    },
    {
      id: 'exp-7',
      description: 'Cinema Ticket & Caramel Popcorn',
      amount: 950,
      category: 'Entertainment',
      date: '2026-06-06',
      accountId: 'cc-2',
      isRecurring: false,
    },
    {
      id: 'exp-8',
      description: 'Organic Fruit and Vegetable Delivery',
      amount: 1850,
      category: 'Groceries',
      date: '2026-06-09',
      accountId: 'cc-1',
      isRecurring: false,
    },
    {
      id: 'exp-9',
      description: 'Premium Leather Work Jacket',
      amount: 8900, // Large expense (exceeds ₹4k)
      category: 'Shopping',
      date: '2026-06-10',
      accountId: 'cc-2',
      isRecurring: false,
    },
  ],
  preferences: {
    currencySymbol: '₹',
    largeExpenseThreshold: 4000,
    investmentCategories: ['Mutual Funds', 'Government Schemes', 'Gold Investment', 'Fixed Deposits', 'Stocks & Equities', 'Alternative Assets'],
    themeMode: 'light',
    accentColor: 'blue',
  },
  investments: [
    {
      id: 'inv-1',
      name: 'Nippon India Small Cap Fund',
      type: 'mutual_fund',
      investmentType: 'recurring',
      amount: 5000,
      frequency: 'monthly',
      hasEndDate: false,
      startDate: '2024-01-15',
      totalInvested: 90000,
      accountId: 'acc-1',
      notes: 'Monthly SIP'
    },
    {
      id: 'inv-2',
      name: 'Physical Gold Bars',
      type: 'gold',
      investmentType: 'spot',
      amount: 45000,
      hasEndDate: false,
      startDate: '2025-05-10',
      totalInvested: 45000,
      accountId: 'acc-2',
      notes: 'Purchased on Akshaya Tritiya'
    },
    {
      id: 'inv-3',
      name: 'Public Provident Fund (PPF)',
      type: 'govt_scheme',
      investmentType: 'recurring',
      amount: 12500,
      frequency: 'monthly',
      hasEndDate: true,
      endDate: '2039-03',
      startDate: '2024-04-01',
      totalInvested: 300000,
      accountId: 'acc-2',
      notes: 'Tax-exempt long-term retirement fund'
    }
  ],
  emis: [
    {
      id: 'emi-1',
      name: 'iPhone 15 Pro Max purchase',
      amount: 5400,
      category: 'Shopping',
      accountId: 'cc-1', // ICICI Amazon Pay
      totalTenure: 12,
      installmentsPaid: 5,
      startDate: '2026-01',
      interestRate: 0, // No-cost EMI
      isActive: true,
      notes: 'No-cost credit card EMI offer'
    },
    {
      id: 'emi-2',
      name: 'SBI Housing Home Loan',
      amount: 28500,
      category: 'Rent & Utilities',
      accountId: 'acc-2', // SBI Savings Account
      totalTenure: 180,
      installmentsPaid: 24,
      startDate: '2024-06',
      interestRate: 8.4,
      isActive: true,
      notes: 'Co-applicant home loan'
    },
    {
      id: 'emi-3',
      name: 'OnePlus QLED Smart TV',
      amount: 3200,
      category: 'Shopping',
      accountId: 'cc-1', // ICICI Amazon Pay
      totalTenure: 6,
      installmentsPaid: 5,
      startDate: '2026-01',
      interestRate: 14.5,
      isActive: true,
      notes: 'Final instalment due this month'
    }
  ]
};
