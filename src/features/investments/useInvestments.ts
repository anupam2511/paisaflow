/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useFinance } from '../../context/FinanceContext';
import { Investment } from '../../types';

export function useInvestments() {
  const { financeData, setFinanceData } = useFinance();

  const investments = financeData.investments || [];

  const addInvestment = (investment: Omit<Investment, 'id'>) => {
    const newId = `inv_${Date.now()}`;
    const newInvestment: Investment = {
      ...investment,
      id: newId,
    };

    setFinanceData((prev) => ({
      ...prev,
      investments: [...(prev.investments || []), newInvestment],
    }));
    return newInvestment;
  };

  const deleteInvestment = (id: string) => {
    setFinanceData((prev) => ({
      ...prev,
      investments: (prev.investments || []).filter((i) => i.id !== id),
    }));
  };

  const updateInvestment = (id: string, updatedFields: Partial<Investment>) => {
    setFinanceData((prev) => ({
      ...prev,
      investments: (prev.investments || []).map((i) => (i.id === id ? { ...i, ...updatedFields } : i)),
    }));
  };

  return {
    investments,
    addInvestment,
    deleteInvestment,
    updateInvestment,
  };
}
