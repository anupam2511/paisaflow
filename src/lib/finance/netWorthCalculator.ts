/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  FinancialAccount,
  Investment,
  CreditCardEmiMaster,
  EmiItem,
  NetWorthCategoryConfig,
} from '../../types';

export interface CompiledNetWorthItem {
  key: string;
  label: string;
  isManual: boolean;
  manualValue: number;
  value: number;
}

export interface NetWorthAnalysis {
  compiledAssets: CompiledNetWorthItem[];
  compiledLiabilities: CompiledNetWorthItem[];
  totalAssetsValue: number;
  totalLiabilitiesValue: number;
  currentNetWorth: number;
  liabilityRatio: number; // e.g. 15 representing 15%
}

/**
 * Calculates value for a single net worth category based on portfolio state
 */
export function calculateCategoryValue(params: {
  key: string;
  config: NetWorthCategoryConfig;
  accounts: FinancialAccount[];
  investments: Investment[];
  ccEmis: CreditCardEmiMaster[];
  emis: EmiItem[];
}): number {
  const { key, config, accounts = [], investments = [], ccEmis = [], emis = [] } = params;

  if (config.isManual) {
    return config.manualValue;
  }

  const normalizedKey = key.toLowerCase();

  switch (normalizedKey) {
    case 'bank_accounts':
      return accounts
        .filter((a) => a.type === 'bank')
        .reduce((sum, a) => sum + a.balance, 0);

    case 'cash':
      return config.manualValue;

    case 'mutual_funds':
      return investments
        .filter(
          (i) =>
            i.type.toLowerCase().includes('mutual') ||
            i.type === 'mutual_fund' ||
            i.type === 'Mutual Funds'
        )
        .reduce((sum, i) => sum + i.totalInvested, 0);

    case 'stocks':
      return investments
        .filter(
          (i) =>
            i.type.toLowerCase().includes('stock') ||
            i.type.toLowerCase().includes('equit') ||
            i.type === 'Stocks & Equities'
        )
        .reduce((sum, i) => sum + i.totalInvested, 0);

    case 'ppf':
      return investments
        .filter(
          (i) =>
            i.name.toLowerCase().includes('ppf') ||
            i.type.toLowerCase().includes('ppf') ||
            i.type === 'Government Schemes'
        )
        .reduce((sum, i) => sum + i.totalInvested, 0);

    case 'nps':
      return investments
        .filter(
          (i) =>
            i.name.toLowerCase().includes('nps') || i.type.toLowerCase().includes('nps')
        )
        .reduce((sum, i) => sum + i.totalInvested, 0);

    case 'gold':
      return investments
        .filter((i) => i.type.toLowerCase().includes('gold') || i.type === 'Gold Investment')
        .reduce((sum, i) => sum + i.totalInvested, 0);

    case 'epf':
      return investments
        .filter(
          (i) =>
            i.name.toLowerCase().includes('epf') || i.type.toLowerCase().includes('epf')
        )
        .reduce((sum, i) => sum + i.totalInvested, 0);

    case 'ssy':
      return investments
        .filter(
          (i) =>
            i.name.toLowerCase().includes('ssy') || i.type.toLowerCase().includes('ssy')
        )
        .reduce((sum, i) => sum + i.totalInvested, 0);

    case 'fixed_deposits':
      return investments
        .filter(
          (i) =>
            i.type.toLowerCase().includes('fixed') ||
            i.type.toLowerCase().includes('deposit') ||
            i.type === 'Fixed Deposits'
        )
        .reduce((sum, i) => sum + i.totalInvested, 0);

    case 'credit_cards':
      return accounts
        .filter((a) => a.type === 'credit_card')
        .reduce((sum, a) => sum + a.balance, 0);

    case 'emis':
      return ccEmis
        .filter((e) => e.status === 'active')
        .reduce((sum, e) => sum + e.outstandingPrincipal, 0);

    case 'loans':
      return emis
        .filter((e) => e.isActive)
        .reduce((sum, e) => {
          const remaining = Math.max(0, e.totalTenure - e.installmentsPaid);
          return sum + e.amount * remaining;
        }, 0);

    default:
      return 0;
  }
}

/**
 * Performs a comprehensive net worth valuation breakdown
 */
export function analyzeNetWorth(params: {
  categories: NetWorthCategoryConfig[];
  accounts: FinancialAccount[];
  investments: Investment[];
  ccEmis: CreditCardEmiMaster[];
  emis: EmiItem[];
}): NetWorthAnalysis {
  const { categories, accounts, investments, ccEmis, emis } = params;

  const compileItem = (cat: NetWorthCategoryConfig): CompiledNetWorthItem => {
    const value = calculateCategoryValue({
      key: cat.key,
      config: cat,
      accounts,
      investments,
      ccEmis,
      emis,
    });
    return {
      key: cat.key,
      label: cat.label,
      isManual: cat.isManual,
      manualValue: cat.manualValue,
      value,
    };
  };

  const assetKeys = [
    'bank_accounts',
    'cash',
    'mutual_funds',
    'stocks',
    'ppf',
    'nps',
    'gold',
    'epf',
    'ssy',
    'fixed_deposits',
  ];
  const liabilityKeys = ['credit_cards', 'emis', 'loans'];

  const compiledAssets = categories
    .filter((cat) => assetKeys.includes(cat.key.toLowerCase()))
    .map(compileItem);

  const compiledLiabilities = categories
    .filter((cat) => liabilityKeys.includes(cat.key.toLowerCase()))
    .map(compileItem);

  const totalAssetsValue = compiledAssets.reduce((sum, item) => sum + item.value, 0);
  const totalLiabilitiesValue = compiledLiabilities.reduce((sum, item) => sum + item.value, 0);
  const currentNetWorth = totalAssetsValue - totalLiabilitiesValue;
  
  const liabilityRatio = totalAssetsValue > 0 ? (totalLiabilitiesValue / totalAssetsValue) * 100 : 0;

  return {
    compiledAssets,
    compiledLiabilities,
    totalAssetsValue,
    totalLiabilitiesValue,
    currentNetWorth,
    liabilityRatio,
  };
}
