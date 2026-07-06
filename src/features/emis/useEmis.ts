/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useFinance } from '../../context/FinanceContext';
import { EmiItem, CreditCardEmiMaster } from '../../types';
import { emisService } from '../../services/emis.service';

export function useEmis() {
  const { financeData, setFinanceData } = useFinance();

  const emis = emisService.getEmis(financeData);
  const ccEmis = emisService.getCcEmis(financeData);

  const addEmi = (emi: Omit<EmiItem, 'id'>) => {
    const { updatedData, newEmi } = emisService.addEmi(financeData, emi);
    setFinanceData(updatedData);
    return newEmi;
  };

  const deleteEmi = (id: string) => {
    setFinanceData((prev) => emisService.deleteEmi(prev, id));
  };

  const addCcEmi = (ccEmi: Omit<CreditCardEmiMaster, 'id'>) => {
    const { updatedData, newCcEmi } = emisService.addCcEmi(financeData, ccEmi);
    setFinanceData(updatedData);
    return newCcEmi;
  };

  const deleteCcEmi = (id: string) => {
    setFinanceData((prev) => emisService.deleteCcEmi(prev, id));
  };

  const updateCcEmiInstallment = (
    emiId: string,
    installmentNumber: number,
    status: 'paid' | 'unpaid'
  ) => {
    setFinanceData((prev) => emisService.updateCcEmiInstallment(prev, emiId, installmentNumber, status));
  };

  return {
    emis,
    ccEmis,
    addEmi,
    deleteEmi,
    addCcEmi,
    deleteCcEmi,
    updateCcEmiInstallment,
  };
}
