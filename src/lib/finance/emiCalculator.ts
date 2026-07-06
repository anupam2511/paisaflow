/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EmiItem } from '../../types';

export interface EmiItemSummary {
  progressPercentage: number;
  remainingTenure: number;
  sunkCost: number;
  outstandingBalance: number;
}

export interface ForeclosureSummary {
  outstandingPrincipal: number;
  penaltyRatePercent: number;
  penaltyAmount: number;
  gstRatePercent: number;
  gstOnPenalty: number;
  totalForeclosureCharge: number;
}

/**
 * Calculates a standard loan EMI (Equated Monthly Installment)
 */
export function calculateStandardEmi(
  principal: number,
  annualInterestRate: number,
  tenureMonths: number
): number {
  if (tenureMonths <= 0) return 0;
  if (annualInterestRate <= 0) {
    return Math.round((principal / tenureMonths) * 100) / 100;
  }
  const r = (annualInterestRate / 12) / 100;
  const power = Math.pow(1 + r, tenureMonths);
  const emi = (principal * r * power) / (power - 1);
  return Math.round(emi * 100) / 100;
}

/**
 * Computes foreclosure charges and total amount required to close a loan early
 */
export function calculateLoanForeclosure(
  outstandingPrincipal: number,
  penaltyRatePercent: number = 0,
  gstRatePercent: number = 18
): ForeclosureSummary {
  const penaltyAmount = Math.round((outstandingPrincipal * (penaltyRatePercent / 100)) * 100) / 100;
  const gstOnPenalty = Math.round((penaltyAmount * (gstRatePercent / 100)) * 100) / 100;
  const totalForeclosureCharge = Math.round((outstandingPrincipal + penaltyAmount + gstOnPenalty) * 100) / 100;

  return {
    outstandingPrincipal,
    penaltyRatePercent,
    penaltyAmount,
    gstRatePercent,
    gstOnPenalty,
    totalForeclosureCharge,
  };
}

/**
 * Calculates metrics for an individual loan EMI item.
 */
export function getEmiItemSummary(emi: EmiItem): EmiItemSummary {
  const progressPercentage = emi.totalTenure > 0
    ? Math.round((emi.installmentsPaid / emi.totalTenure) * 100)
    : 0;
  const remainingTenure = Math.max(0, emi.totalTenure - emi.installmentsPaid);
  const sunkCost = emi.amount * emi.installmentsPaid;
  const outstandingBalance = emi.amount * remainingTenure;

  return {
    progressPercentage,
    remainingTenure,
    sunkCost,
    outstandingBalance,
  };
}

/**
 * Calculates the total monthly loan/EMI commitment outflow.
 */
export function calculateMonthlyLoanEmiOutflow(emis: EmiItem[]): number {
  return (emis || [])
    .filter((e) => e.isActive)
    .reduce((sum, e) => sum + e.amount, 0);
}

/**
 * Calculates the total remaining outstanding balance across all active loan EMIs.
 */
export function calculateTotalLoanEmiOutstanding(emis: EmiItem[]): number {
  return (emis || [])
    .filter((e) => e.isActive)
    .reduce((sum, e) => {
      const remaining = Math.max(0, e.totalTenure - e.installmentsPaid);
      return sum + e.amount * remaining;
    }, 0);
}

/**
 * Calculates total historical paid (sunk) loan EMI value.
 */
export function calculateTotalLoanEmiSunk(emis: EmiItem[]): number {
  return (emis || []).reduce((sum, e) => sum + (e.amount * e.installmentsPaid), 0);
}
