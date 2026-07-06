/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CcTransaction, FinancialAccount, CreditCardEmiMaster } from '../../types';

export interface CardMetrics {
  creditLimit: number;
  utilized: number;
  statementBalance: number;
  unbilledEmiPrincipal: number;
  available: number;
  utilizationPercent: number;
  billingCycle: string;
  dueDay: number;
  nextBillDateStr: string;
  nextDueDateStr: string;
  isShared: boolean;
  isMainCard: boolean;
  parentCardId: string;
  parentCardName: string;
  groupUtilized: number;
  groupAvailable: number;
}

export interface UpcomingBill {
  cardId: string;
  name: string;
  institution: string;
  color: string;
  amountDue: number;
  dueDay: number;
  billingCycle: string;
}

export interface OverallCreditMetrics {
  totalLimit: number;
  totalUtilized: number;
  totalStatementBalance: number;
  totalUnbilledEmiPrincipal: number;
  totalAvailable: number;
  overallPercent: number;
  upcomingBills: UpcomingBill[];
}

/**
 * Computes individual outstanding and statement balances based on cycle and transaction ledger
 */
export function getCardOutstandingAndStatement(
  transactions: CcTransaction[],
  card: FinancialAccount
): { outstanding: number; statementBalance: number } {
  const cardTransactions = (transactions || []).filter((t) => t.cardId === card.id);
  if (cardTransactions.length === 0) {
    return {
      outstanding: card.balance || 0,
      statementBalance: card.balance || 0,
    };
  }

  const statementDay = card.billingCycleStartDay || 15;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let billDate = new Date(today.getFullYear(), today.getMonth(), statementDay, 0, 0, 0, 0);
  if (today.getDate() > statementDay) {
    billDate = new Date(today.getFullYear(), today.getMonth() + 1, statementDay, 0, 0, 0, 0);
  }
  const periodEndDate = new Date(billDate.getTime());
  const periodStartDate = new Date(billDate.getTime());
  periodStartDate.setMonth(billDate.getMonth() - 1);
  periodStartDate.setDate(periodStartDate.getDate() + 1);

  const pad = (n: number) => n.toString().padStart(2, '0');
  const startStr = `${periodStartDate.getFullYear()}-${pad(periodStartDate.getMonth() + 1)}-${pad(periodStartDate.getDate())}`;
  const endStr = `${periodEndDate.getFullYear()}-${pad(periodEndDate.getMonth() + 1)}-${pad(periodEndDate.getDate())}`;

  let cyclePurchases = 0;
  let cycleRefunds = 0;
  let cyclePayments = 0;
  let cycleConversions = 0;

  let totalPurchases = 0;
  let totalRefunds = 0;
  let totalPayments = 0;
  let totalConversions = 0;

  cardTransactions.forEach((t) => {
    const isCycle = t.date >= startStr && t.date <= endStr;
    if (t.type === 'purchase') {
      totalPurchases += t.amount;
      if (isCycle) cyclePurchases += t.amount;
    } else if (t.type === 'refund') {
      totalRefunds += t.amount;
      if (isCycle) cycleRefunds += t.amount;
    } else if (t.type === 'bill_payment') {
      totalPayments += t.amount;
      if (isCycle) cyclePayments += t.amount;
    } else if (t.type === 'emi_conversion') {
      totalConversions += t.amount;
      if (isCycle) cycleConversions += t.amount;
    }
  });

  const calculatedOutstanding = Math.max(0, totalPurchases - totalRefunds - totalPayments - totalConversions);
  const calculatedStatement = Math.max(0, cyclePurchases - cycleRefunds - cyclePayments - cycleConversions);

  return {
    outstanding: calculatedOutstanding,
    statementBalance: calculatedStatement,
  };
}

/**
 * Calculates metrics for a specific credit card, taking shared networks into account
 */
export function calculateCardMetrics(params: {
  card: FinancialAccount;
  creditCards: FinancialAccount[];
  transactions: CcTransaction[];
  ccEmis: CreditCardEmiMaster[];
}): CardMetrics {
  const { card, creditCards, transactions, ccEmis } = params;
  let creditLimit = card.limit || 0;
  
  const cardCcEmis = (ccEmis || []).filter(
    (e) => e.cardId === card.id && e.status === 'active'
  );
  const unbilledEmiPrincipal = cardCcEmis.reduce(
    (sum, e) => sum + (e.outstandingPrincipal || 0),
    0
  );

  const { outstanding, statementBalance } = getCardOutstandingAndStatement(transactions, card);
  let utilized = outstanding + unbilledEmiPrincipal;
  let available = Math.max(0, creditLimit - utilized);

  let isShared = false;
  let isMainCard = !!card.isMainCard;
  let parentCardId = card.linkedGroupId || '';
  let parentCardName = '';
  let groupUtilized = utilized;
  let groupAvailable = available;

  if (card.linkedGroupId && card.linkedGroupId !== '') {
    let mainCard = creditCards.find((c) => c.id === card.linkedGroupId);
    if (!mainCard) {
      mainCard = creditCards.find((c) => c.isMainCard);
    }

    if (mainCard) {
      isShared = true;
      const sharedLimit = mainCard.limit || 0;
      const sharedGroupCards = creditCards.filter(
        (c) => c.id === mainCard.id || c.linkedGroupId === mainCard.id || c.id === card.id
      );
      
      const totalGroupNormalUtilized = sharedGroupCards.reduce((sum, c) => {
        const { outstanding: out } = getCardOutstandingAndStatement(transactions, c);
        return sum + out;
      }, 0);
      
      const totalGroupUnbilled = sharedGroupCards.reduce((sum, c) => {
        const cCcEmis = (ccEmis || []).filter(
          (e) => e.cardId === c.id && e.status === 'active'
        );
        return sum + cCcEmis.reduce((s, e) => s + (e.outstandingPrincipal || 0), 0);
      }, 0);

      const totalGroupUtilized = totalGroupNormalUtilized + totalGroupUnbilled;
      const totalGroupAvailable = Math.max(0, sharedLimit - totalGroupUtilized);

      creditLimit = sharedLimit;
      utilized = statementBalance + unbilledEmiPrincipal;
      available = totalGroupAvailable;
      groupUtilized = totalGroupUtilized;
      groupAvailable = totalGroupAvailable;
      parentCardName = mainCard.name;
      parentCardId = mainCard.id;
    }
  } else if (card.isMainCard) {
    isShared = true;
    const sharedLimit = card.limit || 0;
    const sharedGroupCards = creditCards.filter((c) => c.id === card.id || c.linkedGroupId === card.id);
    
    const totalGroupNormalUtilized = sharedGroupCards.reduce((sum, c) => {
      const { outstanding: out } = getCardOutstandingAndStatement(transactions, c);
      return sum + out;
    }, 0);
    const totalGroupUnbilled = sharedGroupCards.reduce((sum, c) => {
      const cCcEmis = (ccEmis || []).filter(
        (e) => e.cardId === c.id && e.status === 'active'
      );
      return sum + cCcEmis.reduce((s, e) => s + (e.outstandingPrincipal || 0), 0);
    }, 0);

    const totalGroupUtilized = totalGroupNormalUtilized + totalGroupUnbilled;
    const totalGroupAvailable = Math.max(0, sharedLimit - totalGroupUtilized);

    creditLimit = sharedLimit;
    utilized = statementBalance + unbilledEmiPrincipal;
    available = totalGroupAvailable;
    groupUtilized = totalGroupUtilized;
    groupAvailable = totalGroupAvailable;
  }

  const utilizationPercent = creditLimit > 0 ? (utilized / creditLimit) * 100 : 0;
  const statementDay = card.billingCycleStartDay || 15;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

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
        case 1:  return 'st';
        case 2:  return 'nd';
        case 3:  return 'rd';
        default: return 'th';
      }
    };
    return `${day}${suffix(day)} ${months[date.getMonth()]}`;
  };

  return {
    creditLimit,
    utilized,
    statementBalance,
    unbilledEmiPrincipal,
    available,
    utilizationPercent: Math.min(100, utilizationPercent),
    billingCycle: `${formatDateString(periodStartDate)} to ${formatDateString(periodEndDate)}`,
    dueDay: dueDate.getDate(),
    nextBillDateStr: formatDateString(billDate),
    nextDueDateStr: formatDateString(dueDate),
    isShared,
    isMainCard,
    parentCardId,
    parentCardName,
    groupUtilized,
    groupAvailable,
  };
}

/**
 * Calculates aggregated overall credit metrics across all cards
 */
export function calculateOverallMetrics(params: {
  creditCards: FinancialAccount[];
  transactions: CcTransaction[];
  ccEmis: CreditCardEmiMaster[];
}): OverallCreditMetrics {
  const { creditCards, transactions, ccEmis } = params;

  const totalLimit = creditCards.reduce((sum, c) => {
    if (c.linkedGroupId && c.linkedGroupId !== '' && !c.isMainCard) {
      const hasMaster = creditCards.some((m) => m.id === c.linkedGroupId || m.isMainCard);
      if (hasMaster) {
        return sum;
      }
    }
    return sum + (c.limit || 0);
  }, 0);

  const totalUtilized = creditCards.reduce((sum, card) => {
    const metrics = calculateCardMetrics({ card, creditCards, transactions, ccEmis });
    return sum + metrics.utilized;
  }, 0);

  const totalStatementBalance = creditCards.reduce(
    (sum, card) =>
      sum + calculateCardMetrics({ card, creditCards, transactions, ccEmis }).statementBalance,
    0
  );
  
  const totalUnbilledEmiPrincipal = Math.max(0, totalUtilized - totalStatementBalance);
  const totalAvailable = Math.max(0, totalLimit - totalUtilized);
  const overallPercent = totalLimit > 0 ? (totalUtilized / totalLimit) * 100 : 0;

  const upcomingBills = creditCards
    .map((card) => {
      const metrics = calculateCardMetrics({ card, creditCards, transactions, ccEmis });
      return {
        cardId: card.id,
        name: card.name,
        institution: card.institution,
        color: card.color,
        amountDue: metrics.statementBalance,
        dueDay: metrics.dueDay,
        billingCycle: metrics.billingCycle,
      };
    })
    .filter((bill) => bill.amountDue > 0);

  return {
    totalLimit,
    totalUtilized,
    totalStatementBalance,
    totalUnbilledEmiPrincipal,
    totalAvailable,
    overallPercent,
    upcomingBills,
  };
}
