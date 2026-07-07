/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import { FinanceData, FinancialInsight } from './insight.types';
import { formatCurrency } from '../../utils/formatters';

export interface InsightRule {
  id: string;
  name: string;
  evaluate: (data: FinanceData) => FinancialInsight[];
}

/**
 * Helper to compute monthly financial totals
 */
export function calculateMonthlyTotals(data: FinanceData) {
  const {
    incomes = [],
    expenses = [],
    recurringSpends = [],
    emis = [],
    ccEmis = []
  } = data;

  // Find the active month prefix (e.g. "2026-07"). Falls back to latest expense if current calendar month has no data.
  const today = new Date();
  const currentMonthPrefix = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
  const hasCurrentMonthData = expenses.some(e => e.date.startsWith(currentMonthPrefix));
  const activeMonthPrefix = hasCurrentMonthData 
    ? currentMonthPrefix 
    : (() => {
        const dates = expenses.map(e => e.date).filter(Boolean).sort();
        return dates.length > 0 ? dates[dates.length - 1].slice(0, 7) : currentMonthPrefix;
      })();

  const totalIncome = incomes
    .filter(inc => !inc.date || inc.date.startsWith(activeMonthPrefix))
    .reduce((sum, inc) => sum + inc.amount, 0);

  const totalExpenses = expenses
    .filter(exp => exp.date.startsWith(activeMonthPrefix))
    .reduce((sum, exp) => sum + exp.amount, 0);

  const totalRecurring = recurringSpends
    .filter(rec => rec.isActive)
    .reduce((sum, rec) => sum + rec.amount, 0);

  const activeEmis = emis.filter(e => e.isActive);
  const activeCcEmis = ccEmis.filter(e => e.status === 'active');

  const standardEmiMonthlyBurden = activeEmis.reduce((sum, e) => sum + e.amount, 0);
  const ccEmiMonthlyBurden = activeCcEmis.reduce((sum, e) => {
    const nextUnpaid = e.installments.find(inst => inst.paidStatus === 'unpaid');
    return sum + (nextUnpaid ? nextUnpaid.totalInstallmentAmount : 0);
  }, 0);

  const totalEmiMonthlyBurden = standardEmiMonthlyBurden + ccEmiMonthlyBurden;
  const totalOutflow = totalExpenses + totalRecurring + totalEmiMonthlyBurden;

  return {
    totalIncome,
    totalExpenses,
    totalRecurring,
    totalEmiMonthlyBurden,
    totalOutflow
  };
}

/**
 * 1. Credit Utilization Rules (> 30% and > 75%)
 */
export const creditUtilizationRule: InsightRule = {
  id: 'credit-utilization',
  name: 'Credit Card Utilization Warnings',
  evaluate: (data: FinanceData): FinancialInsight[] => {
    const insights: FinancialInsight[] = [];
    const { accounts = [], preferences } = data;

    accounts
      .filter(acc => acc.type === 'credit_card')
      .forEach(card => {
        const limit = card.limit || 0;
        const balance = card.balance || 0; // Current balance / utilized limit
        if (limit > 0) {
          const utilPct = (balance / limit) * 100;
          
          if (utilPct > 30) {
            // Target is to reduce utilization to exactly 30%
            const targetUtilizationAmount = 0.30 * limit;
            const amountToPay = Math.max(0, balance - targetUtilizationAmount);

            if (utilPct > 75) {
              insights.push({
                id: `credit-util-high-${card.id}`,
                type: 'critical',
                category: 'credit',
                title: 'High Credit Utilization Alert',
                description: `Your ${card.institution || ''} ${card.name} credit utilisation is ${utilPct.toFixed(0)}%.`,
                impact: `Paying ${formatCurrency(amountToPay, preferences)} before the statement date could reduce your reported utilisation to 30%, protecting your credit rating.`,
                actionLabel: `Repay ${card.name}`,
                actionTab: 'credit_cards',
                metadata: {
                  cardId: card.id,
                  cardName: card.name,
                  amountToPay,
                  utilizationPercent: utilPct
                }
              });
            } else {
              insights.push({
                id: `credit-util-warning-${card.id}`,
                type: 'warning',
                category: 'credit',
                title: 'Credit Utilisation Warning',
                description: `Your ${card.institution || ''} ${card.name} credit utilisation is ${utilPct.toFixed(0)}%.`,
                impact: `Paying ${formatCurrency(amountToPay, preferences)} before the statement date could reduce your reported utilisation to 30%.`,
                actionLabel: `Pay Off Balance`,
                actionTab: 'credit_cards',
                metadata: {
                  cardId: card.id,
                  cardName: card.name,
                  amountToPay,
                  utilizationPercent: utilPct
                }
              });
            }
          }
        }
      });

    return insights;
  }
};

/**
 * 2. Emergency Fund Rule (< 3 months)
 */
export const emergencyFundRule: InsightRule = {
  id: 'emergency-fund',
  name: 'Emergency Fund Runway Coverage',
  evaluate: (data: FinanceData): FinancialInsight[] => {
    const { accounts = [], preferences } = data;
    const totals = calculateMonthlyTotals(data);
    const totalBankCash = accounts
      .filter(acc => acc.type === 'bank')
      .reduce((sum, acc) => sum + acc.balance, 0);

    const monthlyOutflow = totals.totalOutflow;
    if (monthlyOutflow <= 0) return [];

    const monthsCovered = totalBankCash / monthlyOutflow;
    const targetFund = monthlyOutflow * 3;

    if (monthsCovered < 3) {
      const type = monthsCovered < 1 ? 'critical' : 'warning';
      const deficit = Math.max(0, targetFund - totalBankCash);

      return [{
        id: 'emergency-fund-gap',
        type,
        category: 'emergency',
        title: 'Emergency Fund Gap',
        description: `Your emergency fund covers only ${monthsCovered.toFixed(1)} months of expenses.`,
        impact: `Aim to build a 3-month cash reserve of ${formatCurrency(targetFund, preferences)}. You need an additional ${formatCurrency(deficit, preferences)} to bridge this gap.`,
        actionLabel: 'Saves Buffer Reserve',
        actionTab: 'emergency',
        metadata: {
          currentMonths: monthsCovered,
          deficitAmount: deficit
        }
      }];
    }

    return [];
  }
};

/**
 * 3. EMI Stress Rule (EMI burden > 40% of income)
 */
export const emiStressRule: InsightRule = {
  id: 'emi-stress',
  name: 'EMI Burden Stress Warning',
  evaluate: (data: FinanceData): FinancialInsight[] => {
    const { preferences } = data;
    const totals = calculateMonthlyTotals(data);
    const income = totals.totalIncome;
    const emiBurden = totals.totalEmiMonthlyBurden;

    if (income > 0) {
      const emiRatio = (emiBurden / income) * 100;
      if (emiRatio > 40) {
        return [{
          id: 'emi-stress-warning',
          type: emiRatio > 55 ? 'critical' : 'warning',
          category: 'debt',
          title: 'EMI Burden Stress Alert',
          description: `Your monthly EMI commitments of ${formatCurrency(emiBurden, preferences)} consume ${emiRatio.toFixed(0)}% of your monthly income.`,
          impact: 'This exceeds the recommended financial safety threshold of 40%. Restrain further high-interest credit purchases.',
          actionLabel: 'Audit Active EMIs',
          actionTab: 'emis',
          metadata: {
            emiRatio
          }
        }];
      }
    }

    return [];
  }
};

/**
 * 4. Budget Risk Rule (Budget > 90% or breached)
 */
export const budgetRiskRule: InsightRule = {
  id: 'budget-risk',
  name: 'Category Budget Risks',
  evaluate: (data: FinanceData): FinancialInsight[] => {
    const insights: FinancialInsight[] = [];
    const { budgets = [], expenses = [], recurringSpends = [], preferences } = data;

    // Find the active month prefix
    const today = new Date();
    const currentMonthPrefix = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
    const hasCurrentMonthData = expenses.some(e => e.date.startsWith(currentMonthPrefix));
    const activeMonthPrefix = hasCurrentMonthData 
      ? currentMonthPrefix 
      : (() => {
          const dates = expenses.map(e => e.date).filter(Boolean).sort();
          return dates.length > 0 ? dates[dates.length - 1].slice(0, 7) : currentMonthPrefix;
        })();

    budgets.forEach(b => {
      const spent = expenses
        .filter(e => e.category.toLowerCase() === b.category.toLowerCase() && e.date.startsWith(activeMonthPrefix))
        .reduce((sum, exp) => sum + exp.amount, 0) +
        recurringSpends
        .filter(r => r.isActive && r.category.toLowerCase() === b.category.toLowerCase())
        .reduce((sum, rec) => sum + rec.amount, 0);

      const limit = b.limit;
      if (limit > 0) {
        const spentPct = (spent / limit) * 100;

        if (spentPct > 100) {
          insights.push({
            id: `budget-overspend-${b.category}`,
            type: 'critical',
            category: 'budget',
            title: 'Budget Breached',
            description: `You have exceeded your ${b.category} budget by ${formatCurrency(spent - limit, preferences)}.`,
            impact: `Spent: ${formatCurrency(spent, preferences)} of ${formatCurrency(limit, preferences)} (${spentPct.toFixed(0)}% spent). Try pausing non-essential expenses here.`,
            actionLabel: 'Modify Budget Cap',
            actionTab: 'budgets',
            metadata: {
              budgetCategory: b.category,
              spentAmount: spent,
              limitAmount: limit
            }
          });
        } else if (spentPct > 90) {
          insights.push({
            id: `budget-risk-${b.category}`,
            type: 'warning',
            category: 'budget',
            title: 'Budget Threshold Risk',
            description: `Your ${b.category} budget is at ${spentPct.toFixed(0)}% capacity.`,
            impact: `You have only ${formatCurrency(limit - spent, preferences)} remaining of your ${formatCurrency(limit, preferences)} budget.`,
            actionLabel: 'Review Transactions',
            actionTab: 'transactions',
            metadata: {
              budgetCategory: b.category,
              spentAmount: spent,
              limitAmount: limit
            }
          });
        }
      }
    });

    return insights;
  }
};

/**
 * 5. Savings Rate Declining Rule
 */
export const savingsRateTrendRule: InsightRule = {
  id: 'savings-trend',
  name: 'Savings Rate Trend Warning',
  evaluate: (data: FinanceData): FinancialInsight[] => {
    const { incomes = [], expenses = [], preferences } = data;

    // We will dynamically extract months that have incomes or expenses, group them, and evaluate savings rate
    const monthData: { [key: string]: { income: number; outflow: number } } = {};

    incomes.forEach(inc => {
      const month = (inc.date || '').slice(0, 7); // YYYY-MM
      if (month && month.length === 7) {
        if (!monthData[month]) monthData[month] = { income: 0, outflow: 0 };
        monthData[month].income += inc.amount;
      }
    });

    expenses.forEach(exp => {
      const month = (exp.date || '').slice(0, 7); // YYYY-MM
      if (month && month.length === 7) {
        if (!monthData[month]) monthData[month] = { income: 0, outflow: 0 };
        monthData[month].outflow += exp.amount;
      }
    });

    // Sort months chronologically
    const sortedMonths = Object.keys(monthData).sort();
    if (sortedMonths.length < 2) return [];

    const latestMonth = sortedMonths[sortedMonths.length - 1];
    const prevMonth = sortedMonths[sortedMonths.length - 2];

    const latest = monthData[latestMonth];
    const prev = monthData[prevMonth];

    const latestSavings = latest.income - latest.outflow;
    const latestSavingsRate = latest.income > 0 ? (latestSavings / latest.income) * 100 : 0;

    const prevSavings = prev.income - prev.outflow;
    const prevSavingsRate = prev.income > 0 ? (prevSavings / prev.income) * 100 : 0;

    // If rate has dropped by more than 2%
    if (latestSavingsRate < prevSavingsRate - 2) {
      return [{
        id: 'savings-rate-declining',
        type: 'warning',
        category: 'savings',
        title: 'Savings Trend Warning',
        description: `Your savings rate is declining compared to the previous month.`,
        impact: `Your savings rate fell from ${prevSavingsRate.toFixed(0)}% in ${prevMonth} to ${latestSavingsRate.toFixed(0)}% in ${latestMonth}. We recommend auditing your non-essential subscription bills or dining spends.`,
        actionLabel: 'Audit Outflows',
        actionTab: 'transactions'
      }];
    }

    return [];
  }
};

export const activeRules: InsightRule[] = [
  creditUtilizationRule,
  emergencyFundRule,
  emiStressRule,
  budgetRiskRule,
  savingsRateTrendRule
];
