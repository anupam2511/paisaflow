/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FinancialAccount, Expense, RecurringSpend, EmiItem } from '../../types';

export interface EmergencyFundAnalysis {
  baseMonthlyExpenses: number;
  baseSubscriptions: number;
  baseEmis: number;
  monthlyOutflowEssentials: number;
  totalInCheckingSavings: number;
  targetBuffer: number;
  progressPercent: number;
  remainingDeficit: number;
  monthsCoveredEstimate: number;
  safetyStatus: 'critical' | 'vulnerable' | 'healthy';
}

/**
 * Calculates the baseline monthly essentials outflow
 */
export function calculateMonthlyOutflowEssentials(
  expenses: Expense[],
  recurringSpends: RecurringSpend[],
  emis: EmiItem[]
): {
  baseMonthlyExpenses: number;
  baseSubscriptions: number;
  baseEmis: number;
  monthlyOutflowEssentials: number;
} {
  const baseMonthlyExpenses = (expenses || []).reduce((sum, e) => sum + e.amount, 0) / Math.max(1, (expenses || []).length > 0 ? 3 : 1);
  const baseSubscriptions = (recurringSpends || [])
    .filter((s) => s.isActive)
    .reduce((sum, s) => sum + s.amount, 0);
  const baseEmis = (emis || []).filter((e) => e.isActive).reduce((sum, e) => sum + e.amount, 0);

  const monthlyOutflowEssentials = (baseMonthlyExpenses > 0 ? baseMonthlyExpenses : 25000) + baseSubscriptions + baseEmis;

  return {
    baseMonthlyExpenses,
    baseSubscriptions,
    baseEmis,
    monthlyOutflowEssentials,
  };
}

/**
 * Analyzes emergency fund safety and coverage metrics
 */
export function analyzeEmergencyFund(params: {
  accounts: FinancialAccount[];
  expenses: Expense[];
  recurringSpends: RecurringSpend[];
  emis: EmiItem[];
  coverageMultiplier: number; // e.g. 6
  customAuxiliary: number; // e.g. 30000
}): EmergencyFundAnalysis {
  const { accounts, expenses, recurringSpends, emis, coverageMultiplier, customAuxiliary } = params;

  const { baseMonthlyExpenses, baseSubscriptions, baseEmis, monthlyOutflowEssentials } =
    calculateMonthlyOutflowEssentials(expenses, recurringSpends, emis);

  const bankAccounts = (accounts || []).filter((a) => a.type === 'bank');
  const totalInCheckingSavings = bankAccounts.reduce((sum, a) => sum + a.balance, 0);

  const targetBuffer = Math.round(monthlyOutflowEssentials * coverageMultiplier + customAuxiliary);
  const progressPercent = Math.min(100, Math.round((totalInCheckingSavings / targetBuffer) * 100));
  const remainingDeficit = Math.max(0, targetBuffer - totalInCheckingSavings);

  const monthsCoveredEstimate = monthlyOutflowEssentials > 0
    ? Math.round((totalInCheckingSavings / monthlyOutflowEssentials) * 10) / 10
    : 0;

  let safetyStatus: 'critical' | 'vulnerable' | 'healthy' = 'healthy';
  if (monthsCoveredEstimate < 3) {
    safetyStatus = 'critical';
  } else if (monthsCoveredEstimate < 6) {
    safetyStatus = 'vulnerable';
  }

  return {
    baseMonthlyExpenses,
    baseSubscriptions,
    baseEmis,
    monthlyOutflowEssentials,
    totalInCheckingSavings,
    targetBuffer,
    progressPercent,
    remainingDeficit,
    monthsCoveredEstimate,
    safetyStatus,
  };
}
