/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FinanceData, CcTransaction, FinancialAccount } from '../types';
import {
  calculateCardMetrics,
  calculateOverallMetrics,
  getCardOutstandingAndStatement,
} from '../lib/finance/creditUtilization';

export const creditCardsService = {
  getCreditCards(financeData: FinanceData): FinancialAccount[] {
    return (financeData.accounts || []).filter((a) => a.type === 'credit_card');
  },

  getCcTransactions(financeData: FinanceData): CcTransaction[] {
    return financeData.ccTransactions || [];
  },

  getBankAccounts(financeData: FinanceData): FinancialAccount[] {
    return (financeData.accounts || []).filter((a) => a.type === 'bank');
  },

  addCreditCard(financeData: FinanceData, card: Omit<FinancialAccount, 'id' | 'type' | 'balance'> & { initialBalance?: number }): { updatedData: FinanceData; newCard: FinancialAccount } {
    const newId = `cc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newCard: FinancialAccount = {
      ...card,
      id: newId,
      type: 'credit_card',
      balance: card.initialBalance || 0,
    };

    return {
      updatedData: {
        ...financeData,
        accounts: [...financeData.accounts, newCard],
      },
      newCard,
    };
  },

  deleteCreditCard(financeData: FinanceData, cardId: string): FinanceData {
    return {
      ...financeData,
      accounts: financeData.accounts
        .filter((a) => a.id !== cardId)
        .map((a) => (a.linkedGroupId === cardId ? { ...a, linkedGroupId: '' } : a)),
      ccTransactions: (financeData.ccTransactions || []).filter((t) => t.cardId !== cardId),
    };
  },

  addTransaction(financeData: FinanceData, tx: Omit<CcTransaction, 'id'>, payFromBankAccountId?: string): { updatedData: FinanceData; newTx: CcTransaction } {
    const expId = `exp_cc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newId = `tx_${expId}`;
    const newTx: CcTransaction = {
      ...tx,
      id: newId,
    };

    const updatedAccounts = financeData.accounts.map((acc) => {
      if (acc.id === tx.cardId) {
        let updatedBal = acc.balance;

        if (tx.type === 'purchase') {
          updatedBal += tx.amount;
        } else if (tx.type === 'refund') {
          updatedBal -= tx.amount;
        } else if (tx.type === 'bill_payment') {
          updatedBal -= tx.amount;
        } else if (tx.type === 'emi_conversion') {
          updatedBal -= tx.amount;
        }

        return {
          ...acc,
          balance: Math.max(0, updatedBal),
        };
      }

      if (tx.type === 'bill_payment' && payFromBankAccountId && acc.id === payFromBankAccountId) {
        return {
          ...acc,
          balance: Math.max(0, acc.balance - tx.amount),
        };
      }

      return acc;
    });

    let updatedExpenses = financeData.expenses;
    if (tx.type === 'purchase') {
      updatedExpenses = [
        ...financeData.expenses,
        {
          id: expId,
          description: tx.description,
          amount: tx.amount,
          category: tx.category || 'Shopping',
          date: tx.date,
          accountId: tx.cardId,
          isRecurring: false,
        },
      ];
    } else if (tx.type === 'bill_payment') {
      updatedExpenses = [
        ...financeData.expenses,
        {
          id: expId,
          description: tx.description || 'Credit Card Bill Payment',
          amount: tx.amount,
          category: 'Transfer',
          date: tx.date,
          accountId: payFromBankAccountId || tx.cardId,
          isRecurring: false,
          targetAccountId: tx.cardId,
        },
      ];
    }

    return {
      updatedData: {
        ...financeData,
        accounts: updatedAccounts,
        ccTransactions: [...(financeData.ccTransactions || []), newTx],
        expenses: updatedExpenses,
      },
      newTx,
    };
  },

  deleteTransaction(financeData: FinanceData, txId: string): FinanceData {
    const targetTx = (financeData.ccTransactions || []).find((t) => t.id === txId);
    if (!targetTx) return financeData;

    const matchingExpense = financeData.expenses.find((e) => {
      if (targetTx.id.startsWith('tx_exp_') && e.id === targetTx.id.substring(3)) return true;
      if (e.id === targetTx.id.replace(/^tx_/, '')) return true;
      return (e.category === 'Transfer' || e.accountId === targetTx.cardId) &&
        Math.abs(e.amount - targetTx.amount) < 0.01 &&
        e.description === targetTx.description &&
        e.date === targetTx.date;
    });

    const payFromBankAccountId = matchingExpense?.accountId;

    const updatedAccounts = financeData.accounts.map((acc) => {
      if (acc.id === targetTx.cardId) {
        let updatedBal = acc.balance;

        if (targetTx.type === 'purchase') {
          updatedBal -= targetTx.amount;
        } else if (targetTx.type === 'refund') {
          updatedBal += targetTx.amount;
        } else if (targetTx.type === 'bill_payment') {
          updatedBal += targetTx.amount;
        }

        return {
          ...acc,
          balance: Math.max(0, updatedBal),
        };
      }

      if (targetTx.type === 'bill_payment' && payFromBankAccountId && acc.id === payFromBankAccountId) {
        return {
          ...acc,
          balance: acc.balance + targetTx.amount, // refund bank balance
        };
      }

      return acc;
    });

    let updatedExpenses = financeData.expenses;
    if (targetTx.type === 'purchase' || targetTx.type === 'bill_payment') {
      updatedExpenses = financeData.expenses.filter((e) => {
        if (targetTx.id.startsWith('tx_exp_') && e.id === targetTx.id.substring(3)) {
          return false;
        }
        if (e.id === targetTx.id.replace(/^tx_/, '')) {
          return false;
        }
        const isMatch = (e.accountId === targetTx.cardId || e.category === 'Transfer') &&
          Math.abs(e.amount - targetTx.amount) < 0.01 &&
          e.description === targetTx.description &&
          e.date === targetTx.date;
        return !isMatch;
      });
    }

    return {
      ...financeData,
      accounts: updatedAccounts,
      ccTransactions: (financeData.ccTransactions || []).filter((t) => t.id !== txId),
      expenses: updatedExpenses,
    };
  },

  getCardOutstandingAndStatement(financeData: FinanceData, card: FinancialAccount) {
    return getCardOutstandingAndStatement(financeData.ccTransactions || [], card);
  },

  getCardMetrics(financeData: FinanceData, card: FinancialAccount) {
    return calculateCardMetrics({
      card,
      creditCards: this.getCreditCards(financeData),
      transactions: financeData.ccTransactions || [],
      ccEmis: financeData.ccEmis || [],
    });
  },

  getOverallMetrics(financeData: FinanceData) {
    return calculateOverallMetrics({
      creditCards: this.getCreditCards(financeData),
      transactions: financeData.ccTransactions || [],
      ccEmis: financeData.ccEmis || [],
    });
  }
};
