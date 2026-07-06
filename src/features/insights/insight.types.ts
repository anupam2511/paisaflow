/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import { FinanceData } from '../../types';

export type { FinanceData };

export type InsightType = 'critical' | 'warning' | 'info' | 'success';

export type InsightCategory = 'credit' | 'emergency' | 'debt' | 'budget' | 'savings';

export interface FinancialInsight {
  id: string;
  type: InsightType;
  category: InsightCategory;
  title: string;
  description: string;
  impact?: string; // e.g. "Could reduce reported utilization by 52%"
  actionLabel?: string;
  actionTab?: string; // Tab to navigate to for resolution
  metadata?: {
    cardId?: string;
    cardName?: string;
    amountToPay?: number;
    utilizationPercent?: number;
    currentMonths?: number;
    deficitAmount?: number;
    budgetCategory?: string;
    spentAmount?: number;
    limitAmount?: number;
    emiRatio?: number;
  };
}
