/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FinanceData, EmiItem, CreditCardEmiMaster } from '../types';

export const emisService = {
  getEmis(financeData: FinanceData): EmiItem[] {
    return financeData.emis || [];
  },

  getCcEmis(financeData: FinanceData): CreditCardEmiMaster[] {
    return financeData.ccEmis || [];
  },

  addEmi(financeData: FinanceData, emi: Omit<EmiItem, 'id'>): { updatedData: FinanceData; newEmi: EmiItem } {
    const newId = `emi_${Date.now()}`;
    const newEmi: EmiItem = {
      ...emi,
      id: newId,
    };

    return {
      updatedData: {
        ...financeData,
        emis: [...(financeData.emis || []), newEmi],
      },
      newEmi,
    };
  },

  deleteEmi(financeData: FinanceData, id: string): FinanceData {
    return {
      ...financeData,
      emis: (financeData.emis || []).filter((e) => e.id !== id),
    };
  },

  addCcEmi(financeData: FinanceData, ccEmi: Omit<CreditCardEmiMaster, 'id'>): { updatedData: FinanceData; newCcEmi: CreditCardEmiMaster } {
    const newId = `cc_emi_${Date.now()}`;
    const newCcEmi: CreditCardEmiMaster = {
      ...ccEmi,
      id: newId,
    };

    return {
      updatedData: {
        ...financeData,
        ccEmis: [...(financeData.ccEmis || []), newCcEmi],
      },
      newCcEmi,
    };
  },

  deleteCcEmi(financeData: FinanceData, id: string): FinanceData {
    return {
      ...financeData,
      ccEmis: (financeData.ccEmis || []).filter((c) => c.id !== id),
    };
  },

  updateCcEmiInstallment(
    financeData: FinanceData,
    emiId: string,
    installmentNumber: number,
    status: 'paid' | 'unpaid'
  ): FinanceData {
    return {
      ...financeData,
      ccEmis: (financeData.ccEmis || []).map((emi) => {
        if (emi.id !== emiId) return emi;
        return {
          ...emi,
          installments: emi.installments.map((inst) =>
            inst.installmentNumber === installmentNumber ? { ...inst, paidStatus: status } : inst
          ),
        };
      }),
    };
  },
};
