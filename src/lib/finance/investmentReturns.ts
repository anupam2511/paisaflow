/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Calculates the future value of a lumpsum investment.
 *
 * Formula: FV = PV * (1 + r)^n
 * where:
 * PV = Present Value (initial principal)
 * r = Periodic interest rate (annual rate / 100)
 * n = Number of compounding periods (years)
 */
export function calculateLumpsumFutureValue(
  principal: number,
  annualReturnRate: number, // as percentage (e.g., 12 for 12%)
  years: number
): number {
  if (annualReturnRate < 0 || years <= 0) return principal;
  const r = annualReturnRate / 100;
  const fv = principal * Math.pow(1 + r, years);
  return Math.round(fv * 100) / 100;
}

/**
 * Calculates the future value of a systematic investment plan (SIP) with monthly contributions.
 *
 * Formula: FV = P * [ ((1 + i)^n - 1) / i ] * (1 + i)
 * where:
 * P = Monthly contribution amount
 * i = Monthly interest rate (annual rate / 12 / 100)
 * n = Number of months
 */
export function calculateSipFutureValue(
  monthlyContribution: number,
  annualReturnRate: number, // as percentage (e.g., 12 for 12%)
  months: number
): number {
  if (annualReturnRate <= 0 || months <= 0) return monthlyContribution * months;
  const i = (annualReturnRate / 12) / 100;
  const fv = monthlyContribution * ((Math.pow(1 + i, months) - 1) / i) * (1 + i);
  return Math.round(fv * 100) / 100;
}

/**
 * Calculates the Compound Annual Growth Rate (CAGR).
 *
 * Formula: CAGR = (End Value / Start Value) ^ (1 / years) - 1
 */
export function calculateCAGR(
  startValue: number,
  endValue: number,
  years: number
): number {
  if (startValue <= 0 || endValue <= 0 || years <= 0) return 0;
  const cagr = Math.pow(endValue / startValue, 1 / years) - 1;
  return cagr * 100; // Return as percentage, e.g., 15.4%
}

/**
 * Compiles a year-by-year growth table for a mixed portfolio (Lumpsum + SIP).
 */
export interface PortfolioProjectionYear {
  year: number;
  investedCapital: number;
  estimatedInterestEarned: number;
  totalValuation: number;
}

export function projectPortfolioGrowth(params: {
  initialLumpsum: number;
  monthlySip: number;
  annualReturnRate: number; // e.g. 12 for 12%
  years: number;
}): PortfolioProjectionYear[] {
  const { initialLumpsum, monthlySip, annualReturnRate, years } = params;
  const projection: PortfolioProjectionYear[] = [];

  let currentValuation = initialLumpsum;
  let totalInvested = initialLumpsum;

  const monthlyRate = (annualReturnRate / 12) / 100;

  for (let y = 1; y <= years; y++) {
    // Standard monthly progression compounding
    for (let m = 1; m <= 12; m++) {
      totalInvested += monthlySip;
      // Add SIP contribution and apply monthly interest
      currentValuation = (currentValuation + monthlySip) * (1 + monthlyRate);
    }

    const estimatedInterestEarned = Math.max(0, currentValuation - totalInvested);

    projection.push({
      year: y,
      investedCapital: Math.round(totalInvested),
      estimatedInterestEarned: Math.round(estimatedInterestEarned),
      totalValuation: Math.round(currentValuation),
    });
  }

  return projection;
}
