/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useFinance } from '../../context/FinanceContext';
import { FinancialAccount } from '../../types';
import { accountsService } from '../../services/accounts.service';

export function useAccounts() {
  const { financeData, setFinanceData } = useFinance();

  const accounts = accountsService.getAccounts(financeData);

  const addAccount = (account: Omit<FinancialAccount, 'id'>) => {
    const { updatedData, newAccount } = accountsService.addAccount(financeData, account);
    setFinanceData(updatedData);
    return newAccount;
  };

  const updateAccount = (id: string, updatedFields: Partial<FinancialAccount>) => {
    setFinanceData((prev) => accountsService.updateAccount(prev, id, updatedFields));
  };

  const deleteAccount = (id: string) => {
    setFinanceData((prev) => accountsService.deleteAccount(prev, id));
  };

  const transferFunds = (fromId: string, toId: string, amount: number) => {
    setFinanceData((prev) => accountsService.transferFunds(prev, fromId, toId, amount));
  };

  return {
    accounts,
    addAccount,
    updateAccount,
    deleteAccount,
    transferFunds,
  };
}
