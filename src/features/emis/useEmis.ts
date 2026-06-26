/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useFinance } from '../../context/FinanceContext';
import { EmiItem, CreditCardEmiMaster } from '../../types';

export function useEmis() {
  const { financeData, setFinanceData } = useFinance();

  const emis = financeData.emis || [];
  const ccEmis = financeData.ccEmis || [];

  const addEmi = (emi: Omit<EmiItem, 'id'>) => {
    const newId = `emi_${Date.now()}`;
    const newEmi: EmiItem = {
      ...emi,
      id: newId,
    };

    setFinanceData((prev) => ({
      ...prev,
      emis: [...(prev.emis || []), newEmi],
    }));
    return newEmi;
  };

  const deleteEmi = (id: string) => {
    setFinanceData((prev) => ({
      ...prev,
      emis: (prev.emis || []).filter((e) => e.id !== id),
    }));
  };

  const addCcEmi = (ccEmi: Omit<CreditCardEmiMaster, 'id'>) => {
    const newId = `cc_emi_${Date.now()}`;
    const newCcEmi: CreditCardEmiMaster = {
      ...ccEmi,
      id: newId,
    };

    setFinanceData((prev) => ({
      ...prev,
      ccEmis: [...(prev.ccEmis || []), newCcEmi],
    }));
    return newCcEmi;
  };

  const deleteCcEmi = (id: string) => {
    setFinanceData((prev) => ({
      ...prev,
      ccEmis: (prev.ccEmis || []).filter((c) => c.id !== id),
    }));
  };

  const updateCcEmiInstallment = (
    emiId: string,
    installmentNumber: number,
    status: 'paid' | 'unpaid'
  ) => {
    setFinanceData((prev) => ({
      ...prev,
      ccEmis: (prev.ccEmis || []).map((emi) => {
        if (emi.id !== emiId) return emi;
        return {
          ...emi,
          installments: emi.installments.map((inst) =>
            inst.installmentNumber === installmentNumber ? { ...inst, paidStatus: status } : inst
          ),
        };
      }),
    }));
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
