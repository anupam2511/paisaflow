/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CcTransaction {
  id: string;
  cardId: string;
  type: 'purchase' | 'refund' | 'emi_conversion' | 'bill_payment';
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category?: string; // Spend category
}
