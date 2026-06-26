/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useFinance } from '../../context/FinanceContext';
import { SavingGoal } from '../../types';

export function useGoals() {
  const { financeData, setFinanceData } = useFinance();

  const savingGoals = financeData.savingGoals || [];

  const addGoal = (goal: Omit<SavingGoal, 'id'>) => {
    const newId = `goal_${Date.now()}`;
    const newGoal: SavingGoal = {
      ...goal,
      id: newId,
    };

    setFinanceData((prev) => ({
      ...prev,
      savingGoals: [...prev.savingGoals, newGoal],
    }));
    return newGoal;
  };

  const deleteGoal = (id: string) => {
    setFinanceData((prev) => ({
      ...prev,
      savingGoals: prev.savingGoals.filter((g) => g.id !== id),
    }));
  };

  const updateGoal = (id: string, updatedFields: Partial<SavingGoal>) => {
    setFinanceData((prev) => ({
      ...prev,
      savingGoals: prev.savingGoals.map((g) => (g.id === id ? { ...g, ...updatedFields } : g)),
    }));
  };

  return {
    savingGoals,
    addGoal,
    deleteGoal,
    updateGoal,
  };
}
