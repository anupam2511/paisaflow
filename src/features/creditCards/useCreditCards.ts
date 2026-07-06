/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useFinance } from '../../context/FinanceContext';
import { CcTransaction, FinancialAccount } from '../../types';
import { creditCardsService } from '../../services/creditCards.service';

export function useCreditCards() {
  const { financeData, setFinanceData } = useFinance();

  const creditCards = creditCardsService.getCreditCards(financeData);
  const ccTransactions = creditCardsService.getCcTransactions(financeData);
  const bankAccounts = creditCardsService.getBankAccounts(financeData);

  const addCreditCard = (card: Omit<FinancialAccount, 'id' | 'type' | 'balance'> & { initialBalance?: number }) => {
    const { updatedData, newCard } = creditCardsService.addCreditCard(financeData, card);
    setFinanceData(updatedData);
    return newCard;
  };

  const deleteCreditCard = (cardId: string) => {
    setFinanceData((prev) => creditCardsService.deleteCreditCard(prev, cardId));
  };

  const addTransaction = (tx: Omit<CcTransaction, 'id'>, payFromBankAccountId?: string) => {
    const { updatedData, newTx } = creditCardsService.addTransaction(financeData, tx, payFromBankAccountId);
    setFinanceData(updatedData);
    return newTx;
  };

  const deleteTransaction = (txId: string) => {
    setFinanceData((prev) => creditCardsService.deleteTransaction(prev, txId));
  };

  const getCardMetrics = (card: FinancialAccount) => {
    return creditCardsService.getCardMetrics(financeData, card);
  };

  const getOverallMetrics = () => {
    return creditCardsService.getOverallMetrics(financeData);
  };

  return {
    creditCards,
    ccTransactions,
    bankAccounts,
    addCreditCard,
    deleteCreditCard,
    addTransaction,
    deleteTransaction,
    getCardMetrics,
    getOverallMetrics,
  };
}
