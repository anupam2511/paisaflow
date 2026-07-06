/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FinanceData, FinancialAccount } from '../types';

export const accountsService = {
  getAccounts(financeData: FinanceData): FinancialAccount[] {
    return financeData.accounts || [];
  },

  addAccount(financeData: FinanceData, account: Omit<FinancialAccount, 'id'>): { updatedData: FinanceData; newAccount: FinancialAccount } {
    const newId = `acc_${Date.now()}`;
    const newAccount: FinancialAccount = {
      ...account,
      id: newId,
    };

    return {
      updatedData: {
        ...financeData,
        accounts: [...financeData.accounts, newAccount],
      },
      newAccount,
    };
  },

  updateAccount(financeData: FinanceData, id: string, updatedFields: Partial<FinancialAccount>): FinanceData {
    return {
      ...financeData,
      accounts: financeData.accounts.map((a) => (a.id === id ? { ...a, ...updatedFields } : a)),
    };
  },

  deleteAccount(financeData: FinanceData, id: string): FinanceData {
    return {
      ...financeData,
      accounts: financeData.accounts.filter((a) => a.id !== id),
      expenses: financeData.expenses.map((e) => (e.accountId === id ? { ...e, accountId: '' } : e)),
    };
  },

  transferFunds(financeData: FinanceData, fromId: string, toId: string, amount: number): FinanceData {
    const updatedAccounts = financeData.accounts.map((acc) => {
      if (acc.id === fromId) {
        return { ...acc, balance: acc.balance - amount };
      }
      if (acc.id === toId) {
        return { ...acc, balance: acc.balance + amount };
      }
      return acc;
    });

    return {
      ...financeData,
      accounts: updatedAccounts,
    };
  },
};
