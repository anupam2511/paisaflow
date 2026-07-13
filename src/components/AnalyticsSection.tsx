/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { FinanceData } from '../types';
import { formatCurrency, formatCompactCurrency } from '../utils/formatters';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  Legend,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  ReferenceLine
} from 'recharts';
import { 
  Award, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  PieChart as PieIcon, 
  ShieldCheck, 
  Sparkles, 
  Copy, 
  Check, 
  Target, 
  Coins, 
  Wallet, 
  Info, 
  Layers, 
  Clock, 
  AlertTriangle, 
  Flame, 
  ArrowRightLeft,
  DollarSign
} from 'lucide-react';
import { motion } from 'motion/react';
import { CHART_THEME } from './charts/ChartContainer';

interface AnalyticsSectionProps {
  data: FinanceData;
  setCurrentTab: (tab: string) => void;
  initialSubTab?: 'overview' | 'trends' | 'compare' | 'anomalies';
}

export default function AnalyticsSection({ data, setCurrentTab, initialSubTab }: AnalyticsSectionProps) {
  const { 
    preferences, 
    accounts = [], 
    incomes = [], 
    expenses = [], 
    investments = [], 
    emis = [], 
    ccEmis = [],
    savingGoals = []
  } = data;

  const currencySymbol = preferences.currencySymbol || '₹';

  // Subtab State
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'trends' | 'compare' | 'anomalies'>(initialSubTab || 'overview');
  const [selectedYear, setSelectedYear] = useState<string>(() => new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);

  // --- DYNAMIC 12-MONTH CHRONOLOGICAL CALCULATIONS ---
  const fullTrendData = useMemo(() => {
    const monthMap: Record<string, {
      monthStr: string;
      monthName: string;
      income: number;
      expense: number;
      savings: number;
      savingsRate: number;
      categorySpends: Record<string, number>;
      emiBurden: number;
      creditUtilAmount: number;
      investmentContribution: number;
      netWorth: number;
    }> = {};

    const yearsToCover = new Set<string>();
    yearsToCover.add(selectedYear);
    incomes.forEach(i => i.date && yearsToCover.add(i.date.slice(0, 4)));
    expenses.forEach(e => e.date && yearsToCover.add(e.date.slice(0, 4)));

    // Initialize months
    Array.from(yearsToCover).sort().forEach(yr => {
      for (let m = 1; m <= 12; m++) {
        const mStr = `${yr}-${m.toString().padStart(2, '0')}`;
        const dateObj = new Date(yr + '-' + m.toString().padStart(2, '0') + '-02');
        const mName = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthMap[mStr] = {
          monthStr: mStr,
          monthName: mName,
          income: 0,
          expense: 0,
          savings: 0,
          savingsRate: 0,
          categorySpends: {},
          emiBurden: 0,
          creditUtilAmount: 0,
          investmentContribution: 0,
          netWorth: 0
        };
      }
    });

    // Income aggregation
    incomes.forEach(inc => {
      if (inc.date && monthMap[inc.date.slice(0, 7)]) {
        monthMap[inc.date.slice(0, 7)].income += inc.amount;
      }
    });

    // Expenses aggregation
    const ccAccounts = accounts.filter(a => a.type === 'credit_card');
    const ccAccountIds = new Set(ccAccounts.map(c => c.id));
    
    expenses.forEach(exp => {
      if (!exp.date) return;
      if (exp.category && exp.category.toLowerCase() === 'transfer') return;
      const mStr = exp.date.slice(0, 7);
      if (monthMap[mStr]) {
        monthMap[mStr].expense += exp.amount;
        const cat = exp.category || 'Miscellaneous';
        monthMap[mStr].categorySpends[cat] = (monthMap[mStr].categorySpends[cat] || 0) + exp.amount;

        if (ccAccountIds.has(exp.accountId)) {
          monthMap[mStr].creditUtilAmount += exp.amount;
        }

        const lowerCat = cat.toLowerCase();
        if (lowerCat.includes('invest') || lowerCat.includes('mutual') || lowerCat.includes('stock') || lowerCat.includes('sip') || lowerCat.includes('nps') || lowerCat.includes('ppf') || lowerCat.includes('gold')) {
          monthMap[mStr].investmentContribution += exp.amount;
        }
      }
    });

    // EMIs aggregation
    const getMonthsDiff = (startStr: string, currentStr: string) => {
      const sYr = parseInt(startStr.slice(0, 4));
      const sMo = parseInt(startStr.slice(5, 7));
      const cYr = parseInt(currentStr.slice(0, 4));
      const cMo = parseInt(currentStr.slice(5, 7));
      return (cYr - sYr) * 12 + (cMo - sMo);
    };

    Object.keys(monthMap).forEach(mStr => {
      let emiTotal = 0;
      emis.forEach(item => {
        if (item.isActive && item.startDate) {
          const diff = getMonthsDiff(item.startDate, mStr);
          if (diff >= 0 && diff < item.totalTenure) emiTotal += item.amount;
        }
      });

      ccEmis.forEach(item => {
        if (item.status === 'active' && item.startDate) {
          const matchedInst = item.installments?.find(inst => inst.dueDate.slice(0, 7) === mStr);
          if (matchedInst) {
            emiTotal += matchedInst.totalInstallmentAmount;
          } else {
            const diff = getMonthsDiff(item.startDate, mStr);
            if (diff >= 0 && diff < item.tenure) emiTotal += item.financedAmount / item.tenure;
          }
        }
      });
      monthMap[mStr].emiBurden = emiTotal;
    });

    // Investments aggregation
    Object.keys(monthMap).forEach(mStr => {
      let invTotal = 0;
      investments.forEach(inv => {
        if (!inv.startDate) return;
        const diff = getMonthsDiff(inv.startDate, mStr);
        if (inv.investmentType === 'recurring') {
          const hasEnded = inv.hasEndDate && inv.endDate && inv.endDate < mStr;
          if (diff >= 0 && !hasEnded) invTotal += inv.amount;
        } else if (inv.startDate.slice(0, 7) === mStr) {
          invTotal += inv.amount;
        }
      });
      monthMap[mStr].investmentContribution += invTotal;
    });

    // Savings rates
    Object.keys(monthMap).forEach(mStr => {
      const entry = monthMap[mStr];
      entry.savings = entry.income - entry.expense;
      entry.savingsRate = entry.income > 0 ? (entry.savings / entry.income) * 100 : 0;
    });

    // Net Worth Timeline working backwards
    const totalBankCash = accounts.filter(a => a.type === 'bank').reduce((sum, a) => sum + a.balance, 0);
    const totalCardOutstanding = ccAccounts.reduce((sum, c) => sum + c.balance, 0);
    const totalInvestedAssets = investments.reduce((sum, i) => sum + (i.totalInvested || 0), 0);
    const currentActualNetWorth = totalBankCash + totalInvestedAssets - totalCardOutstanding;

    const sortedKeys = Object.keys(monthMap).sort();
    const todayStr = new Date().toISOString().slice(0, 7);
    let anchorMonth = todayStr;
    if (!monthMap[anchorMonth]) anchorMonth = sortedKeys[sortedKeys.length - 1];

    if (monthMap[anchorMonth]) monthMap[anchorMonth].netWorth = currentActualNetWorth;

    const anchorIdx = sortedKeys.indexOf(anchorMonth);
    if (anchorIdx !== -1) {
      let currentNWValue = currentActualNetWorth;
      for (let i = anchorIdx - 1; i >= 0; i--) {
        const nextMonthKey = sortedKeys[i + 1];
        currentNWValue = currentNWValue - monthMap[nextMonthKey].savings;
        monthMap[sortedKeys[i]].netWorth = currentNWValue;
      }
      currentNWValue = currentActualNetWorth;
      for (let i = anchorIdx + 1; i < sortedKeys.length; i++) {
        const currentMonthKey = sortedKeys[i];
        currentNWValue = currentNWValue + monthMap[currentMonthKey].savings;
        monthMap[currentMonthKey].netWorth = currentNWValue;
      }
    }

    return sortedKeys.map(k => monthMap[k]);
  }, [incomes, expenses, accounts, emis, ccEmis, investments, selectedYear]);

  // Extract covered years
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    fullTrendData.forEach(stat => {
      const yr = stat.monthStr.split('-')[0];
      if (yr && yr.length === 4) yearsSet.add(yr);
    });
    if (yearsSet.size === 0) yearsSet.add(new Date().getFullYear().toString());
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [fullTrendData]);

  // Selected Month setup
  const sortedYearMonths = useMemo(() => {
    return fullTrendData.filter(m => m.monthStr.startsWith(selectedYear));
  }, [selectedYear, fullTrendData]);

  useEffect(() => {
    if (sortedYearMonths.length > 0) {
      const activeMonthStr = new Date().toISOString().slice(0, 7);
      const hasCurrentMonth = sortedYearMonths.some(m => m.monthStr === activeMonthStr);
      setSelectedMonth(hasCurrentMonth ? activeMonthStr : sortedYearMonths[sortedYearMonths.length - 1].monthStr);
    }
  }, [selectedYear, sortedYearMonths]);

  // Get rolling 3-month averages
  const comparisonStats = useMemo(() => {
    if (!selectedMonth) return null;
    const currentIdx = fullTrendData.findIndex(s => s.monthStr === selectedMonth);
    const current = fullTrendData[currentIdx] || { income: 0, expense: 0, savings: 0, savingsRate: 0, categorySpends: {}, emiBurden: 0, creditUtilAmount: 0, investmentContribution: 0, netWorth: 0 };
    
    // Get preceding 3 months
    const prevs = currentIdx > 0 ? fullTrendData.slice(Math.max(0, currentIdx - 3), currentIdx) : [];
    const avgExpense = prevs.length > 0 ? prevs.reduce((sum, p) => sum + p.expense, 0) / prevs.length : 0;
    const avgIncome = prevs.length > 0 ? prevs.reduce((sum, p) => sum + p.income, 0) / prevs.length : 0;
    const avgSavings = prevs.length > 0 ? prevs.reduce((sum, p) => sum + p.savings, 0) / prevs.length : 0;

    // Get preceding month
    const prevMonth = currentIdx > 0 ? fullTrendData[currentIdx - 1] : null;

    // Top category and its 3-month average
    const currentCatSpends = current.categorySpends || {};
    const sortedCats = Object.entries(currentCatSpends).sort((a, b) => (b[1] as number) - (a[1] as number));
    const topCategory = sortedCats.length > 0 ? sortedCats[0][0] : '';
    const topCategoryAmt = sortedCats.length > 0 ? sortedCats[0][1] : 0;
    const topCategoryAvg = (prevs.length > 0 && topCategory) ? prevs.reduce((sum, p) => sum + (p.categorySpends[topCategory] || 0), 0) / prevs.length : 0;

    return {
      current,
      prevMonth,
      avgExpense,
      avgIncome,
      avgSavings,
      topCategory,
      topCategoryAmt,
      topCategoryAvg
    };
  }, [selectedMonth, fullTrendData]);

  // YoY stats helper
  const yoyStats = useMemo(() => {
    const curYearData = fullTrendData.filter(m => m.monthStr.startsWith(selectedYear));
    const prevYearStr = (parseInt(selectedYear) - 1).toString();
    const prevYearData = fullTrendData.filter(m => m.monthStr.startsWith(prevYearStr));

    const curIncome = curYearData.reduce((s, m) => s + m.income, 0);
    const curExpense = curYearData.reduce((s, m) => s + m.expense, 0);
    const curSavings = curIncome - curExpense;
    const curSavingsRate = curIncome > 0 ? (curSavings / curIncome) * 100 : 0;

    const prevIncome = prevYearData.reduce((s, m) => s + m.income, 0);
    const prevExpense = prevYearData.reduce((s, m) => s + m.expense, 0);
    const prevSavings = prevIncome - prevExpense;
    const prevSavingsRate = prevIncome > 0 ? (prevSavings / prevIncome) * 100 : 0;

    return {
      curIncome, curExpense, curSavings, curSavingsRate,
      prevIncome, prevExpense, prevSavings, prevSavingsRate
    };
  }, [selectedYear, fullTrendData]);

  // --- ANOMALY SCANS ---
  const anomaliesList = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'transaction_spike' | 'double_charge' | 'category_surge';
      severity: 'critical' | 'warning' | 'info';
      title: string;
      description: string;
      impact: string;
      amount: number;
      category: string;
    }> = [];

    const activeExpenses = expenses.filter(e => e.date && e.date.startsWith(selectedYear) && e.category.toLowerCase() !== 'transfer');
    
    // Double charge detection
    const seenTx = new Map<string, typeof expenses[0]>();
    activeExpenses.forEach(exp => {
      const key = `${exp.date}_${exp.amount}_${exp.category.toLowerCase()}_${exp.accountId}`;
      if (seenTx.has(key)) {
        list.push({
          id: `double-${exp.id}`,
          type: 'double_charge',
          severity: 'critical',
          title: 'Potential Double Billing Outlier',
          description: `Identical charge of ${formatCurrency(exp.amount, preferences)} for "${exp.description}" registered twice on the same day.`,
          impact: 'Merchant billing duplicates reduce liquid bank float. File a merchant dispute.',
          amount: exp.amount,
          category: exp.category
        });
      } else {
        seenTx.set(key, exp);
      }
    });

    // Expense spikes
    activeExpenses.forEach(exp => {
      const largeThreshold = preferences.largeExpenseThreshold || 4000;
      if (exp.amount > largeThreshold) {
        list.push({
          id: `spike-${exp.id}`,
          type: 'transaction_spike',
          severity: exp.amount > largeThreshold * 2.5 ? 'critical' : 'warning',
          title: `Large Outlay in ${exp.category}`,
          description: `Logged a single transaction of ${formatCurrency(exp.amount, preferences)} for "${exp.description}".`,
          impact: `Exceeds your large spending threshold. Ensure this aligns with targeted sinking funds.`,
          amount: exp.amount,
          category: exp.category
        });
      }
    });

    return list;
  }, [selectedYear, expenses, preferences]);

  // Overall Grade Computation
  const overallGrade = useMemo(() => {
    let score = 0;
    const cards = accounts.filter(a => a.type === 'credit_card');
    const totalCcLimit = cards.reduce((s, a) => s + (a.limit || 0), 0);
    const totalCcBalance = cards.reduce((s, a) => s + a.balance, 0);
    const ccUtil = totalCcLimit > 0 ? (totalCcBalance / totalCcLimit) * 100 : 0;

    const annualEmiTotal = (emis || []).filter(e => e.isActive).reduce((s, e) => s + e.amount, 0) * 12;
    const emiRatio = yoyStats.curIncome > 0 ? (annualEmiTotal / yoyStats.curIncome) * 100 : 0;

    if (yoyStats.curSavingsRate >= 30) score += 40;
    else if (yoyStats.curSavingsRate >= 20) score += 30;
    else if (yoyStats.curSavingsRate >= 10) score += 15;

    if (ccUtil < 30) score += 30;
    else if (ccUtil < 50) score += 15;

    if (emiRatio < 20) score += 30;
    else if (emiRatio < 35) score += 15;

    if (score >= 80) return { grade: 'A', label: 'Healthy Accumulator', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
    if (score >= 50) return { grade: 'B', label: 'Balanced Position', color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' };
    return { grade: 'C', label: 'Leveraged Exposure Warning', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' };
  }, [yoyStats, accounts, emis]);

  const handleCopySummary = () => {
    const formattedText = `📊 PaisaFlow ${selectedYear} Capital Intelligence Report 📊
🏆 Grade: ${overallGrade.grade} (${overallGrade.label})
💰 Cumulative Outlays: ${formatCurrency(yoyStats.curExpense, preferences)}
📈 Annual Savings Rate: ${yoyStats.curSavingsRate.toFixed(1)}%`;
    navigator.clipboard.writeText(formattedText).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  // --- REUSABLE INSIGHT WRITER (DECISION CARD "SO WHAT?" GENERATOR) ---
  const renderInsightBlock = (title: string, valueStr: string, insightText: string, alertType: 'success' | 'warning' | 'info') => {
    const borderCol = alertType === 'success' ? 'border-emerald-500 bg-emerald-500/5' : alertType === 'warning' ? 'border-amber-500 bg-amber-500/5' : 'border-blue-500 bg-blue-500/5';
    const textCol = alertType === 'success' ? 'text-emerald-600 dark:text-emerald-450' : alertType === 'warning' ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-450';
    return (
      <div className={`border-l-4 ${borderCol} p-3.5 rounded-r-xl space-y-1 text-left`}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Core Decision Metric</span>
          <span className={`text-xs font-black font-mono ${textCol}`}>{valueStr}</span>
        </div>
        <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">{title}</h4>
        <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-350 leading-relaxed">
          {insightText}
        </p>
      </div>
    );
  };

  return (
    <div id="analytics-section-root" className="space-y-6">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-850 dark:text-white flex items-center gap-2">
            <Award className="w-5.5 h-5.5 text-indigo-600" />
            Decision & Capital Analytics
          </h2>
          <p className="text-xs text-slate-450">
            Real-time metric ledgers mapped directly to tactical and strategic wealth recommendations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Year select */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[9px] font-extrabold uppercase text-slate-400">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="text-xs font-black bg-transparent border-0 focus:ring-0 focus:outline-none cursor-pointer text-slate-700 dark:text-slate-200"
            >
              {availableYears.map(yr => <option key={yr} value={yr}>{yr}</option>)}
            </select>
          </div>

          {/* Month select */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[9px] font-extrabold uppercase text-slate-400">Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-black bg-transparent border-0 focus:ring-0 focus:outline-none cursor-pointer text-slate-700 dark:text-slate-200"
            >
              {sortedYearMonths.map(m => <option key={m.monthStr} value={m.monthStr}>{m.monthName}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* SUBTABS */}
      <div className="flex items-center border-b border-slate-100 dark:border-slate-800 gap-1 overflow-x-auto pb-px">
        {[
          { key: 'overview', label: 'Overview & Net Worth', icon: Layers },
          { key: 'trends', label: 'Spend, Debt & Invest Trends', icon: PieIcon },
          { key: 'compare', label: 'Period Comparisons', icon: ArrowRightLeft },
          { key: 'anomalies', label: 'Spending Outliers', icon: AlertTriangle }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key as any)}
              className={`px-4 py-2 text-xs font-extrabold transition-all border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                activeSubTab === tab.key
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-black'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* RENDER VIEWPORTS */}
      
      {/* OVERVIEW HUD */}
      {activeSubTab === 'overview' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#0b1329] border border-slate-100 dark:border-slate-800/80 p-4 rounded-xl shadow-2xs">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Inflow ({selectedYear})</span>
              <span className="text-lg font-black font-mono block text-slate-800 dark:text-white mt-1">
                {formatCurrency(yoyStats.curIncome, preferences, 0)}
              </span>
            </div>
            <div className="bg-white dark:bg-[#0b1329] border border-slate-100 dark:border-slate-800/80 p-4 rounded-xl shadow-2xs">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Outflow ({selectedYear})</span>
              <span className="text-lg font-black font-mono block text-rose-500 mt-1">
                {formatCurrency(yoyStats.curExpense, preferences, 0)}
              </span>
            </div>
            <div className="bg-white dark:bg-[#0b1329] border border-slate-100 dark:border-slate-800/80 p-4 rounded-xl shadow-2xs">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Retained Surplus</span>
              <span className="text-lg font-black font-mono block text-emerald-500 mt-1">
                {formatCurrency(yoyStats.curSavings, preferences, 0)}
              </span>
            </div>
            <div className="bg-white dark:bg-[#0b1329] border border-slate-100 dark:border-slate-800/80 p-4 rounded-xl shadow-2xs flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Capital Position</span>
                <span className="text-xs font-black block text-slate-600 dark:text-slate-300 mt-1">{overallGrade.label}</span>
              </div>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black border text-xs ${overallGrade.color}`}>
                {overallGrade.grade}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Card 1: Income vs Expense */}
            <div className="bg-white dark:bg-[#0b1329] p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-2xs space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Income vs Expense Tracker</h3>
                  <p className="text-base font-black text-slate-800 dark:text-white mt-0.5">Inflow vs Outflow Allocation</p>
                </div>
              </div>
              
              {comparisonStats && (() => {
                const inc = comparisonStats.current.income;
                const exp = comparisonStats.current.expense;
                const ratio = inc > 0 ? (exp / inc) * 100 : 0;
                const isDeficit = exp > inc;
                return renderInsightBlock(
                  isDeficit ? "Structural Outflow Deficit" : "Systematic Capital Margin",
                  `Expense-to-Income: ${ratio.toFixed(0)}%`,
                  isDeficit 
                    ? `Warning: Outflows exceeded inflows by ${formatCurrency(exp - inc, preferences)} this month. This requires drawing from reserves. Freeze discretionary limits.`
                    : `Success: You operated with a ${formatCurrency(inc - exp, preferences)} cash cushion. This provides a clean positive margin to route to investments.`,
                  isDeficit ? 'warning' : 'success'
                );
              })()}

              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sortedYearMonths} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_THEME.gridLight} />
                    <XAxis dataKey="monthName" stroke={CHART_THEME.textLight} fontSize={9} fontWeight="bold" tickLine={false} />
                    <YAxis stroke={CHART_THEME.textLight} fontSize={9} fontWeight="bold" tickLine={false} axisLine={false} tickFormatter={v => formatCompactCurrency(v, preferences)} />
                    <Tooltip formatter={(v: any) => [formatCurrency(Number(v), preferences), '']} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }} />
                    <Bar dataKey="income" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={18} />
                    <Bar dataKey="expense" fill="#f43f5e" radius={[3, 3, 0, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Card 2: Savings Rate */}
            <div className="bg-white dark:bg-[#0b1329] p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-2xs space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Savings rate trend</h3>
                  <p className="text-base font-black text-slate-800 dark:text-white mt-0.5">Surplus Compounding Velocity</p>
                </div>
              </div>

              {comparisonStats && (() => {
                const rate = comparisonStats.current.savingsRate;
                const isOptimal = rate >= 20;
                return renderInsightBlock(
                  isOptimal ? "Optimal Compounding Path" : "Restricted Capital Retention",
                  `Savings Rate: ${rate.toFixed(1)}%`,
                  isOptimal 
                    ? `Excellent: Your savings rate of ${rate.toFixed(1)}% meets the 20% golden benchmark. This actively builds resilient liquid security and long-term assets.`
                    : `Sub-optimal: Savings rate is at ${rate.toFixed(1)}% (under 20% safety target). Automate a ${formatCurrency(comparisonStats.current.income * 0.10, preferences)} transfer directly on payday to reinforce baseline margins.`,
                  isOptimal ? 'success' : 'warning'
                );
              })()}

              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sortedYearMonths} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_THEME.gridLight} />
                    <XAxis dataKey="monthName" stroke={CHART_THEME.textLight} fontSize={9} fontWeight="bold" tickLine={false} />
                    <YAxis stroke={CHART_THEME.textLight} fontSize={9} fontWeight="bold" tickLine={false} tickFormatter={v => `${v}%`} />
                    <Tooltip formatter={(v: any) => [`${Number(v).toFixed(1)}%`, 'Savings Rate']} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }} />
                    <defs>
                      <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="savingsRate" stroke="#4f46e5" fillOpacity={1} fill="url(#colorSavings)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Card 3: Net-Worth Growth */}
            <div className="bg-white dark:bg-[#0b1329] p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-2xs space-y-4 lg:col-span-2">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Net-worth Growth trajectory</h3>
                  <p className="text-base font-black text-slate-800 dark:text-white mt-0.5">Asset Base Expansion</p>
                </div>
              </div>

              {comparisonStats && (() => {
                const curNW = comparisonStats.current.netWorth;
                const prevNW = comparisonStats.prevMonth ? comparisonStats.prevMonth.netWorth : 0;
                const diff = curNW - prevNW;
                const pct = prevNW > 0 ? (diff / prevNW) * 100 : 0;
                const nwPositive = diff >= 0;
                return renderInsightBlock(
                  nwPositive ? "Asset Expansion Phase" : "Asset Contraction Flag",
                  `Net Worth Delta: ${nwPositive ? '+' : ''}${pct.toFixed(1)}% (${formatCurrency(diff, preferences)})`,
                  nwPositive
                    ? `Your net worth increased to ${formatCurrency(curNW, preferences)}. At this trajectory, consistent monthly growth of 1.5% will double your baseline net worth inside 4 years.`
                    : `Net asset contraction observed this month. A reduction of ${formatCurrency(Math.abs(diff), preferences)} reflects high outlays matching credit balances. Avoid taking on high liabilities.`,
                  nwPositive ? 'success' : 'warning'
                );
              })()}

              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sortedYearMonths} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_THEME.gridLight} />
                    <XAxis dataKey="monthName" stroke={CHART_THEME.textLight} fontSize={9} fontWeight="bold" tickLine={false} />
                    <YAxis stroke={CHART_THEME.textLight} fontSize={9} fontWeight="bold" tickLine={false} axisLine={false} tickFormatter={v => formatCompactCurrency(v, preferences)} />
                    <Tooltip formatter={(v: any) => [formatCurrency(Number(v), preferences), 'Net Worth']} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }} />
                    <defs>
                      <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="netWorth" stroke="#10b981" fillOpacity={1} fill="url(#colorNetWorth)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* PRESERVED AUDIT REPORT CARD SHARE BUTTON */}
          <div className="bg-[#0b1329] p-5 rounded-2xl border border-indigo-950/60 flex flex-col md:flex-row justify-between items-center gap-4 text-left">
            <div>
              <span className="text-[10px] bg-indigo-950 text-indigo-400 font-extrabold px-2 py-0.5 rounded border border-indigo-900 uppercase">
                PaisaFlow Capital Grade Card
              </span>
              <h3 className="text-base font-black text-white mt-1">Audit Ledger Share Ready</h3>
              <p className="text-xs text-slate-400">Share your anonymized, premium fiscal health score cards with advisors.</p>
            </div>
            <button
              onClick={handleCopySummary}
              className="px-4 py-2 bg-[#ffffff] hover:bg-[#f1f5f9] text-[#0f172a] hover:text-[#0f172a] font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-xs"
            >
              {copySuccess ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copySuccess ? 'Copied summary!' : 'Share Portfolio Grade'}
            </button>
          </div>
        </motion.div>
      )}

      {/* SPEND, DEBT & INVEST TRENDS */}
      {activeSubTab === 'trends' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Card 4: Monthly Spending Trend */}
            <div className="bg-white dark:bg-[#0b1329] p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-2xs space-y-4">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Monthly Spending Trend</h3>
                <p className="text-base font-black text-slate-800 dark:text-white mt-0.5">Discretionary Trajectory</p>
              </div>

              {comparisonStats && (() => {
                const exp = comparisonStats.current.expense;
                const avg = comparisonStats.avgExpense;
                if (avg > 0) {
                  const diff = exp - avg;
                  const pct = (diff / avg) * 100;
                  const isSpiked = pct >= 10;
                  return renderInsightBlock(
                    isSpiked ? "Budget Threshold Breach" : "Disciplined Trajectory",
                    `Spend Deviation: ${pct >= 0 ? '+' : ''}${pct.toFixed(0)}% from average`,
                    isSpiked
                      ? `Your spending of ${formatCurrency(exp, preferences)} is ${pct.toFixed(0)}% higher than your 3-month average of ${formatCurrency(avg, preferences)}. Trim leisure card usage to avoid capital erosion.`
                      : `Superb constraint: Spending is ${Math.abs(pct).toFixed(0)}% below your 3-month rolling average. This releases extra cash flow for active compounding.`,
                    isSpiked ? 'warning' : 'success'
                  );
                }
                return renderInsightBlock("Baseline Established", `Current Outlay: ${formatCurrency(exp, preferences)}`, "Initial baseline active. Future months will track rolling average deviations to catch creep.", "info");
              })()}

              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sortedYearMonths} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_THEME.gridLight} />
                    <XAxis dataKey="monthName" stroke={CHART_THEME.textLight} fontSize={9} fontWeight="bold" tickLine={false} />
                    <YAxis stroke={CHART_THEME.textLight} fontSize={9} fontWeight="bold" tickLine={false} tickFormatter={v => formatCompactCurrency(v, preferences)} />
                    <Tooltip formatter={(v: any) => [formatCurrency(Number(v), preferences), 'Expense']} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }} />
                    <defs>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="expense" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Card 5: Category Spending Trend */}
            <div className="bg-white dark:bg-[#0b1329] p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-2xs space-y-4">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Category spending trend</h3>
                <p className="text-base font-black text-slate-800 dark:text-white mt-0.5">Resource Allocations</p>
              </div>

              {comparisonStats && (() => {
                const cat = comparisonStats.topCategory;
                const amt = comparisonStats.topCategoryAmt;
                const avg = comparisonStats.topCategoryAvg;
                if (!cat) return renderInsightBlock("No Category outlays", "0 categories active", "Maintain zero-spend allocations.", "success");
                
                if (avg > 0) {
                  const pct = ((amt - avg) / avg) * 100;
                  const isSpiked = pct >= 15;
                  return renderInsightBlock(
                    isSpiked ? "Category Outflow Surge" : "Category Baseline Stable",
                    `${cat} Shift: ${pct >= 0 ? '+' : ''}${pct.toFixed(0)}% vs average`,
                    isSpiked
                      ? `${cat} spending surged to ${formatCurrency(amt, preferences)} (${pct.toFixed(0)}% above average of ${formatCurrency(avg, preferences)}). Consider putting a strict category freeze on this drawer.`
                      : `${cat} spend of ${formatCurrency(amt, preferences)} remains stable relative to historical baseline averages. Excellent envelope control.`,
                    isSpiked ? 'warning' : 'success'
                  );
                }
                return renderInsightBlock(`${cat} Baseline Captured`, `Spend: ${formatCurrency(amt, preferences)}`, `Establishing initial baseline for ${cat}. Next cycle will track dynamic deviations.`, "info");
              })()}

              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sortedYearMonths} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_THEME.gridLight} />
                    <XAxis dataKey="monthName" stroke={CHART_THEME.textLight} fontSize={9} fontWeight="bold" tickLine={false} />
                    <YAxis stroke={CHART_THEME.textLight} fontSize={9} fontWeight="bold" tickLine={false} tickFormatter={v => formatCompactCurrency(v, preferences)} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }} />
                    {Array.from(new Set(expenses.map(e => e.category || 'Miscellaneous'))).slice(0, 4).map((cat, idx) => {
                      const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ec4899'];
                      return (
                        <Bar 
                          key={cat} 
                          dataKey={`categorySpends.${cat}`} 
                          name={cat}
                          stackId="a" 
                          fill={colors[idx % colors.length]} 
                          maxBarSize={20}
                        />
                      );
                    })}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Card 6: EMI Burden Trend */}
            <div className="bg-white dark:bg-[#0b1329] p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-2xs space-y-4">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">EMI burden trend</h3>
                <p className="text-base font-black text-slate-850 dark:text-white mt-0.5">Fixed Debt Commitments</p>
              </div>

              {comparisonStats && (() => {
                const emi = comparisonStats.current.emiBurden;
                const inc = comparisonStats.current.income;
                const ratio = inc > 0 ? (emi / inc) * 100 : 0;
                const isHeavy = ratio > 35;
                const isDebtFree = emi === 0;
                
                return renderInsightBlock(
                  isDebtFree ? "Elite Debt-Free Status" : isHeavy ? "High Debt Servicing Index" : "Safe Debt Servicing Index",
                  `EMI Leverage Ratio: ${ratio.toFixed(0)}% of income`,
                  isDebtFree
                    ? "Fantastic! You have 0 EMI commitments. This unlocks elite capital efficiency, allowing you to route 100% of savings directly to wealth compounders."
                    : isHeavy
                    ? `Warning: EMI commitments eat ${ratio.toFixed(0)}% of monthly inflows. This is above the 35% safe ceiling. Avoid further BNPL or credit conversions.`
                    : `Comfortable: Your EMI servicing ratio is safe at ${ratio.toFixed(0)}% of monthly inflows. Maintain current payoff timelines.`,
                  isHeavy ? 'warning' : 'success'
                );
              })()}

              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sortedYearMonths} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_THEME.gridLight} />
                    <XAxis dataKey="monthName" stroke={CHART_THEME.textLight} fontSize={9} fontWeight="bold" tickLine={false} />
                    <YAxis stroke={CHART_THEME.textLight} fontSize={9} fontWeight="bold" tickLine={false} tickFormatter={v => formatCompactCurrency(v, preferences)} />
                    <Tooltip formatter={(v: any) => [formatCurrency(Number(v), preferences), 'EMI']} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }} />
                    <Bar dataKey="emiBurden" fill="#f59e0b" radius={[3, 3, 0, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Card 7: Credit Utilisation Trend */}
            <div className="bg-white dark:bg-[#0b1329] p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-2xs space-y-4">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Credit utilisation trend</h3>
                <p className="text-base font-black text-slate-850 dark:text-white mt-0.5">Credit Line Utilization (CUR)</p>
              </div>

              {comparisonStats && (() => {
                const cards = accounts.filter(a => a.type === 'credit_card');
                const totalCcLimit = cards.reduce((sum, c) => sum + (c.limit || 0), 0);
                const curCCSpend = comparisonStats.current.creditUtilAmount;
                const utilPct = totalCcLimit > 0 ? (curCCSpend / totalCcLimit) * 100 : 0;
                const exceedsLimit = utilPct > 30;

                return renderInsightBlock(
                  exceedsLimit ? "Credit Score Risk Flag" : "Premium Credit Rating",
                  `Active CUR: ${utilPct.toFixed(1)}%`,
                  exceedsLimit
                    ? `Warning: Active card utilization is at ${utilPct.toFixed(1)}% (exceeds the 30% score ceiling). Pay down ${formatCurrency(Math.max(0, curCCSpend - (totalCcLimit * 0.3)), preferences)} mid-cycle to lift your rating.`
                    : `Active card utilization is well-regulated at ${utilPct.toFixed(1)}% (under 30%). This preserves an elite bureau score and access to top credit tools.`,
                  exceedsLimit ? 'warning' : 'success'
                );
              })()}

              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sortedYearMonths} margin={{ top: 10, right: 15, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_THEME.gridLight} />
                    <XAxis dataKey="monthName" stroke={CHART_THEME.textLight} fontSize={9} fontWeight="bold" tickLine={false} />
                    <YAxis stroke={CHART_THEME.textLight} fontSize={9} fontWeight="bold" tickLine={false} tickFormatter={v => `${v}%`} />
                    <Tooltip formatter={(v: any) => [`${Number(v).toFixed(1)}%`, 'CUR']} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }} />
                    <ReferenceLine y={30} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: '30% Limit', fill: '#f43f5e', fontSize: 8, fontWeight: 'bold' }} />
                    <Line type="monotone" dataKey={m => {
                      const limit = accounts.filter(a => a.type === 'credit_card').reduce((sum, c) => sum + (c.limit || 0), 0);
                      return limit > 0 ? (m.creditUtilAmount / limit) * 100 : 0;
                    }} stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Card 8: Investment Contribution Trend */}
            <div className="bg-white dark:bg-[#0b1329] p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-2xs space-y-4 lg:col-span-2">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Investment contribution trend</h3>
                <p className="text-base font-black text-slate-850 dark:text-white mt-0.5">Asset Compound Engine</p>
              </div>

              {comparisonStats && (() => {
                const inv = comparisonStats.current.investmentContribution;
                const inc = comparisonStats.current.income;
                const rate = inc > 0 ? (inv / inc) * 100 : 0;
                const isOptimal = rate >= 15;
                
                return renderInsightBlock(
                  isOptimal ? "Wealth Compounder Tier" : "Accumulation Inception Stage",
                  `Investment Rate: ${rate.toFixed(0)}% of income`,
                  isOptimal
                    ? `Excellent: You invested ${formatCurrency(inv, preferences)} (${rate.toFixed(0)}% of income). You are actively accelerating your timeline to financial independence.`
                    : `Inception: Investment rate is at ${rate.toFixed(0)}%. Target 15% by scaling up automated mutual fund SIP transfers by ${formatCurrency(Math.max(0, (inc * 0.15) - inv), preferences)} monthly.`,
                  isOptimal ? 'success' : 'info'
                );
              })()}

              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sortedYearMonths} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_THEME.gridLight} />
                    <XAxis dataKey="monthName" stroke={CHART_THEME.textLight} fontSize={9} fontWeight="bold" tickLine={false} />
                    <YAxis stroke={CHART_THEME.textLight} fontSize={9} fontWeight="bold" tickLine={false} tickFormatter={v => formatCompactCurrency(v, preferences)} />
                    <Tooltip formatter={(v: any) => [formatCurrency(Number(v), preferences), 'Invested']} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }} />
                    <Bar dataKey="investmentContribution" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </motion.div>
      )}

      {/* PERIOD COMPARISONS */}
      {activeSubTab === 'compare' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Card 9: Month-over-Month Comparison */}
            <div className="bg-white dark:bg-[#0b1329] p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-2xs space-y-4">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Month-over-month comparison</h3>
                <p className="text-base font-black text-slate-800 dark:text-white mt-0.5">Consecutive Cycles comparison</p>
              </div>

              {comparisonStats && (() => {
                const cur = comparisonStats.current.expense;
                const prev = comparisonStats.prevMonth ? comparisonStats.prevMonth.expense : 0;
                if (prev > 0) {
                  const diff = cur - prev;
                  const pct = (diff / prev) * 100;
                  const improved = diff <= 0;
                  return renderInsightBlock(
                    improved ? "Surplus Velocity Acceleration" : "Outflow Spill Expansion",
                    `MoM Delta: ${pct >= 0 ? '+' : ''}${pct.toFixed(0)}% vs last month`,
                    improved
                      ? `Excellent! Monthly outgoings dropped by ${formatCurrency(Math.abs(diff), preferences)} (${Math.abs(pct).toFixed(0)}% lower). Keep this extra surplus in checking to boost cash reserves.`
                      : `Alert: Monthly spending expanded by ${formatCurrency(diff, preferences)} (+${pct.toFixed(0)}%). Identify high transactional leakage from your recent cards ledger.`,
                    improved ? 'success' : 'warning'
                  );
                }
                return renderInsightBlock("MoM Active Stage", "First comparison month active", "Next billing cycle will lock in consecutive month deviation values.", "info");
              })()}

              {comparisonStats && (
                <div className="border border-slate-100 dark:border-slate-800 p-4 rounded-xl space-y-3.5">
                  <div className="flex justify-between items-center text-xs font-black text-slate-400">
                    <span>Fiscal Stream</span>
                    <div className="flex gap-10">
                      <span>Prev Month</span>
                      <span>This Month</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs font-bold border-t border-slate-50 dark:border-slate-800/30 pt-2 text-slate-700 dark:text-slate-300">
                    <span>Inflows</span>
                    <span className="font-mono">{formatCurrency(comparisonStats.prevMonth?.income || 0, preferences)} &rarr; {formatCurrency(comparisonStats.current.income, preferences)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>Outgoings</span>
                    <span className="font-mono text-rose-500">{formatCurrency(comparisonStats.prevMonth?.expense || 0, preferences)} &rarr; {formatCurrency(comparisonStats.current.expense, preferences)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Card 10: Year-over-Year Comparison */}
            <div className="bg-white dark:bg-[#0b1329] p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-2xs space-y-4">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Year-over-year comparison</h3>
                <p className="text-base font-black text-slate-800 dark:text-white mt-0.5">Annualized compounding shift</p>
              </div>

              {(() => {
                const cur = yoyStats.curSavings;
                const prev = yoyStats.prevSavings;
                const diff = cur - prev;
                const pct = prev !== 0 ? (diff / Math.abs(prev)) * 100 : 0;
                const improved = diff >= 0;

                return renderInsightBlock(
                  improved ? "Annual Surplus Expansion" : "Annual Surplus Compression",
                  `Annual Surplus Shift: ${improved ? '+' : ''}${pct.toFixed(0)}% vs last year`,
                  improved
                    ? `Great job! Your annual saved surplus grew by ${formatCurrency(diff, preferences)} compared to last year. Your wealth compounding speed is accelerating.`
                    : `Warning: Annual surplus contracted by ${formatCurrency(Math.abs(diff), preferences)} relative to last year. Run an audit on lifestyle and housing inflation limits.`,
                  improved ? 'success' : 'warning'
                );
              })()}

              <div className="border border-slate-100 dark:border-slate-800 p-4 rounded-xl space-y-3.5">
                <div className="flex justify-between items-center text-xs font-black text-slate-400">
                  <span>Annual Stream</span>
                  <div className="flex gap-10">
                    <span>Prev Year</span>
                    <span>This Year</span>
                  </div>
                </div>
                <div className="flex justify-between text-xs font-bold border-t border-slate-50 dark:border-slate-800/30 pt-2 text-slate-700 dark:text-slate-300">
                  <span>Net Savings</span>
                  <span className="font-mono text-emerald-500">{formatCurrency(yoyStats.prevSavings, preferences)} &rarr; {formatCurrency(yoyStats.curSavings, preferences)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Savings Rate</span>
                  <span className="font-mono">{yoyStats.prevSavingsRate.toFixed(1)}% &rarr; {yoyStats.curSavingsRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      )}

      {/* SPENDING ANOMALIES */}
      {activeSubTab === 'anomalies' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 p-5 rounded-3xl relative overflow-hidden text-left">
            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Automated Audit Outlier Scans</h4>
            <p className="text-xs text-slate-450 mt-1 leading-relaxed">
              We audited the ledger for duplicate double-charging transactions (potential merchant errors) and large individual item charges relative to average thresholds.
            </p>
          </div>

          {anomaliesList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {anomaliesList.map(item => (
                <div key={item.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#0b1329] flex flex-col justify-between text-left space-y-3">
                  <div className="space-y-2">
                    <span className="text-[9px] bg-rose-500/15 text-rose-500 border border-rose-500/20 px-2 py-0.5 rounded font-bold uppercase">
                      {item.type.replace('_', ' ')}
                    </span>
                    <h4 className="text-xs font-black text-slate-850 dark:text-white">{item.title}</h4>
                    <p className="text-[10px] text-slate-450 leading-relaxed">{item.description}</p>
                    <p className="text-[11px] text-indigo-500 font-bold bg-indigo-500/5 p-2 rounded border border-indigo-500/10">💡 {item.impact}</p>
                  </div>
                  <div className="border-t border-slate-50 dark:border-slate-800/40 pt-2 flex justify-between items-center">
                    <span className="text-xs font-mono font-black">{formatCurrency(item.amount, preferences)}</span>
                    <button onClick={() => setCurrentTab('transactions')} className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">View transactions &rarr;</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-[#0b1329] rounded-2xl border border-slate-100 dark:border-slate-800/80">
              <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Perfect Solvency</h4>
              <p className="text-xs text-slate-450">No transaction outliers or duplicate billing patterns observed.</p>
            </div>
          )}
        </motion.div>
      )}

    </div>
  );
}
