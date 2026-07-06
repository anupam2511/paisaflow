/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FinanceData, Investment } from '../types';

export const investmentsService = {
  getInvestments(financeData: FinanceData): Investment[] {
    return financeData.investments || [];
  },

  addInvestment(financeData: FinanceData, investment: Omit<Investment, 'id'>): { updatedData: FinanceData; newInvestment: Investment } {
    const newId = `inv_${Date.now()}`;
    const newInvestment: Investment = {
      ...investment,
      id: newId,
    };

    return {
      updatedData: {
        ...financeData,
        investments: [...(financeData.investments || []), newInvestment],
      },
      newInvestment,
    };
  },

  deleteInvestment(financeData: FinanceData, id: string): FinanceData {
    return {
      ...financeData,
      investments: (financeData.investments || []).filter((i) => i.id !== id),
    };
  },

  updateInvestment(financeData: FinanceData, id: string, updatedFields: Partial<Investment>): FinanceData {
    return {
      ...financeData,
      investments: (financeData.investments || []).map((i) => (i.id === id ? { ...i, ...updatedFields } : i)),
    };
  },
};
