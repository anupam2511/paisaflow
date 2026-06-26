/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useFinance } from '../../context/FinanceContext';
import { Income } from '../../types';

export function useIncome() {
  const { financeData, setFinanceData } = useFinance();

  const incomes = financeData.incomes || [];

  const addIncome = (income: Omit<Income, 'id'>) => {
    const newId = `inc_${Date.now()}`;
    const newIncome: Income = {
      ...income,
      id: newId,
    };

    setFinanceData((prev) => ({
      ...prev,
      incomes: [...prev.incomes, newIncome],
    }));
    return newIncome;
  };

  const deleteIncome = (id: string) => {
    setFinanceData((prev) => ({
      ...prev,
      incomes: prev.incomes.filter((i) => i.id !== id),
    }));
  };

  return {
    incomes,
    addIncome,
    deleteIncome,
  };
}
