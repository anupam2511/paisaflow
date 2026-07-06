/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useFinance } from '../../context/FinanceContext';
import { Investment } from '../../types';
import { investmentsService } from '../../services/investments.service';

export function useInvestments() {
  const { financeData, setFinanceData } = useFinance();

  const investments = investmentsService.getInvestments(financeData);

  const addInvestment = (investment: Omit<Investment, 'id'>) => {
    const { updatedData, newInvestment } = investmentsService.addInvestment(financeData, investment);
    setFinanceData(updatedData);
    return newInvestment;
  };

  const deleteInvestment = (id: string) => {
    setFinanceData((prev) => investmentsService.deleteInvestment(prev, id));
  };

  const updateInvestment = (id: string, updatedFields: Partial<Investment>) => {
    setFinanceData((prev) => investmentsService.updateInvestment(prev, id, updatedFields));
  };

  return {
    investments,
    addInvestment,
    deleteInvestment,
    updateInvestment,
  };
}
