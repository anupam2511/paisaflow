/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useFinance } from '../../context/FinanceContext';
import { Expense } from '../../types';

export function useExpenses() {
  const { financeData, setFinanceData } = useFinance();

  const expenses = financeData.expenses || [];

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newId = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newExpense: Expense = {
      ...expense,
      id: newId,
    };

    setFinanceData((prev) => ({
      ...prev,
      expenses: [...prev.expenses, newExpense],
    }));
    return newExpense;
  };

  const deleteExpense = (id: string) => {
    setFinanceData((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== id),
    }));
  };

  return {
    expenses,
    addExpense,
    deleteExpense,
  };
}
