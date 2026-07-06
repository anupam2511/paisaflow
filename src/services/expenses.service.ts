/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FinanceData, Expense } from '../types';

export const expensesService = {
  getExpenses(financeData: FinanceData): Expense[] {
    return financeData.expenses || [];
  },

  addExpense(financeData: FinanceData, expense: Omit<Expense, 'id'>): { updatedData: FinanceData; newExpense: Expense } {
    const newId = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newExpense: Expense = {
      ...expense,
      id: newId,
    };

    return {
      updatedData: {
        ...financeData,
        expenses: [...financeData.expenses, newExpense],
      },
      newExpense,
    };
  },

  deleteExpense(financeData: FinanceData, id: string): FinanceData {
    return {
      ...financeData,
      expenses: financeData.expenses.filter((e) => e.id !== id),
    };
  },
};
