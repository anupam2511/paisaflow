/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FinanceData, SavingGoal } from '../types';

export const goalsService = {
  getGoals(financeData: FinanceData): SavingGoal[] {
    return financeData.savingGoals || [];
  },

  addGoal(financeData: FinanceData, goal: Omit<SavingGoal, 'id'>): { updatedData: FinanceData; newGoal: SavingGoal } {
    const newId = `goal_${Date.now()}`;
    const newGoal: SavingGoal = {
      ...goal,
      id: newId,
    };

    return {
      updatedData: {
        ...financeData,
        savingGoals: [...financeData.savingGoals, newGoal],
      },
      newGoal,
    };
  },

  deleteGoal(financeData: FinanceData, id: string): FinanceData {
    return {
      ...financeData,
      savingGoals: financeData.savingGoals.filter((g) => g.id !== id),
    };
  },

  updateGoal(financeData: FinanceData, id: string, updatedFields: Partial<SavingGoal>): FinanceData {
    return {
      ...financeData,
      savingGoals: financeData.savingGoals.map((g) => (g.id === id ? { ...g, ...updatedFields } : g)),
    };
  },
};
