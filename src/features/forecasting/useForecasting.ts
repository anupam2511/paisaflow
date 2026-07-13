/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useFinance } from '../../context/FinanceContext';

export function useForecasting() {
  const { financeData } = useFinance();

  // Computes generic wealth forecasts based on current accounts, goals, and income.
  const getForecastStats = () => {
    const bankAccounts = financeData.accounts.filter(a => a.type === 'bank');
    const creditCards = financeData.accounts.filter(a => a.type === 'credit_card');
    const liquid = bankAccounts.reduce((sum, a) => sum + a.balance, 0);
    const debt = creditCards.reduce((sum, a) => sum + a.balance, 0);
    const netWorth = liquid - debt;

    const monthlyIncome = financeData.incomes
      .filter((inc) => inc.frequency === 'monthly')
      .reduce((sum, inc) => sum + inc.amount, 0);

    const monthlyExpenses = financeData.expenses
      .filter((exp) => exp.category.toLowerCase() !== 'transfer')
      .reduce((sum, exp) => sum + exp.amount, 0); // basic total historical

    return {
      currentNetWorth: netWorth,
      monthlyIncome,
      estimatedMonthlyExpenses: monthlyExpenses,
    };
  };

  return {
    getForecastStats,
  };
}
