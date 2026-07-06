/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import { FinanceData, FinancialInsight } from './insight.types';
import { activeRules } from './insightRules';

/**
 * Executes all intelligence rules against the user's financial ledger
 * and aggregates them sorted by severity priority.
 */
export function generateFinancialInsights(data: FinanceData): FinancialInsight[] {
  let aggregatedInsights: FinancialInsight[] = [];

  for (const rule of activeRules) {
    try {
      const insights = rule.evaluate(data);
      aggregatedInsights = [...aggregatedInsights, ...insights];
    } catch (error) {
      console.error(`Error running financial intelligence rule '${rule.id}':`, error);
    }
  }

  // Priority scale mapping
  const severityScore: Record<string, number> = {
    critical: 0,
    warning: 1,
    info: 2,
    success: 3
  };

  return aggregatedInsights.sort((a, b) => {
    return (severityScore[a.type] ?? 99) - (severityScore[b.type] ?? 99);
  });
}
