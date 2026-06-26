/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useFinance } from '../../context/FinanceContext';
import { CategoryBudget } from '../../types';

export function useBudgets() {
  const { financeData, setFinanceData } = useFinance();

  const budgets = financeData.budgets || [];

  const addBudget = (budget: CategoryBudget) => {
    setFinanceData((prev) => {
      const exists = prev.budgets.some((b) => b.category === budget.category);
      if (exists) {
        return {
          ...prev,
          budgets: prev.budgets.map((b) => (b.category === budget.category ? budget : b)),
        };
      }
      return {
        ...prev,
        budgets: [...prev.budgets, budget],
      };
    });
  };

  const deleteBudget = (category: string) => {
    setFinanceData((prev) => ({
      ...prev,
      budgets: prev.budgets.filter((b) => b.category !== category),
    }));
  };

  return {
    budgets,
    addBudget,
    deleteBudget,
  };
}
