/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useFinance } from '../../context/FinanceContext';
import { SavingGoal } from '../../types';
import { goalsService } from '../../services/goals.service';

export function useGoals() {
  const { financeData, setFinanceData } = useFinance();

  const savingGoals = goalsService.getGoals(financeData);

  const addGoal = (goal: Omit<SavingGoal, 'id'>) => {
    const { updatedData, newGoal } = goalsService.addGoal(financeData, goal);
    setFinanceData(updatedData);
    return newGoal;
  };

  const deleteGoal = (id: string) => {
    setFinanceData((prev) => goalsService.deleteGoal(prev, id));
  };

  const updateGoal = (id: string, updatedFields: Partial<SavingGoal>) => {
    setFinanceData((prev) => goalsService.updateGoal(prev, id, updatedFields));
  };

  return {
    savingGoals,
    addGoal,
    deleteGoal,
    updateGoal,
  };
}
