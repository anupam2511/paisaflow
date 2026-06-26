/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useFinance } from '../../context/FinanceContext';
import { CcTransaction, FinancialAccount } from '../../types';

export function useCreditCards() {
  const { financeData, setFinanceData } = useFinance();

  const creditCards = (financeData.accounts || []).filter((a) => a.type === 'credit_card');
  const ccTransactions = financeData.ccTransactions || [];
  const bankAccounts = (financeData.accounts || []).filter((a) => a.type === 'bank');

  // Add a new credit card
  const addCreditCard = (card: Omit<FinancialAccount, 'id' | 'type' | 'balance'> & { initialBalance?: number }) => {
    const newId = `cc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newCard: FinancialAccount = {
      ...card,
      id: newId,
      type: 'credit_card',
      balance: card.initialBalance || 0,
    };

    setFinanceData((prev) => ({
      ...prev,
      accounts: [...prev.accounts, newCard],
    }));

    return newCard;
  };

  // Delete a credit card
  const deleteCreditCard = (cardId: string) => {
    setFinanceData((prev) => ({
      ...prev,
      accounts: prev.accounts.filter((a) => a.id !== cardId),
      ccTransactions: (prev.ccTransactions || []).filter((t) => t.cardId !== cardId),
    }));
  };

  // Add credit card transaction (purchase, refund, EMI conversion, bill payment)
  const addTransaction = (tx: Omit<CcTransaction, 'id'>, payFromBankAccountId?: string) => {
    const newId = `tx_cc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newTx: CcTransaction = {
      ...tx,
      id: newId,
    };

    setFinanceData((prev) => {
      // 1. Update card balance based on transaction type
      const updatedAccounts = prev.accounts.map((acc) => {
        if (acc.id === tx.cardId) {
          let updatedBal = acc.balance;

          if (tx.type === 'purchase') {
            updatedBal += tx.amount;
          } else if (tx.type === 'refund') {
            updatedBal -= tx.amount;
          } else if (tx.type === 'bill_payment') {
            updatedBal -= tx.amount;
          } else if (tx.type === 'emi_conversion') {
            // Converts existing balance/purchase into EMI. 
            // In Indian credit cards, the outstanding principal is blocked,
            // but immediate statement balance changes.
            // Let's assume EMI conversion moves amount from immediate outstanding or just logs it.
            // No direct immediate balance change if already part of the balance, or we can leave it as a transfer.
          }

          return {
            ...acc,
            balance: Math.max(0, updatedBal),
          };
        }

        // 2. If it's a bill payment and we selected a bank account, deduct from the bank account balance
        if (tx.type === 'bill_payment' && payFromBankAccountId && acc.id === payFromBankAccountId) {
          return {
            ...acc,
            balance: Math.max(0, acc.balance - tx.amount),
          };
        }

        return acc;
      });

      // 3. Mirror as general Expense if it is a purchase so the standard ledger captures it
      let updatedExpenses = prev.expenses;
      if (tx.type === 'purchase') {
        updatedExpenses = [
          ...prev.expenses,
          {
            id: `exp_cc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            description: tx.description,
            amount: tx.amount,
            category: tx.category || 'Shopping',
            date: tx.date,
            accountId: tx.cardId,
            isRecurring: false,
          },
        ];
      }

      return {
        ...prev,
        accounts: updatedAccounts,
        ccTransactions: [...(prev.ccTransactions || []), newTx],
        expenses: updatedExpenses,
      };
    });

    return newTx;
  };

  // Delete transaction and revert balance change
  const deleteTransaction = (txId: string) => {
    setFinanceData((prev) => {
      const targetTx = (prev.ccTransactions || []).find((t) => t.id === txId);
      if (!targetTx) return prev;

      const updatedAccounts = prev.accounts.map((acc) => {
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
        return acc;
      });

      return {
        ...prev,
        accounts: updatedAccounts,
        ccTransactions: (prev.ccTransactions || []).filter((t) => t.id !== txId),
      };
    });
  };

  // Helper to calculate card metrics
  const getCardMetrics = (card: FinancialAccount) => {
    const creditLimit = card.limit || 0;
    const utilized = card.balance || 0;
    const available = Math.max(0, creditLimit - utilized);
    const utilizationPercent = creditLimit > 0 ? (utilized / creditLimit) * 100 : 0;

    // Statement day (bill generation day of month)
    const statementDay = card.billingCycleStartDay || 15;

    // Calculate actual dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // If today is strictly past the statementDay, next statement is next month.
    // Otherwise, it is this month's statementDay.
    let billDate = new Date(today.getFullYear(), today.getMonth(), statementDay, 0, 0, 0, 0);
    if (today.getDate() > statementDay) {
      billDate = new Date(today.getFullYear(), today.getMonth() + 1, statementDay, 0, 0, 0, 0);
    }

    const dueDate = new Date(billDate.getTime());
    dueDate.setDate(billDate.getDate() + 20);

    const periodEndDate = new Date(billDate.getTime());
    const periodStartDate = new Date(billDate.getTime());
    periodStartDate.setMonth(billDate.getMonth() - 1);
    periodStartDate.setDate(periodStartDate.getDate() + 1);

    const formatDateString = (date: Date) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = date.getDate();
      const suffix = (day: number) => {
        if (day > 3 && day < 21) return 'th';
        switch (day % 10) {
          case 1:  return "st";
          case 2:  return "nd";
          case 3:  return "rd";
          default: return "th";
        }
      };
      return `${day}${suffix(day)} ${months[date.getMonth()]}`;
    };

    return {
      creditLimit,
      utilized,
      available,
      utilizationPercent,
      billingCycle: `${formatDateString(periodStartDate)} to ${formatDateString(periodEndDate)}`,
      dueDay: dueDate.getDate(),
      nextBillDateStr: formatDateString(billDate),
      nextDueDateStr: formatDateString(dueDate),
    };
  };

  // Overall dashboard metrics
  const getOverallMetrics = () => {
    const totalLimit = creditCards.reduce((sum, c) => sum + (c.limit || 0), 0);
    const totalUtilized = creditCards.reduce((sum, c) => sum + c.balance, 0);
    const totalAvailable = Math.max(0, totalLimit - totalUtilized);
    const overallPercent = totalLimit > 0 ? (totalUtilized / totalLimit) * 100 : 0;

    // Find upcoming due bills / amounts
    const upcomingBills = creditCards.map((card) => {
      const metrics = getCardMetrics(card);
      return {
        cardId: card.id,
        name: card.name,
        institution: card.institution,
        color: card.color,
        amountDue: card.balance,
        dueDay: metrics.dueDay,
        billingCycle: metrics.billingCycle,
      };
    }).filter((bill) => bill.amountDue > 0);

    return {
      totalLimit,
      totalUtilized,
      totalAvailable,
      overallPercent,
      upcomingBills,
    };
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
