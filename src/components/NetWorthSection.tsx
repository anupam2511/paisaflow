/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { FinanceData, NetWorthCategoryConfig } from '../types';
import { formatCurrency, formatCompactCurrency } from '../utils/formatters';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Landmark, 
  Coins, 
  ShieldAlert, 
  HelpCircle, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownRight, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Edit2,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
  X,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';

interface NetWorthSectionProps {
  data: FinanceData;
  setFinanceData: React.Dispatch<React.SetStateAction<FinanceData>>;
  setCurrentTab: (tab: string) => void;
}

export default function NetWorthSection({ data, setFinanceData, setCurrentTab }: NetWorthSectionProps) {
  const { preferences, accounts, investments = [], emis = [], ccEmis = [] } = data;

  // Tabs for trend period selection
  const [trendPeriod, setTrendPeriod] = useState<'1m' | '6m' | '1y' | 'all'>('6m');

  // Interactive inline editing states for manual categories
  const [editingCategoryKey, setEditingCategoryKey] = useState<string | null>(null);
  const [editManualValue, setEditManualValue] = useState<string>('');
  const [inlineError, setInlineError] = useState<string>('');
  const [inlineSuccess, setInlineSuccess] = useState<string>('');

  // Expandable sections
  const [assetsExpanded, setAssetsExpanded] = useState(true);
  const [liabilitiesExpanded, setLiabilitiesExpanded] = useState(true);

  // Retrieve category configurations
  const defaultCategories: NetWorthCategoryConfig[] = useMemo(() => [
    { key: 'bank_accounts', label: 'Bank accounts', isManual: false, manualValue: 0 },
    { key: 'cash', label: 'Cash', isManual: true, manualValue: 15000 },
    { key: 'mutual_funds', label: 'Mutual funds', isManual: false, manualValue: 0 },
    { key: 'stocks', label: 'Stocks', isManual: false, manualValue: 0 },
    { key: 'ppf', label: 'PPF', isManual: false, manualValue: 0 },
    { key: 'nps', label: 'NPS', isManual: true, manualValue: 50000 },
    { key: 'gold', label: 'Gold', isManual: false, manualValue: 0 },
    { key: 'epf', label: 'EPF', isManual: true, manualValue: 180000 },
    { key: 'ssy', label: 'SSY', isManual: true, manualValue: 0 },
    { key: 'fixed_deposits', label: 'Fixed deposits', isManual: true, manualValue: 100000 },
    { key: 'credit_cards', label: 'Credit card outstanding', isManual: false, manualValue: 0 },
    { key: 'emis', label: 'EMIs', isManual: false, manualValue: 0 },
    { key: 'loans', label: 'Loans', isManual: false, manualValue: 0 }
  ], []);

  const activeCategories = useMemo(() => {
    return preferences.netWorthSettings?.categories || defaultCategories;
  }, [preferences.netWorthSettings, defaultCategories]);

  // Dynamic values evaluator
  const getCategoryValue = (key: string, config: NetWorthCategoryConfig) => {
    if (config.isManual) {
      return config.manualValue;
    }

    switch (key) {
      case 'bank_accounts':
        return accounts
          .filter(a => a.type === 'bank')
          .reduce((sum, a) => sum + a.balance, 0);

      case 'cash':
        return config.manualValue;

      case 'mutual_funds':
        return investments
          .filter(i => i.type.toLowerCase().includes('mutual') || i.type === 'mutual_fund' || i.type === 'Mutual Funds')
          .reduce((sum, i) => sum + i.totalInvested, 0);

      case 'stocks':
        return investments
          .filter(i => i.type.toLowerCase().includes('stock') || i.type.toLowerCase().includes('equit') || i.type === 'Stocks & Equities')
          .reduce((sum, i) => sum + i.totalInvested, 0);

      case 'ppf':
        return investments
          .filter(i => i.name.toLowerCase().includes('ppf') || i.type.toLowerCase().includes('ppf') || i.type === 'Government Schemes')
          .reduce((sum, i) => sum + i.totalInvested, 0);

      case 'nps':
        return investments
          .filter(i => i.name.toLowerCase().includes('nps') || i.type.toLowerCase().includes('nps'))
          .reduce((sum, i) => sum + i.totalInvested, 0);

      case 'gold':
        return investments
          .filter(i => i.type.toLowerCase().includes('gold') || i.type === 'Gold Investment')
          .reduce((sum, i) => sum + i.totalInvested, 0);

      case 'epf':
        return investments
          .filter(i => i.name.toLowerCase().includes('epf') || i.type.toLowerCase().includes('epf'))
          .reduce((sum, i) => sum + i.totalInvested, 0);

      case 'ssy':
        return investments
          .filter(i => i.name.toLowerCase().includes('ssy') || i.type.toLowerCase().includes('ssy'))
          .reduce((sum, i) => sum + i.totalInvested, 0);

      case 'fixed_deposits':
        return investments
          .filter(i => i.type.toLowerCase().includes('fixed') || i.type.toLowerCase().includes('deposit') || i.type === 'Fixed Deposits')
          .reduce((sum, i) => sum + i.totalInvested, 0);

      case 'credit_cards':
        return accounts
          .filter(a => a.type === 'credit_card')
          .reduce((sum, a) => sum + a.balance, 0);

      case 'emis':
        return ccEmis
          .filter(e => e.status === 'active')
          .reduce((sum, e) => sum + e.outstandingPrincipal, 0);

      case 'loans':
        return emis
          .filter(e => e.isActive)
          .reduce((sum, e) => {
            const remaining = Math.max(0, e.totalTenure - e.installmentsPaid);
            return sum + (e.amount * remaining);
          }, 0);

      default:
        return 0;
    }
  };

  // Compile active assets and liabilities with values
  const compiledAssets = useMemo(() => {
    const list = activeCategories.filter(cat => 
      ['bank_accounts', 'cash', 'mutual_funds', 'stocks', 'ppf', 'nps', 'gold', 'epf', 'ssy', 'fixed_deposits'].includes(cat.key)
    );
    return list.map(cat => ({
      ...cat,
      value: getCategoryValue(cat.key, cat)
    }));
  }, [activeCategories, accounts, investments, ccEmis, emis]);

  const compiledLiabilities = useMemo(() => {
    const list = activeCategories.filter(cat => 
      ['credit_cards', 'emis', 'loans'].includes(cat.key)
    );
    return list.map(cat => ({
      ...cat,
      value: getCategoryValue(cat.key, cat)
    }));
  }, [activeCategories, accounts, investments, ccEmis, emis]);

  // Aggregate values
  const totalAssetsValue = useMemo(() => compiledAssets.reduce((sum, item) => sum + item.value, 0), [compiledAssets]);
  const totalLiabilitiesValue = useMemo(() => compiledLiabilities.reduce((sum, item) => sum + item.value, 0), [compiledLiabilities]);
  const currentNetWorth = totalAssetsValue - totalLiabilitiesValue;

  // Liability safety ratio calculation
  const liabilityRatio = totalAssetsValue > 0 ? (totalLiabilitiesValue / totalAssetsValue) * 100 : 0;

  // Handle manual category updates
  const handleUpdateManualValue = (key: string) => {
    setInlineError('');
    setInlineSuccess('');
    const numeric = parseFloat(editManualValue);
    if (isNaN(numeric) || numeric < 0) {
      setInlineError('Please enter a valid non-negative numeric amount.');
      return;
    }

    const updatedCategories = activeCategories.map(cat => {
      if (cat.key === key) {
        return { ...cat, manualValue: Math.round(numeric * 100) / 100 };
      }
      return cat;
    });

    setFinanceData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        netWorthSettings: {
          categories: updatedCategories
        }
      }
    }));

    setInlineSuccess('Successfully updated!');
    setTimeout(() => {
      setEditingCategoryKey(null);
      setInlineSuccess('');
    }, 1000);
  };

  // Handle Category Toggle (Auto vs Manual)
  const handleToggleAutoManual = (key: string, currentIsManual: boolean) => {
    // Bank accounts, Credit cards cannot be manual. Cash can't be auto.
    if (key === 'cash') return;

    const updatedCategories = activeCategories.map(cat => {
      if (cat.key === key) {
        return { 
          ...cat, 
          isManual: !currentIsManual,
          // Prefill manual value with current auto value for smooth onboarding
          manualValue: !currentIsManual ? getCategoryValue(key, { ...cat, isManual: false }) : cat.manualValue
        };
      }
      return cat;
    });

    setFinanceData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        netWorthSettings: {
          categories: updatedCategories
        }
      }
    }));
  };

  // Helper for backtracking date calculation
  const getPastDate = (monthsAgo: number, weeksAgo: number = 0): Date => {
    const d = new Date();
    if (monthsAgo > 0) {
      d.setMonth(d.getMonth() - monthsAgo);
    }
    if (weeksAgo > 0) {
      d.setDate(d.getDate() - (weeksAgo * 7));
    }
    return d;
  };

  // Evaluate single historical point on a given date
  const evaluateHistoricalNetWorth = (targetDate: Date) => {
    const targetTime = targetDate.getTime();
    const nowTime = new Date().getTime();
    const today = new Date();
    
    // Get difference in months
    const monthsDiff = (today.getFullYear() - targetDate.getFullYear()) * 12 + (today.getMonth() - targetDate.getMonth());

    // 1. Backtrack Bank accounts balance
    let bankBase = accounts.filter(a => a.type === 'bank').reduce((sum, a) => sum + a.balance, 0);
    const pastExpenses = data.expenses.filter(e => {
      const t = new Date(e.date).getTime();
      return t > targetTime && t <= nowTime;
    });
    const pastIncomes = data.incomes.filter(i => {
      const t = new Date(i.date).getTime();
      return t > targetTime && t <= nowTime;
    });
    const backtrackBank = Math.max(0, bankBase + pastExpenses.reduce((sum, e) => sum + e.amount, 0) - pastIncomes.reduce((sum, i) => sum + i.amount, 0));

    // 2. Backtrack Credit Cards outstanding
    let creditBase = accounts.filter(a => a.type === 'credit_card').reduce((sum, a) => sum + a.balance, 0);
    const pastCcExpenses = data.expenses.filter(e => {
      const isCard = accounts.find(a => a.id === e.accountId)?.type === 'credit_card';
      const t = new Date(e.date).getTime();
      return isCard && t > targetTime && t <= nowTime;
    });
    // going backwards, subtract past charges from card outstanding
    const backtrackCredit = Math.max(0, creditBase - pastCcExpenses.reduce((sum, e) => sum + e.amount, 0));

    // Compute Assets
    let assetSum = 0;
    let liabilitySum = 0;

    activeCategories.forEach(cat => {
      const isAsset = ['bank_accounts', 'cash', 'mutual_funds', 'stocks', 'ppf', 'nps', 'gold', 'epf', 'ssy', 'fixed_deposits'].includes(cat.key);
      
      if (isAsset) {
        if (cat.key === 'bank_accounts') {
          assetSum += backtrackBank;
        } else if (cat.isManual || cat.key === 'cash') {
          // Cash, NPS, EPF, SSY, FDs (if manual) decreases gradually backwards (e.g. 0.4% compound per month) to show organic saving growth
          assetSum += cat.manualValue * Math.pow(1 - 0.005, Math.max(0, monthsDiff));
        } else {
          // Auto calculated Investments (Mutual Funds, Stocks, PPF, NPS, Gold, EPF, SSY, FDs)
          // Look at specific active investment items, subtract past months compound growth
          let invCatSum = 0;
          investments.forEach(inv => {
            const isMatch = (
              (cat.key === 'mutual_funds' && (inv.type.toLowerCase().includes('mutual') || inv.type === 'mutual_fund' || inv.type === 'Mutual Funds')) ||
              (cat.key === 'stocks' && (inv.type.toLowerCase().includes('stock') || inv.type.toLowerCase().includes('equit') || inv.type === 'Stocks & Equities')) ||
              (cat.key === 'ppf' && (inv.name.toLowerCase().includes('ppf') || inv.type.toLowerCase().includes('ppf') || inv.type === 'Government Schemes')) ||
              (cat.key === 'nps' && (inv.name.toLowerCase().includes('nps') || inv.type.toLowerCase().includes('nps'))) ||
              (cat.key === 'gold' && (inv.type.toLowerCase().includes('gold') || inv.type === 'Gold Investment')) ||
              (cat.key === 'epf' && (inv.name.toLowerCase().includes('epf') || inv.type.toLowerCase().includes('epf'))) ||
              (cat.key === 'ssy' && (inv.name.toLowerCase().includes('ssy') || inv.type.toLowerCase().includes('ssy'))) ||
              (cat.key === 'fixed_deposits' && (inv.type.toLowerCase().includes('fixed') || inv.type.toLowerCase().includes('deposit') || inv.type === 'Fixed Deposits'))
            );

            if (isMatch) {
              if (targetDate < new Date(inv.startDate)) return;
              invCatSum += inv.totalInvested * Math.pow(1 - 0.008, Math.max(0, monthsDiff));
            }
          });
          assetSum += invCatSum;
        }
      } else {
        // Liabilities
        if (cat.key === 'credit_cards') {
          liabilitySum += backtrackCredit;
        } else if (cat.isManual) {
          liabilitySum += cat.manualValue * Math.pow(1 - 0.003, Math.max(0, monthsDiff));
        } else if (cat.key === 'emis') {
          // CC EMIs backtracked
          let ccEmiSum = 0;
          ccEmis.forEach(emi => {
            if (emi.status === 'active') {
              if (targetDate < new Date(emi.startDate)) return;
              const estPaidBackwards = (emi.financedAmount / emi.tenure) * monthsDiff;
              ccEmiSum += Math.min(emi.financedAmount, emi.outstandingPrincipal + estPaidBackwards);
            }
          });
          liabilitySum += ccEmiSum;
        } else if (cat.key === 'loans') {
          // Standard Loans backtracked
          let loanSum = 0;
          emis.forEach(emi => {
            if (emi.isActive) {
              const emiStart = new Date(emi.startDate + '-01');
              if (targetDate < emiStart) return;
              const remaining = Math.max(0, emi.totalTenure - emi.installmentsPaid);
              const pastRemaining = Math.min(emi.totalTenure, remaining + monthsDiff);
              loanSum += emi.amount * pastRemaining;
            }
          });
          liabilitySum += loanSum;
        }
      }
    });

    return {
      dateString: targetDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      assets: Math.round(assetSum),
      liabilities: Math.round(liabilitySum),
      netWorth: Math.round(assetSum - liabilitySum)
    };
  };

  // Compile full Trend series
  const trendData = useMemo(() => {
    const list = [];
    const today = new Date();

    if (trendPeriod === '1m') {
      // 5 weekly points
      for (let i = 4; i >= 0; i--) {
        const d = getPastDate(0, i);
        const dataPoint = evaluateHistoricalNetWorth(d);
        // Replace label with a weekly coordinate
        dataPoint.dateString = `Wk -${i}`;
        if (i === 0) dataPoint.dateString = 'Today';
        list.push(dataPoint);
      }
    } else if (trendPeriod === '6m') {
      // 6 monthly points
      for (let i = 5; i >= 0; i--) {
        const d = getPastDate(i);
        list.push(evaluateHistoricalNetWorth(d));
      }
    } else if (trendPeriod === '1y') {
      // 12 monthly points
      for (let i = 11; i >= 0; i--) {
        const d = getPastDate(i);
        list.push(evaluateHistoricalNetWorth(d));
      }
    } else {
      // All time: 24 monthly points
      for (let i = 23; i >= 0; i--) {
        const d = getPastDate(i);
        list.push(evaluateHistoricalNetWorth(d));
      }
    }
    return list;
  }, [trendPeriod, activeCategories, accounts, investments, ccEmis, emis, data.expenses, data.incomes]);

  // Calculate Monthly Growth (Current vs 1 Month Ago)
  const monthlyGrowthInfo = useMemo(() => {
    const prevMonthPoint = evaluateHistoricalNetWorth(getPastDate(1));
    const currentPoint = evaluateHistoricalNetWorth(new Date());

    const absoluteGrowth = currentPoint.netWorth - prevMonthPoint.netWorth;
    const percentageGrowth = prevMonthPoint.netWorth !== 0 
      ? (absoluteGrowth / Math.abs(prevMonthPoint.netWorth)) * 100 
      : 0;

    return {
      absolute: absoluteGrowth,
      percent: percentageGrowth,
      isPositive: absoluteGrowth >= 0
    };
  }, [activeCategories, accounts, investments, ccEmis, emis, data.expenses, data.incomes]);

  // Asset allocation pie data (filter out items with zero value)
  const assetAllocationData = useMemo(() => {
    return compiledAssets
      .filter(item => item.value > 0)
      .map(item => ({
        name: item.label,
        value: item.value
      }));
  }, [compiledAssets]);

  // Modern material colors for visual rhythm
  const assetColors = ['#4f46e5', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6', '#f43f5e', '#6366f1', '#06b6d4'];

  return (
    <div className="space-y-6">
      
      {/* HEADER SEGMENT */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            <Landmark className="w-5.5 h-5.5 text-indigo-500 shrink-0" />
            Comprehensive Net Worth Dashboard
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track your combined balance sheets, liquid reserves, investment portfolios, and amortizing loan profiles in a unified wealth view.
          </p>
        </div>

        {/* Quick action: jump to preferences to manage categories */}
        <button
          onClick={() => setCurrentTab('settings')}
          className="self-start md:self-auto bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs py-2 px-3.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
        >
          <Settings className="w-3.5 h-3.5" /> Configure Net Worth Settings
        </button>
      </div>

      {/* CORE STAT CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Stat Card 1: Net Worth */}
        <div className="bg-white dark:bg-[#0b1329] border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl"></div>
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest block">Aggregate Net Worth</span>
            <span className={`text-2xl sm:text-3xl font-black font-mono block mt-2 tracking-tight ${currentNetWorth >= 0 ? 'text-indigo-600 dark:text-indigo-450' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(currentNetWorth, preferences, 0)}
            </span>
          </div>
          <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
              <span>Assets:</span>
              <span className="font-bold font-mono text-slate-850 dark:text-slate-200">{formatCompactCurrency(totalAssetsValue, preferences)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
              <span>Debt:</span>
              <span className="font-bold font-mono text-rose-600 dark:text-rose-450">{formatCompactCurrency(totalLiabilitiesValue, preferences)}</span>
            </div>
          </div>
        </div>

        {/* Stat Card 2: Growth */}
        <div className="bg-white dark:bg-[#0b1329] border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest block">Monthly Net Worth Growth</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className={`text-2xl sm:text-3xl font-black font-mono block tracking-tight ${monthlyGrowthInfo.isPositive ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-600 dark:text-rose-450'}`}>
                {monthlyGrowthInfo.isPositive ? '+' : ''}{formatCurrency(monthlyGrowthInfo.absolute, preferences, 0)}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">From previous month</span>
            <span className={`inline-flex items-center gap-0.5 font-bold px-2 py-0.5 rounded-lg text-[10px] uppercase font-sans ${
              monthlyGrowthInfo.isPositive 
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30' 
                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100/30 dark:border-rose-900/30'
            }`}>
              {monthlyGrowthInfo.isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {monthlyGrowthInfo.percent.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Stat Card 3: Debt/Liability Ratio */}
        <div className="bg-white dark:bg-[#0b1329] border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest block">Debt-to-Asset Leverage Ratio</span>
            <span className="text-2xl sm:text-3xl font-black font-mono block mt-2 tracking-tight text-slate-800 dark:text-slate-200">
              {liabilityRatio.toFixed(1)}%
            </span>
          </div>
          <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Risk exposure status</span>
            <span className={`font-bold uppercase text-[9px] px-2 py-0.5 rounded-lg border ${
              liabilityRatio < 20 
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
                : liabilityRatio < 45
                ? 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400 border-yellow-100 dark:border-yellow-900/30'
                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30'
            }`}>
              {liabilityRatio < 20 ? 'Optimal (Conservative)' : liabilityRatio < 45 ? 'Moderate Leverage' : 'Critical Exposure Warning'}
            </span>
          </div>
        </div>

      </div>

      {/* TREND CHART & ALLOCATION AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Trend Area Chart (8 Columns on desktop) */}
        <div className="bg-white dark:bg-[#0b1329] border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs lg:col-span-8 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-slate-50 dark:border-slate-800/50 pb-4">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-550" /> Net Worth Trajectory
            </span>

            {/* Time period switcher */}
            <div className="flex bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 shrink-0 self-start sm:self-auto">
              {(['1m', '6m', '1y', 'all'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setTrendPeriod(p)}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-md transition cursor-pointer uppercase ${
                    trendPeriod === p
                      ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-xs'
                      : 'text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'
                  }`}
                >
                  {p === '1m' ? '1 Month' : p === '6m' ? '6 Months' : p === '1y' ? '1 Year' : 'All Time'}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-indigo-500, #4f46e5)" stopOpacity={0.18}/>
                    <stop offset="95%" stopColor="var(--color-indigo-500, #4f46e5)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.15} />
                <XAxis 
                  dataKey="dateString" 
                  tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  tickFormatter={(val) => formatCompactCurrency(val, preferences)} 
                  tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <Tooltip 
                  formatter={(value: any) => [formatCurrency(value, preferences, 0), 'Net Worth']}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    borderRadius: '12px',
                    border: '1px solid #1e293b',
                    padding: '8px 12px',
                  }}
                  labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 'bold' }}
                  itemStyle={{ color: '#f8fafc', fontSize: '11px', fontWeight: 'bold', fontFamily: 'monospace' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="netWorth" 
                  stroke="var(--color-indigo-600, #4f46e5)" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorNetWorth)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asset Allocation Pie Chart (4 Columns on desktop) */}
        <div className="bg-white dark:bg-[#0b1329] border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs lg:col-span-4 flex flex-col justify-between">
          <div className="border-b border-slate-50 dark:border-slate-800/50 pb-4 mb-4">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-emerald-550" /> Asset Allocation
            </span>
          </div>

          {assetAllocationData.length > 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center">
              <div className="h-[180px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={assetAllocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {assetAllocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={assetColors[index % assetColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => formatCurrency(value, preferences, 0)}
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        borderRadius: '8px',
                        border: '1px solid #1e293b',
                        padding: '6px 10px',
                      }}
                      itemStyle={{ color: '#f8fafc', fontSize: '10px', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center readouts */}
                <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none">
                  <span className="text-[8px] text-slate-400 dark:text-slate-550 font-black uppercase tracking-wider block">Total Portfolio</span>
                  <span className="text-sm font-black font-mono text-slate-800 dark:text-slate-100 block mt-0.5">
                    {formatCompactCurrency(totalAssetsValue, preferences)}
                  </span>
                </div>
              </div>

              {/* Legend checklist */}
              <div className="w-full mt-4 max-h-[100px] overflow-y-auto space-y-1.5 pr-1">
                {assetAllocationData.map((item, idx) => {
                  const pct = totalAssetsValue > 0 ? (item.value / totalAssetsValue) * 100 : 0;
                  return (
                    <div key={item.name} className="flex items-center justify-between text-[10px] font-bold text-slate-650 dark:text-slate-350">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: assetColors[idx % assetColors.length] }}></span>
                        <span className="truncate max-w-[120px]" title={item.name}>{item.name}</span>
                      </div>
                      <span className="font-mono text-slate-500 dark:text-slate-400">{pct.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-center p-6 py-12">
              <AlertCircle className="w-8 h-8 text-slate-300 mb-2 animate-pulse" />
              <p className="text-xs font-bold text-slate-400">No assets configured yet.</p>
              <p className="text-[10px] text-slate-400/80 mt-1">Configure asset overrides or add investments to see values.</p>
            </div>
          )}
        </div>

      </div>

      {/* COMPREHENSIVE BALANCES LEDGERS (ASSETS VS LIABILITIES) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        {/* ASSET LEDGER CARD */}
        <div className="bg-white dark:bg-[#0b1329] border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-xs overflow-hidden">
          <button 
            onClick={() => setAssetsExpanded(!assetsExpanded)}
            className="w-full px-5 py-4 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
          >
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-extrabold">
              <Landmark className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> 
              <span>Assets Balance Sheet</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-extrabold">{formatCurrency(totalAssetsValue, preferences, 0)}</span>
              {assetsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {assetsExpanded && (
            <div className="p-4 space-y-2 animate-fade-in divide-y divide-slate-100/50 dark:divide-slate-800/30">
              {compiledAssets.map((item) => {
                const isEditing = editingCategoryKey === item.key;
                const canToggle = item.key !== 'cash';

                return (
                  <div key={item.key} className="pt-3.5 first:pt-0 pb-1 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-100">{item.label}</span>
                        
                        {/* Source helper text */}
                        <div className="text-[9px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">
                          {item.key === 'bank_accounts' && 'Sum of active Savings and Checking accounts'}
                          {item.key === 'cash' && 'Liquid physical currency reserves'}
                          {item.key === 'mutual_funds' && 'SIP portfolio value'}
                          {item.key === 'stocks' && 'Equity brokerage holding values'}
                          {item.key === 'ppf' && 'Tax-free Provident Fund holding value'}
                          {item.key === 'nps' && 'National Pension System balances'}
                          {item.key === 'gold' && 'Precious metal holding values'}
                          {item.key === 'epf' && 'Accrued Employee Provident Fund'}
                          {item.key === 'ssy' && 'Sukanya Samriddhi Scheme balances'}
                          {item.key === 'fixed_deposits' && 'Bank Term Deposit portfolios'}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Auto/Manual toggle button */}
                        {canToggle ? (
                          <button
                            onClick={() => handleToggleAutoManual(item.key, item.isManual)}
                            className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border tracking-wider transition cursor-pointer flex items-center gap-0.5 ${
                              item.isManual
                                ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/20'
                                : 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/20'
                            }`}
                            title={`Toggle between Automatic Ledger tracking and Manual overriding.`}
                          >
                            {item.isManual ? <Unlock className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                            {item.isManual ? 'Manual Override' : 'Auto Tracking'}
                          </button>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase border tracking-wider bg-slate-50 dark:bg-slate-900 text-slate-400 border-slate-150 dark:border-slate-800">
                            {item.key === 'cash' ? 'Manual Value' : 'Auto Only'}
                          </span>
                        )}

                        {/* Category current balance value */}
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{formatCurrency(item.value, preferences, 0)}</span>
                          
                          {/* Inline manual edit trigger */}
                          {item.isManual && !isEditing && (
                            <button
                              onClick={() => {
                                setEditingCategoryKey(item.key);
                                setEditManualValue(item.value.toString());
                              }}
                              className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-300 p-0.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition cursor-pointer"
                              title="Edit current balance"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Inline editor panel */}
                    {isEditing && (
                      <div className="mt-1 bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-150 dark:border-slate-800/80 space-y-2 animate-fade-in text-left">
                        <div className="flex items-center gap-2">
                          <div className="relative flex-grow">
                            <span className="absolute left-2.5 top-1.5 text-[10px] font-bold text-slate-400">{preferences.currencySymbol}</span>
                            <input
                              type="number"
                              value={editManualValue}
                              onChange={(e) => setEditManualValue(e.target.value)}
                              placeholder="Enter current balance"
                              className="w-full text-xs font-bold font-mono pl-6 pr-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <button
                            onClick={() => handleUpdateManualValue(item.key)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingCategoryKey(null)}
                            className="text-slate-450 hover:text-slate-600 dark:hover:text-slate-350 p-1 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {inlineError && <p className="text-[9px] text-rose-600 font-bold">{inlineError}</p>}
                        {inlineSuccess && <p className="text-[9px] text-emerald-600 font-bold">{inlineSuccess}</p>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* LIABILITY LEDGER CARD */}
        <div className="bg-white dark:bg-[#0b1329] border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-xs overflow-hidden">
          <button 
            onClick={() => setLiabilitiesExpanded(!liabilitiesExpanded)}
            className="w-full px-5 py-4 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
          >
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-extrabold">
              <ShieldAlert className="w-4 h-4 text-rose-500 dark:text-rose-400" /> 
              <span>Liabilities Ledger</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-rose-600 dark:text-rose-400 font-extrabold">{formatCurrency(totalLiabilitiesValue, preferences, 0)}</span>
              {liabilitiesExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {liabilitiesExpanded && (
            <div className="p-4 space-y-2 animate-fade-in divide-y divide-slate-100/50 dark:divide-slate-800/30">
              {compiledLiabilities.map((item) => {
                const isEditing = editingCategoryKey === item.key;

                return (
                  <div key={item.key} className="pt-3.5 first:pt-0 pb-1 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-100">{item.label}</span>
                        
                        <div className="text-[9px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">
                          {item.key === 'credit_cards' && 'Combined outstanding dues across all logged cards'}
                          {item.key === 'emis' && 'Total active Credit Card installment plans outstanding principal'}
                          {item.key === 'loans' && 'Amortizing mortgage/housing and term loan remaining principal value'}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Auto/Manual toggle button */}
                        <button
                          onClick={() => handleToggleAutoManual(item.key, item.isManual)}
                          className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border tracking-wider transition cursor-pointer flex items-center gap-0.5 ${
                            item.isManual
                              ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/20'
                              : 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/20'
                          }`}
                          title={`Toggle between Automatic Ledger tracking and Manual overriding.`}
                        >
                          {item.isManual ? <Unlock className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                          {item.isManual ? 'Manual Override' : 'Auto Tracking'}
                        </button>

                        {/* Category current outstanding value */}
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{formatCurrency(item.value, preferences, 0)}</span>
                          
                          {/* Inline manual edit trigger */}
                          {item.isManual && !isEditing && (
                            <button
                              onClick={() => {
                                setEditingCategoryKey(item.key);
                                setEditManualValue(item.value.toString());
                              }}
                              className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-300 p-0.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition cursor-pointer"
                              title="Edit current balance"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Inline editor panel */}
                    {isEditing && (
                      <div className="mt-1 bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-150 dark:border-slate-800/80 space-y-2 animate-fade-in text-left">
                        <div className="flex items-center gap-2">
                          <div className="relative flex-grow">
                            <span className="absolute left-2.5 top-1.5 text-[10px] font-bold text-slate-400">{preferences.currencySymbol}</span>
                            <input
                              type="number"
                              value={editManualValue}
                              onChange={(e) => setEditManualValue(e.target.value)}
                              placeholder="Enter current balance"
                              className="w-full text-xs font-bold font-mono pl-6 pr-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <button
                            onClick={() => handleUpdateManualValue(item.key)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingCategoryKey(null)}
                            className="text-slate-450 hover:text-slate-600 dark:hover:text-slate-350 p-1 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {inlineError && <p className="text-[9px] text-rose-600 font-bold">{inlineError}</p>}
                        {inlineSuccess && <p className="text-[9px] text-emerald-600 font-bold">{inlineSuccess}</p>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* EDUCATIONAL INFORMATION FOOTER PANEL */}
      <div className="p-4 bg-indigo-50/40 dark:bg-slate-900/40 border border-indigo-100/60 dark:border-slate-800/60 rounded-xl flex items-start gap-3 text-left">
        <Info className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <h4 className="text-[10.5px] font-bold text-indigo-950 dark:text-slate-200 uppercase tracking-widest">A Note on Dynamic Net Worth Tracking</h4>
          <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed font-semibold">
            PaisaFlow automatically monitors and calculates your assets and liabilities in real-time. Where detailed historical records do not exist, we construct a mathematically precise trendline using your past incomes, expenditures, and compound growth schedules. Toggle categories to <strong>Manual Override</strong> if you want to explicitly declare asset holding values like Cash, NPS, SSY, or EPF!
          </p>
        </div>
      </div>

    </div>
  );
}
