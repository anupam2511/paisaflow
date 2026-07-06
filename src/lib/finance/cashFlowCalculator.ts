/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Income, Expense, RecurringSpend, EmiItem, Investment } from '../../types';

/**
 * Calculates total monthly cash inflows from regular/monthly incomes.
 */
export function calculateTotalMonthlyIncome(incomes: Income[]): number {
  return (incomes || [])
    .filter((inc) => inc.frequency === 'monthly')
    .reduce((sum, inc) => sum + inc.amount, 0);
}

/**
 * Calculates total historical expenses recorded in the ledger.
 */
export function calculateTotalExpenses(expenses: Expense[]): number {
  return (expenses || []).reduce((sum, exp) => sum + exp.amount, 0);
}

/**
 * Calculates total monthly subscription charges/recurring expenditures.
 */
export function calculateTotalRecurringSpends(recurringSpends: RecurringSpend[]): number {
  return (recurringSpends || [])
    .filter((sub) => sub.isActive)
    .reduce((sum, sub) => sum + sub.amount, 0);
}

/**
 * Helper to scale investment amount to monthly equivalent
 */
export function getMonthlyInvestmentAmount(inv: Investment): number {
  if (inv.investmentType === 'spot') return 0;
  
  const amt = inv.amount || 0;
  if (inv.frequency === 'monthly') return amt;
  if (inv.frequency === 'quarterly') return amt / 3;
  if (inv.frequency === 'yearly') return amt / 12;
  return amt;
}

/**
 * Calculates total monthly commitments towards investment savings (SIPs, etc.)
 */
export function calculateTotalMonthlyInvestments(investments: Investment[]): number {
  return (investments || []).reduce((sum, inv) => sum + getMonthlyInvestmentAmount(inv), 0);
}

export interface CashFlowSummary {
  totalInflow: number;
  totalOutflow: number;
  netSurplus: number;
  savingsRate: number; // as a percentage, e.g. 25 representing 25%
}

/**
 * Evaluates the net monthly cash flow and savings rates based on structural obligations
 */
export function calculateMonthlyCashFlowSummary(params: {
  incomes: Income[];
  recurringSpends: RecurringSpend[];
  emis: EmiItem[];
  investments: Investment[];
  averageVariableExpenses?: number; // optional average of variable expenses (default 0)
}): CashFlowSummary {
  const { incomes, recurringSpends, emis, investments, averageVariableExpenses = 0 } = params;

  const totalInflow = calculateTotalMonthlyIncome(incomes);
  
  const subscriptionCost = calculateTotalRecurringSpends(recurringSpends);
  const loanEmiCost = (emis || [])
    .filter((e) => e.isActive)
    .reduce((sum, e) => sum + e.amount, 0);
  const sipCost = calculateTotalMonthlyInvestments(investments);

  const totalOutflow = subscriptionCost + loanEmiCost + sipCost + averageVariableExpenses;
  const netSurplus = totalInflow - totalOutflow;
  const savingsRate = totalInflow > 0 ? (netSurplus / totalInflow) * 100 : 0;

  return {
    totalInflow,
    totalOutflow,
    netSurplus,
    savingsRate,
  };
}
