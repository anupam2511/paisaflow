/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SavingGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  category: string;
  goalType?: 'flexible' | 'fixed' | 'investment';
  installmentAmount?: number;
  totalInstallments?: number;
  paidInstallments?: number;
  startDate?: string; // YYYY-MM-DD
}
