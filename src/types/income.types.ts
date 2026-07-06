/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Income {
  id: string;
  source: string;     // e.g., "Software Engineer Salary", "Freelance Web Design"
  amount: number;
  frequency: 'monthly' | 'one-time';
  date: string;       // YYYY-MM-DD
}
