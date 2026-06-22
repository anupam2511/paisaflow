/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BillingCyclePeriod {
  start: Date;
  end: Date;
  startStr: string;
  endStr: string;
}

/**
 * Computes the calendar range representing the billable cycle for a selected month of statement.
 * E.g., if Day is 15 and selected Month/Year is June 2026, the statement range is May 15, 2026 to June 14, 2026.
 * If Day is 1, it spans June 1, 2526 to June 30, 2026.
 */
export function getBillingCycleRange(
  billingCycleStartDay: number,
  selectedYear: number,
  selectedMonth: number
): BillingCyclePeriod {
  // Clamp startDay [1, 31]
  const startDay = Math.min(31, Math.max(1, billingCycleStartDay));

  let startDate: Date;
  let endDate: Date;

  if (startDay === 1) {
    startDate = new Date(selectedYear, selectedMonth - 1, 1, 0, 0, 0, 0);
    // 0 day of next month is the last day of selected month
    endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);
  } else {
    // Start date is in previous month
    let startYear = selectedYear;
    let startMonthIndex = selectedMonth - 2; // Month index is selectedMonth - 1. Previous is selectedMonth - 2.
    if (startMonthIndex < 0) {
      startMonthIndex = 11;
      startYear = selectedYear - 1;
    }

    // Days in that start month
    const daysInStartMonth = new Date(startYear, startMonthIndex + 1, 0).getDate();
    const clampedStartDay = Math.min(startDay, daysInStartMonth);
    startDate = new Date(startYear, startMonthIndex, clampedStartDay, 0, 0, 0, 0);

    // End date is in selected month, day is startDay - 1
    const endMonthIndex = selectedMonth - 1;
    const daysInEndMonth = new Date(selectedYear, endMonthIndex + 1, 0).getDate();
    const clampedEndDay = Math.min(startDay - 1, daysInEndMonth);
    endDate = new Date(selectedYear, endMonthIndex, clampedEndDay, 23, 59, 59, 999);
  }

  const pad = (n: number) => n.toString().padStart(2, '0');
  const startStr = `${startDate.getFullYear()}-${pad(startDate.getMonth() + 1)}-${pad(startDate.getDate())}`;
  const endStr = `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}`;

  return { start: startDate, end: endDate, startStr, endStr };
}

/**
 * Filter list of expenses by a dynamic billing cycle.
 * Checks YYYY-MM-DD strings lexically.
 */
export function filterExpensesByRange(
  expenses: { date: string; [key: string]: any }[],
  startStr: string,
  endStr: string
) {
  return expenses.filter(e => e.date >= startStr && e.date <= endStr);
}

/**
 * Computes start/end dates for the active billing cycle covering any target date.
 */
export function getActiveBillingCycleForDate(
  billingCycleStartDay: number,
  targetDate: Date
): { startStr: string; endStr: string } {
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth() + 1; // 1-based
  const day = targetDate.getDate();
  const pad = (n: number) => n.toString().padStart(2, '0');

  if (day >= billingCycleStartDay) {
    // Spans from this month's startDay to next month's startDay - 1
    const startYear = year;
    const startMonth = month;
    
    let endYear = year;
    let endMonth = month + 1;
    if (endMonth > 12) {
      endMonth = 1;
      endYear = year + 1;
    }
    
    const daysInStart = new Date(startYear, startMonth, 0).getDate();
    const clampedS = Math.min(billingCycleStartDay, daysInStart);
    const startStr = `${startYear}-${pad(startMonth)}-${pad(clampedS)}`;
    
    const daysInEnd = new Date(endYear, endMonth, 0).getDate();
    const clampedE = Math.min(billingCycleStartDay - 1, daysInEnd);
    const endStr = `${endYear}-${pad(endMonth)}-${pad(clampedE)}`;
    
    return { startStr, endStr };
  } else {
    // Spans from previous month's startDay to this month's startDay - 1
    let startYear = year;
    let startMonth = month - 1;
    if (startMonth < 1) {
      startMonth = 12;
      startYear = year - 1;
    }
    
    const daysInStart = new Date(startYear, startMonth, 0).getDate();
    const clampedS = Math.min(billingCycleStartDay, daysInStart);
    const startStr = `${startYear}-${pad(startMonth)}-${pad(clampedS)}`;
    
    const daysInEnd = new Date(year, month, 0).getDate();
    const clampedE = Math.min(billingCycleStartDay - 1, daysInEnd);
    const endStr = `${year}-${pad(month)}-${pad(clampedE)}`;
    
    return { startStr, endStr };
  }
}

import { FinanceData, RecurringSpend, Investment } from '../types';

export function advanceBillingDate(
  dateStr: string,
  cycle: 'monthly' | 'quarterly' | 'yearly',
  day: number,
  monthStart: number = 1
): string {
  try {
    const currentDate = new Date(dateStr);
    if (isNaN(currentDate.getTime())) {
      throw new Error('invalid date');
    }
    if (cycle === 'yearly') {
      currentDate.setFullYear(currentDate.getFullYear() + 1);
    } else if (cycle === 'quarterly') {
      currentDate.setMonth(currentDate.getMonth() + 3);
    } else {
      // Monthly
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    const year = currentDate.getFullYear();
    const monthIndex = currentDate.getMonth(); // 0-11
    const lastDay = new Date(year, monthIndex + 1, 0).getDate();
    const targetDay = Math.min(day, lastDay);
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${year}-${pad(monthIndex + 1)}-${pad(targetDay)}`;
  } catch (err) {
    // fallback: parse year, month, day and add manually
    const parts = dateStr.split('-');
    let yr = parseInt(parts[0]);
    let mo = parseInt(parts[1]);
    if (cycle === 'yearly') {
      yr += 1;
    } else if (cycle === 'quarterly') {
      mo += 3;
      if (mo > 12) {
        mo -= 12;
        yr += 1;
      }
    } else {
      mo += 1;
      if (mo > 12) {
        mo = 1;
        yr += 1;
      }
    }
    const lastDay = new Date(yr, mo, 0).getDate();
    const targetDay = Math.min(day, lastDay);
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${yr}-${pad(mo)}-${pad(targetDay)}`;
  }
}

export function processAutoDebits(
  finance: FinanceData,
  todayStr: string
): { updatedData: FinanceData; notifications: string[]; changed: boolean } {
  let changed = false;
  const notifications: string[] = [];
  
  // Create deep copies to avoid direct mutations
  const updatedAccounts = JSON.parse(JSON.stringify(finance.accounts || []));
  const updatedExpenses = JSON.parse(JSON.stringify(finance.expenses || []));
  const updatedSpends = finance.recurringSpends ? JSON.parse(JSON.stringify(finance.recurringSpends)) : [];
  const updatedInvestments = finance.investments ? JSON.parse(JSON.stringify(finance.investments)) : [];

  // 1. Process recurringSpends (Subscriptions)
  for (let i = 0; i < updatedSpends.length; i++) {
    const sub = updatedSpends[i] as RecurringSpend;
    // Check if subscription is active, is auto-debit, has fixed billing date, and is due
    if (sub.isActive && sub.isAutoDebit && !sub.isVariableDate && sub.nextBillingDate) {
      let limitCount = 0; // Prevent infinite loops in case of corrupt dates
      while (sub.nextBillingDate && sub.nextBillingDate <= todayStr && limitCount < 12) {
        limitCount++;
        changed = true;
        const dueDate = sub.nextBillingDate;
        const subAmount = sub.amount;
        const subAccountId = sub.accountId;

        // Process deduction from the connected balance account
        const accountIndex = updatedAccounts.findIndex((a: any) => a.id === subAccountId);
        if (accountIndex !== -1) {
          const acc = updatedAccounts[accountIndex];
          if (acc.type === 'bank') {
            acc.balance -= subAmount;
          } else {
            acc.balance += subAmount;
          }
        }

        // Add corresponding auto-debit expense transaction
        const newExpense = {
          id: `exp-sub-auto-${sub.id}-${dueDate}-${limitCount}`,
          description: `Subscription: ${sub.name} (Auto-Debit)`,
          amount: subAmount,
          category: sub.category,
          date: dueDate,
          accountId: subAccountId,
          isRecurring: true,
          recurringId: sub.id,
        };
        updatedExpenses.unshift(newExpense);

        // Advance nextBillingDate
        const nextDateStr = advanceBillingDate(
          dueDate,
          sub.billingCycle,
          sub.billingDay,
          sub.billingMonth || 1
        );

        notifications.push(
          `Renewed ${sub.name} (${finance.preferences?.currencySymbol || '₹'}${subAmount}) charged to ${accountIndex !== -1 ? updatedAccounts[accountIndex].name : 'default card'} on due date ${dueDate}.`
        );

        sub.nextBillingDate = nextDateStr;
      }
    }
  }

  // 2. Process recurring Investments (SIPs)
  for (let i = 0; i < updatedInvestments.length; i++) {
    const inv = updatedInvestments[i] as Investment;
    // Check if investment is recurring SIP, has autoDebit enabled, and has nextBillingDate due
    if (inv.investmentType === 'recurring' && inv.isAutoDebit && inv.nextBillingDate) {
      let limitCount = 0; // Prevent infinite loops in case of corrupt dates
      while (inv.nextBillingDate && inv.nextBillingDate <= todayStr && limitCount < 12) {
        limitCount++;
        changed = true;
        const dueDate = inv.nextBillingDate;
        const subAmount = inv.amount;
        const subAccountId = inv.accountId;

        // Deduct from bank or credit card balance
        const accountIndex = updatedAccounts.findIndex((a: any) => a.id === subAccountId);
        if (accountIndex !== -1) {
          const acc = updatedAccounts[accountIndex];
          if (acc.type === 'bank') {
            acc.balance -= subAmount;
          } else {
            acc.balance += subAmount;
          }
        }

        // Add to aggregate total value of the investment
        inv.totalInvested = (inv.totalInvested || 0) + subAmount;

        // Log corresponding automatic transaction in ledger
        const newExpense = {
          id: `exp-inv-auto-${inv.id}-${dueDate}-${limitCount}`,
          description: `SIP Investment: ${inv.name} (Auto-Debit)`,
          amount: subAmount,
          category: 'Investment',
          date: dueDate,
          accountId: subAccountId,
          isRecurring: true,
          recurringId: inv.id,
        };
        updatedExpenses.unshift(newExpense);

        // Advance nextBillingDate
        const nextDateStr = advanceBillingDate(
          dueDate,
          inv.frequency || 'monthly',
          inv.billingDay || 1
        );

        notifications.push(
          `Invested ${inv.name} (${finance.preferences?.currencySymbol || '₹'}${subAmount}) charged to ${accountIndex !== -1 ? updatedAccounts[accountIndex].name : 'checking bank'} on due date ${dueDate}.`
        );

        inv.nextBillingDate = nextDateStr;
      }
    }
  }

  return {
    updatedData: {
      ...finance,
      accounts: updatedAccounts,
      expenses: updatedExpenses,
      recurringSpends: updatedSpends,
      investments: updatedInvestments,
    },
    notifications,
    changed,
  };
}

