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
  
  // Calculate the raw transaction sum to deduce initial balance if initialBalance is undefined
  let txSum = 0;
  cardTransactions.forEach((t) => {
    if (t.type === 'purchase') {
      txSum += t.amount;
    } else if (t.type === 'refund') {
      txSum -= t.amount;
    } else if (t.type === 'bill_payment') {
      txSum -= t.amount;
    } else if (t.type === 'emi_conversion') {
      txSum -= t.amount;
    }
  });

  const deducedInitialBalance = card.initialBalance !== undefined 
    ? card.initialBalance 
    : Math.max(0, (card.balance || 0) - txSum);

  const startDay = card.billingCycleStartDay || 29;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the statement generation day of the month (which is startDay - 1)
  let statementDay = startDay - 1;
  if (statementDay <= 0) {
    statementDay = 28; // fallback
  }

  // Determine the last statement generation date safely
  let lastStatementDate = new Date(today.getFullYear(), today.getMonth(), statementDay, 0, 0, 0, 0);
  if (lastStatementDate.getMonth() !== today.getMonth()) {
    lastStatementDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 0, 0, 0, 0);
  }

  if (today.getDate() < statementDay) {
    const prevMonth = today.getMonth() - 1;
    lastStatementDate = new Date(today.getFullYear(), prevMonth, statementDay, 0, 0, 0, 0);
    if (lastStatementDate.getMonth() !== (prevMonth < 0 ? 11 : prevMonth)) {
      lastStatementDate = new Date(today.getFullYear(), prevMonth + 1, 0, 0, 0, 0, 0);
    }
  }

  const pad = (n: number) => n.toString().padStart(2, '0');
  const lastStatementStr = `${lastStatementDate.getFullYear()}-${pad(lastStatementDate.getMonth() + 1)}-${pad(lastStatementDate.getDate())}`;

  let billedPurchases = 0;
  let billedRefunds = 0;
  let billedConversions = 0;
  let billedPayments = 0;

  let unbilledPurchases = 0;
  let unbilledRefunds = 0;
  let unbilledConversions = 0;
  let unbilledPayments = 0;

  cardTransactions.forEach((t) => {
    const isUnbilled = t.date > lastStatementStr;
    if (isUnbilled) {
      if (t.type === 'purchase') {
        unbilledPurchases += t.amount;
      } else if (t.type === 'refund') {
        unbilledRefunds += t.amount;
      } else if (t.type === 'bill_payment') {
        unbilledPayments += t.amount;
      } else if (t.type === 'emi_conversion') {
        unbilledConversions += t.amount;
      }
    } else {
      if (t.type === 'purchase') {
        billedPurchases += t.amount;
      } else if (t.type === 'refund') {
        billedRefunds += t.amount;
      } else if (t.type === 'bill_payment') {
        billedPayments += t.amount;
      } else if (t.type === 'emi_conversion') {
        billedConversions += t.amount;
      }
    }
  });

  // Calculate total billed amount that was outstanding before any payments were made.
  // This is the initial billed balance plus any past-cycle purchases, minus past-cycle refunds/conversions.
  const totalBilledAtStatement = Math.max(0, deducedInitialBalance + billedPurchases - billedRefunds - billedConversions);

  // Total payments are applied to clear the billed statement balance first.
  const totalPayments = billedPayments + unbilledPayments;

  // The actual statement balance generated is either the calculated totalBilledAtStatement,
  // or, if we are in initial setup with unrecorded past transactions, it is at least the bill payments
  // that were explicitly made to clear it.
  const effectiveBilledAtStatement = Math.max(totalBilledAtStatement, unbilledPayments);

  // The remaining statement balance due is the effective statement balance minus all payments.
  const statementBalance = Math.max(0, effectiveBilledAtStatement - totalPayments);

  // Excess payments (if any) are applied to reduce the current cycle's unbilled balance.
  // We only calculate genuine excess payments if totalBilledAtStatement is non-zero (captured).
  let excessPayments = 0;
  if (totalBilledAtStatement > 0) {
    excessPayments = Math.max(0, totalPayments - totalBilledAtStatement);
  }

  // Unbilled outstanding is current-cycle purchases minus current-cycle refunds/conversions, minus excess payments.
  const unbilledOutstanding = Math.max(0, unbilledPurchases - unbilledRefunds - unbilledConversions - excessPayments);

  // Total outstanding is what is left of the statement balance plus what is outstanding on current unbilled transactions.
  const outstanding = statementBalance + unbilledOutstanding;

  return {
    outstanding,
    statementBalance,
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
      utilized = outstanding + unbilledEmiPrincipal;
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
    utilized = outstanding + unbilledEmiPrincipal;
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
