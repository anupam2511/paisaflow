/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavingGoal } from '../../types';

/**
 * Calculates remaining days until target completion date
 */
export function getDaysRemaining(targetDateStr: string): number {
  if (!targetDateStr) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(targetDateStr);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Calculates remaining months until target completion date
 */
export function getMonthsRemaining(targetDateStr: string): number {
  const days = getDaysRemaining(targetDateStr);
  return Math.max(1, Math.ceil(days / 30.437)); // average days per month
}

export interface GoalProgressMetrics {
  targetAmount: number;
  savedAmount: number;
  remainingToSave: number;
  progressPercent: number;
  monthsRemaining: number;
  monthlyContributionRequired: number;
  isCompleted: boolean;
}

/**
 * Evaluates goal completeness, progress percentages, and ongoing contribution paths
 */
export function calculateGoalProgress(goal: SavingGoal): GoalProgressMetrics {
  const monthsRemaining = getMonthsRemaining(goal.targetDate);
  const savedAmount = goal.currentAmount || 0;

  let targetAmount = goal.targetAmount || 0;

  if (goal.goalType === 'fixed') {
    const totInst = goal.totalInstallments || 0;
    const instAmt = goal.installmentAmount || 0;
    targetAmount = instAmt * totInst;
  }

  const remainingToSave = Math.max(0, targetAmount - savedAmount);
  const progressPercent = targetAmount > 0
    ? Math.round((savedAmount / targetAmount) * 100)
    : 0;

  const monthlyContributionRequired = monthsRemaining > 0
    ? Math.ceil(remainingToSave / monthsRemaining)
    : 0;

  return {
    targetAmount,
    savedAmount,
    remainingToSave,
    progressPercent,
    monthsRemaining,
    monthlyContributionRequired,
    isCompleted: savedAmount >= targetAmount,
  };
}

/**
 * Calculates the exact duration (in months) required to reach a savings goal
 * given a steady monthly installment, with optional interest/compounding.
 */
export function calculateDurationToGoal(params: {
  currentAmount: number;
  targetAmount: number;
  monthlyContribution: number;
  annualReturnRate?: number; // optional, e.g. 10 representing 10% mutual fund return rate
}): {
  monthsRequired: number;
  yearsRequired: number;
} {
  const { currentAmount, targetAmount, monthlyContribution, annualReturnRate = 0 } = params;

  if (targetAmount <= currentAmount) {
    return { monthsRequired: 0, yearsRequired: 0 };
  }

  if (monthlyContribution <= 0) {
    return { monthsRequired: Infinity, yearsRequired: Infinity };
  }

  // Linear progression if return rate is 0
  if (annualReturnRate <= 0) {
    const monthsRequired = Math.ceil((targetAmount - currentAmount) / monthlyContribution);
    return {
      monthsRequired,
      yearsRequired: Math.round((monthsRequired / 12) * 10) / 10,
    };
  }

  // Compounded formula solver
  // FV = PV*(1+r)^n + PMT * (((1+r)^n - 1) / r) * (1+r)
  // Let's do a fast discrete monthly solver which is highly accurate and handles intermediate caps
  let monthsRequired = 0;
  let currentVal = currentAmount;
  const monthlyRate = (annualReturnRate / 12) / 100;

  while (currentVal < targetAmount && monthsRequired < 1200) { // cap at 100 years
    monthsRequired++;
    currentVal = (currentVal + monthlyContribution) * (1 + monthlyRate);
  }

  return {
    monthsRequired,
    yearsRequired: Math.round((monthsRequired / 12) * 10) / 10,
  };
}
