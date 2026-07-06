/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ProjectionDataPoint {
  monthIndex: number;
  label: string;
  CashReserves: number;
  InvestmentShares: number;
  'Balanced Net Worth': number;
  'Optimistic Outlook (ROI +3%)': number;
  'Conservative Outlook (ROI -3%)': number;
}

export interface GenerateProjectionParams {
  currentLiquid: number;
  currentDebt: number;
  currentInvestmentsValue: number;
  expectedIncome: number;
  expectedExpenses: number;
  expectedSip: number;
  expectedRoi: number; // e.g. 12 representing 12%
  projectionPeriods: number; // months, e.g. 36
  liquidGrowthRate: number; // e.g. 3.5 representing 3.5%
}

/**
 * Calculates compound monthly trajectories for liquid balances and investment shares.
 */
export function generateWealthProjection(params: GenerateProjectionParams): ProjectionDataPoint[] {
  const {
    currentLiquid,
    currentDebt,
    currentInvestmentsValue,
    expectedIncome,
    expectedExpenses,
    expectedSip,
    expectedRoi,
    projectionPeriods,
    liquidGrowthRate,
  } = params;

  const list: ProjectionDataPoint[] = [];
  let cumulativeCash = currentLiquid - currentDebt;
  let cumulativeInvestments = currentInvestmentsValue;

  // Projected alternate paths
  let cumulativeInvestmentsOptimistic = currentInvestmentsValue;
  let cumulativeInvestmentsConservative = currentInvestmentsValue;

  const monthlyRoi = expectedRoi / 100 / 12;
  const monthlyRoiOptimistic = (expectedRoi + 3) / 100 / 12;
  const monthlyRoiConservative = (expectedRoi - 3) / 100 / 12;

  const monthlyLiquidGrowth = liquidGrowthRate / 100 / 12;

  // Net cash saved monthly after accounting for SIP
  const netMonthlySavings = expectedIncome - expectedExpenses - expectedSip;

  const now = new Date();

  for (let m = 0; m <= projectionPeriods; m++) {
    const futureDate = new Date(now.getFullYear(), now.getMonth() + m, 1);
    const label = futureDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

    if (m > 0) {
      // Growth on Liquid balances
      cumulativeCash = cumulativeCash * (1 + monthlyLiquidGrowth) + netMonthlySavings;

      // Compounding on Investment Portfolio
      cumulativeInvestments = (cumulativeInvestments + expectedSip) * (1 + monthlyRoi);
      cumulativeInvestmentsOptimistic = (cumulativeInvestmentsOptimistic + expectedSip) * (1 + monthlyRoiOptimistic);
      cumulativeInvestmentsConservative = (cumulativeInvestmentsConservative + expectedSip) * (1 + monthlyRoiConservative);
    }

    const totalNetWorth = Math.round(cumulativeCash + cumulativeInvestments);
    const totalNetWorthOptimistic = Math.round(cumulativeCash + cumulativeInvestmentsOptimistic);
    const totalNetWorthConservative = Math.round(cumulativeCash + cumulativeInvestmentsConservative);

    list.push({
      monthIndex: m,
      label,
      CashReserves: Math.round(cumulativeCash),
      InvestmentShares: Math.round(cumulativeInvestments),
      'Balanced Net Worth': totalNetWorth,
      'Optimistic Outlook (ROI +3%)': totalNetWorthOptimistic,
      'Conservative Outlook (ROI -3%)': totalNetWorthConservative,
    });
  }

  return list;
}
