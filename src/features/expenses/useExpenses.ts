/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useFinance } from '../../context/FinanceContext';
import { Expense } from '../../types';
import { expensesService } from '../../services/expenses.service';

export function useExpenses() {
  const { financeData, setFinanceData } = useFinance();

  const expenses = expensesService.getExpenses(financeData);

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const { updatedData, newExpense } = expensesService.addExpense(financeData, expense);
    setFinanceData(updatedData);
    return newExpense;
  };

  const deleteExpense = (id: string) => {
    setFinanceData((prev) => expensesService.deleteExpense(prev, id));
  };

  return {
    expenses,
    addExpense,
    deleteExpense,
  };
}
