/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ForecastProjectionPoint {
  month: string; // e.g., "Jan 2027"
  projectedLiquid: number;
  projectedDebt: number;
  projectedNetWorth: number;
  projectedInvestments: number;
}

export interface ForecastParams {
  monthsToProject: number;
  expectedInflationRate: number; // e.g. 6.0 representing 6%
  expectedInvestmentReturnRate: number; // e.g. 12.0 representing 12%
}
