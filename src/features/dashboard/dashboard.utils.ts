/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FinanceData, NetWorthCategoryConfig, Preferences } from '../../types';
import { formatCurrency } from '../../utils/formatters';

export const standardInvestmentCategories = [
  'Mutual Funds',
  'Government Schemes',
  'Gold Investment',
  'Fixed Deposits',
  'Stocks & Equities',
  'Alternative Assets'
];

export const defaultNetWorthCategories: NetWorthCategoryConfig[] = [
  { key: 'bank_accounts', label: 'Bank accounts', isManual: false, manualValue: 0 },
  { key: 'cash', label: 'Cash', isManual: true, manualValue: 15000 },
  { key: 'mutual_funds', label: 'Mutual funds', isManual: false, manualValue: 0 },
  { key: 'stocks', label: 'Stocks', isManual: false, manualValue: 0 },
  { key: 'ppf', label: 'PPF', isManual: false, manualValue: 0 },
  { key: 'nps', label: 'NPS', isManual: true, manualValue: 50000 },
  { key: 'gold', label: 'Gold', isManual: false, manualValue: 0 },
  { key: 'epf', label: 'EPF', isManual: true, manualValue: 180000 },
  { key: 'ssy', label: 'SSY', isManual: true, manualValue: 0 },
  { key: 'fixed_deposits', label: 'Fixed deposits', isManual: true, manualValue: 100000 },
  { key: 'credit_cards', label: 'Credit card outstanding', isManual: false, manualValue: 0 },
  { key: 'emis', label: 'EMIs', isManual: false, manualValue: 0 },
  { key: 'loans', label: 'Loans', isManual: false, manualValue: 0 }
];

export const getFriendlyTypeLabel = (val: string): string => {
  switch (val) {
    case 'mutual_fund': return 'Mutual Funds';
    case 'govt_scheme': return 'Government Schemes';
    case 'gold': return 'Gold Investment';
    case 'fixed_deposit': return 'Fixed Deposits';
    case 'stocks': return 'Stocks & Equities';
    case 'other': return 'Alternative Assets';
    default: return val;
  }
};

export const getCategoryColor = (categoryName: string, index: number): string => {
  const normalized = categoryName.trim().toLowerCase();
  
  const staticMap: { [key: string]: string } = {
    'miscellaneous': '#6b7280',
    'other': '#6b7280',
    'misc': '#6b7280',
    'shopping': '#ec4899',
    'electronics': '#0284c7',
    'electronics & gadgets': '#0284c7',
    'food': '#f97316',
    'dining': '#f97316',
    'food & dining': '#f97316',
    'grocery': '#10b981',
    'groceries': '#10b981',
    'house rent': '#2563eb',
    'rent': '#2563eb',
    'rent & utilities': '#2563eb',
    'utilities': '#06b6d4',
    'bills & utilities': '#06b6d4',
    'travel': '#8b5cf6',
    'transport': '#8b5cf6',
    'travel & transport': '#8b5cf6',
    'entertainment': '#d946ef',
    'leisure': '#d946ef',
    'gold investment': '#eab308',
    'other investment': '#a855f7',
    'investments': '#a855f7',
    'investment': '#a855f7',
    'healthcare': '#ef4444',
    'medical': '#ef4444',
    'education': '#6366f1',
    'savings': '#84cc16',
  };

  if (staticMap[normalized]) {
    return staticMap[normalized];
  }

  const fallbackColors = [
    '#f43f5e',
    '#a855f7',
    '#059669',
    '#b45309',
    '#0ea5e9',
    '#be185d',
    '#0369a1',
    '#4d7c0f',
    '#7c3aed',
    '#c026d3',
  ];

  return fallbackColors[index % fallbackColors.length];
};

export const handleExportJSON = (data: FinanceData) => {
  try {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    const dateString = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `paisaflow_backup_${dateString}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  } catch (err) {
    console.error('Failed to export JSON payload.', err);
  }
};

export const handleExportCSV = (data: FinanceData) => {
  try {
    const expensesList = data.expenses || [];
    if (expensesList.length === 0) {
      return;
    }
    const headers = ['ID', 'Date', 'Amount', 'Category', 'Description', 'Linked Account ID'];
    const rows = expensesList.map(exp => [
      exp.id || '',
      exp.date || '',
      exp.amount || 0,
      `"${(exp.category || '').replace(/"/g, '""')}"`,
      `"${(exp.description || '').replace(/"/g, '""')}"`,
      exp.accountId || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const downloadAnchor = document.createElement('a');
    const dateString = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', `paisaflow_expenses_${dateString}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to export CSV payload.', err);
  }
};
