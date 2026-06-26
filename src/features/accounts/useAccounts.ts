/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useFinance } from '../../context/FinanceContext';
import { FinancialAccount } from '../../types';

export function useAccounts() {
  const { financeData, setFinanceData } = useFinance();

  const accounts = financeData.accounts || [];

  const addAccount = (account: Omit<FinancialAccount, 'id'>) => {
    const newId = `acc_${Date.now()}`;
    const newAccount: FinancialAccount = {
      ...account,
      id: newId,
    };

    setFinanceData((prev) => ({
      ...prev,
      accounts: [...prev.accounts, newAccount],
    }));
    return newAccount;
  };

  const updateAccount = (id: string, updatedFields: Partial<FinancialAccount>) => {
    setFinanceData((prev) => ({
      ...prev,
      accounts: prev.accounts.map((a) => (a.id === id ? { ...a, ...updatedFields } : a)),
    }));
  };

  const deleteAccount = (id: string) => {
    setFinanceData((prev) => ({
      ...prev,
      accounts: prev.accounts.filter((a) => a.id !== id),
      // Clean up references in expenses if needed
      expenses: prev.expenses.map((e) => (e.accountId === id ? { ...e, accountId: '' } : e)),
    }));
  };

  const transferFunds = (fromId: string, toId: string, amount: number) => {
    setFinanceData((prev) => {
      const updatedAccounts = prev.accounts.map((acc) => {
        if (acc.id === fromId) {
          return { ...acc, balance: acc.balance - amount };
        }
        if (acc.id === toId) {
          return { ...acc, balance: acc.balance + amount };
        }
        return acc;
      });

      return {
        ...prev,
        accounts: updatedAccounts,
      };
    });
  };

  return {
    accounts,
    addAccount,
    updateAccount,
    deleteAccount,
    transferFunds,
  };
}
