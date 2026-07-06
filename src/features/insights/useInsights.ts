/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import { useMemo } from 'react';
import { FinanceData, FinancialInsight } from './insight.types';
import { generateFinancialInsights } from './insightEngine';

/**
 * Custom hook to generate real-time financial intelligence insights
 * from the active finance data context state.
 */
export function useInsights(data: FinanceData): FinancialInsight[] {
  return useMemo(() => {
    if (!data) return [];
    return generateFinancialInsights(data);
  }, [data]);
}
