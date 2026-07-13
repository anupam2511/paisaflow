/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FinanceData } from '../../types';
import { formatCurrency, formatCompactCurrency } from '../../utils/formatters';
import { motion } from 'motion/react';
import { 
  Building, 
  CreditCard, 
  HelpCircle, 
  ShieldAlert, 
  CheckCircle, 
  Info
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import { getCategoryColor } from './dashboard.utils';

interface MonthlyCashFlowProps {
  data: FinanceData;
  setCurrentTab: (tab: string) => void;
}

export default function MonthlyCashFlow({ data, setCurrentTab }: MonthlyCashFlowProps) {
  const { 
    accounts = [], 
    incomes = [], 
    expenses = [], 
    recurringSpends = [], 
    budgets = [], 
    preferences,
    emis = [],
    ccEmis = []
  } = data;

  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [breakdownType, setBreakdownType] = useState<'category' | 'account'>('category');

  // Find the active month prefix (e.g. "2026-07"). Falls back to latest expense if current calendar month has no data.
  const today = new Date();
  const currentMonthPrefix = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
  const hasCurrentMonthData = expenses.some(e => e.date.startsWith(currentMonthPrefix));
  const activeMonthPrefix = hasCurrentMonthData 
    ? currentMonthPrefix 
    : (() => {
        const dates = expenses.map(e => e.date).filter(Boolean).sort();
        return dates.length > 0 ? dates[dates.length - 1].slice(0, 7) : currentMonthPrefix;
      })();

  // Basic monthly calculations filtered by active month
  const totalIncome = incomes
    .filter(inc => !inc.date || inc.date.startsWith(activeMonthPrefix))
    .reduce((sum, inc) => sum + inc.amount, 0);

  const totalExpenses = expenses
    .filter(exp => exp.date.startsWith(activeMonthPrefix) && exp.category.toLowerCase() !== 'transfer')
    .reduce((sum, exp) => sum + exp.amount, 0);

  const totalRecurring = recurringSpends
    .filter(rec => rec.isActive)
    .reduce((sum, rec) => sum + rec.amount, 0);

  // EMI Obligations calculation
  const activeEmis = emis.filter(e => e.isActive);
  const activeCcEmis = ccEmis.filter(e => e.status === 'active');

  const standardEmiMonthlyBurden = activeEmis.reduce((sum, e) => sum + e.amount, 0);
  const ccEmiMonthlyBurden = activeCcEmis.reduce((sum, e) => {
    const nextUnpaid = e.installments.find(inst => inst.paidStatus === 'unpaid');
    return sum + (nextUnpaid ? nextUnpaid.totalInstallmentAmount : 0);
  }, 0);

  const totalActiveEmiMonthlyBurden = standardEmiMonthlyBurden + ccEmiMonthlyBurden;
  const totalOutflow = totalExpenses + totalRecurring + totalActiveEmiMonthlyBurden;
  const netMonthlyFlow = totalIncome - totalOutflow;

  // Spends by Category filtered to active month
  const categorySpends = budgets.map(b => {
    const amount = expenses
      .filter(e => e.category.toLowerCase() === b.category.toLowerCase() && e.date.startsWith(activeMonthPrefix))
      .reduce((sum, exp) => sum + exp.amount, 0) +
      recurringSpends
      .filter(r => r.isActive && r.category.toLowerCase() === b.category.toLowerCase())
      .reduce((sum, rec) => sum + rec.amount, 0);
    return {
      category: b.category,
      amount,
      limit: b.limit,
      pct: b.limit > 0 ? (amount / b.limit) * 100 : 0
    };
  });

  const totalSpendForChart = categorySpends.reduce((sum, c) => sum + c.amount, 0);

  // Spends by Account / Card filtered to active month
  const accountSpends = accounts.map(acc => {
    const amount = expenses
      .filter(e => e.accountId === acc.id && e.date.startsWith(activeMonthPrefix) && e.category.toLowerCase() !== 'transfer')
      .reduce((sum, exp) => sum + exp.amount, 0) +
      recurringSpends
      .filter(r => r.isActive && r.accountId === acc.id)
      .reduce((sum, rec) => sum + rec.amount, 0);
    return {
      ...acc,
      amount
    };
  });

  // Donut chart calculations
  let cumulativePercent = 0;
  const donutData = categorySpends
    .filter(c => c.amount > 0)
    .map((c, idx) => {
      const percentage = totalSpendForChart > 0 ? (c.amount / totalSpendForChart) * 100 : 0;
      const startPercent = cumulativePercent;
      cumulativePercent += percentage;
      
      return {
        ...c,
        percentage,
        startPercent,
        color: getCategoryColor(c.category, idx),
      };
    });

  // Large Expenses calculations filtered to active month
  const threshold = preferences.largeExpenseThreshold || 20000;
  const largeExpenses = expenses.filter(e => e.amount >= threshold && e.date.startsWith(activeMonthPrefix) && e.category.toLowerCase() !== 'transfer');
  const totalLargeExpenses = largeExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalStandardExpenses = totalExpenses - totalLargeExpenses;

  return (
    <div className="space-y-6">
      {/* COMPACT ACTIVE MONTHLY GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {/* INCOME */}
        <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-100/90 dark:border-slate-800/80 flex flex-col justify-between shadow-2xs">
          <span className="text-[9px] font-extrabold text-emerald-600 uppercase tracking-wider">Inflow</span>
          <div className="mt-2">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-medium uppercase">Expected Inflow</span>
            <p className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 font-mono">{formatCurrency(totalIncome, preferences)}</p>
          </div>
        </div>

        {/* EXPENSES */}
        <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-100/90 dark:border-slate-800/80 flex flex-col justify-between shadow-2xs">
          <span className="text-[9px] font-extrabold text-rose-600 uppercase tracking-wider">Outflow</span>
          <div className="mt-2">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-medium uppercase">Variable Spend</span>
            <p className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 font-mono">{formatCurrency(totalExpenses, preferences)}</p>
          </div>
        </div>

        {/* EMIs */}
        <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-100/90 dark:border-slate-800/80 flex flex-col justify-between shadow-2xs">
          <span className="text-[9px] font-extrabold text-indigo-600 uppercase tracking-wider">Debt Load</span>
          <div className="mt-2">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-medium uppercase">EMI Obligations</span>
            <p className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 font-mono">{formatCurrency(totalActiveEmiMonthlyBurden, preferences)}</p>
          </div>
        </div>

        {/* SUBSCRIPTIONS */}
        <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-100/90 dark:border-slate-800/80 flex flex-col justify-between shadow-2xs">
          <span className="text-[9px] font-extrabold text-violet-600 uppercase tracking-wider">Fixed Overhead</span>
          <div className="mt-2">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-medium uppercase">Subscriptions</span>
            <p className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 font-mono">{formatCurrency(totalRecurring, preferences)}</p>
          </div>
        </div>

        {/* BUDGET & SURPLUS */}
        <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-100/90 dark:border-slate-800/80 flex flex-col justify-between shadow-2xs col-span-2 md:col-span-1 xl:col-span-1">
          <span className={`text-[9px] font-extrabold uppercase tracking-wider ${netMonthlyFlow >= 0 ? 'text-teal-600' : 'text-rose-600'}`}>
            {netMonthlyFlow >= 0 ? 'Surplus' : 'Deficit'}
          </span>
          <div className="mt-2">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-medium uppercase">Net Cash Flow</span>
            <p className={`text-sm sm:text-base font-black font-mono ${netMonthlyFlow >= 0 ? 'text-slate-800 dark:text-slate-100' : 'text-rose-600'}`}>
              {formatCurrency(netMonthlyFlow, preferences)}
            </p>
          </div>
        </div>
      </div>

      {/* DONUT SPEND CHART & LARGE EXPENSE MODULES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* DONUT SPEND CHART */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-50">
              <h2 className="text-sm font-bold text-slate-800">Visual Spend Breakdown</h2>
              <div className="flex bg-slate-50 p-0.5 rounded-lg border border-slate-100">
                <button
                  type="button"
                  onClick={() => setBreakdownType('category')}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition duration-200 ${breakdownType === 'category' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  By Category
                </button>
                <button
                  type="button"
                  onClick={() => setBreakdownType('account')}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition duration-200 ${breakdownType === 'account' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  By Card / Account
                </button>
              </div>
            </div>

            {breakdownType === 'category' ? (
              <div className="block sm:grid sm:grid-cols-12 gap-4 items-center mt-6">
                {/* DONUT SVG CHART */}
                <div className="col-span-5 flex justify-center py-4 sm:py-0 relative">
                  {totalSpendForChart === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-full w-40 h-40">
                      <HelpCircle className="w-6 h-6 text-slate-300" />
                      <span className="text-[10px] text-slate-400 text-center mt-1 font-semibold">No expenses</span>
                    </div>
                  ) : (
                    <div className="relative w-40 h-40 flex items-center justify-center">
                      <svg width="100%" height="100%" viewBox="0 0 42 42" className="transform -rotate-90">
                        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="4"></circle>
                        {donutData.map((slice, idx) => {
                          const strokeDash = `${slice.percentage} ${100 - slice.percentage}`;
                          const strokeOffset = 100 - slice.startPercent;
                          return (
                            <circle
                              key={slice.category}
                              cx="21"
                              cy="21"
                              r="15.915"
                              fill="transparent"
                              stroke={slice.color}
                              strokeWidth="4.2"
                              strokeDasharray={strokeDash}
                              strokeDashoffset={strokeOffset}
                              onMouseEnter={() => setHoveredCategory(slice.category)}
                              onMouseLeave={() => setHoveredCategory(null)}
                              className="transition-all duration-300 hover:stroke-[5] cursor-pointer"
                            ></circle>
                          );
                        })}
                      </svg>
                      {/* DONUT CENTER TEXT */}
                      <div className="absolute flex flex-col items-center bg-white rounded-full p-2 text-center pointer-events-none">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                          {hoveredCategory ? hoveredCategory : 'Spends'}
                        </span>
                        <span className="text-xs font-extrabold text-slate-800">
                          {hoveredCategory 
                            ? formatCurrency(donutData.find(d => d.category === hoveredCategory)?.amount || 0, preferences)
                            : formatCurrency(totalSpendForChart, preferences)
                          }
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* DETAILED LEGEND */}
                <div className="col-span-7 space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {donutData.map((slice) => (
                    <div 
                      key={slice.category}
                      onMouseEnter={() => setHoveredCategory(slice.category)}
                      onMouseLeave={() => setHoveredCategory(null)}
                      className={`flex justify-between items-center py-1 px-1.5 rounded-lg transition-colors ${hoveredCategory === slice.category ? 'bg-slate-50' : ''}`}
                    >
                      <div className="flex items-center gap-1.5 truncate" title={slice.category}>
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: slice.color }}></span>
                        <span className="text-xs text-slate-650 font-medium truncate" title={slice.category}>{slice.category}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-semibold text-slate-800 block">{formatCurrency(slice.amount, preferences)}</span>
                        <span className="text-[9px] text-slate-400 block font-bold">{slice.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* ACCOUNT / CREDIT CARD BREAKDOWN VIZ */
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[180px] overflow-y-auto pr-1">
                  {accountSpends.map(acc => {
                    const icon = acc.type === 'bank' ? <Building className="w-4 h-4 text-slate-500" /> : <CreditCard className="w-4 h-4 text-slate-500" />;
                    return (
                      <div key={acc.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-1.5 min-w-0">
                            <span className="mt-0.5 shrink-0">{icon}</span>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[8px] font-extrabold text-slate-450 uppercase tracking-wider block">
                                {acc.institution}
                              </span>
                              <span className="text-xs font-bold text-slate-750 leading-tight truncate" title={acc.name}>
                                {acc.name.includes(' - ') ? acc.name.split(' - ').slice(1).join(' - ') : acc.name}
                              </span>
                            </div>
                          </div>
                          <span 
                            className="w-1.5 h-1.5 rounded-full shrink-0 mt-1"
                            style={{ backgroundColor: acc.color }}
                          ></span>
                        </div>
                        <div className="mt-2">
                          <span className="text-[8px] text-slate-400 uppercase font-bold block">Spend this Month</span>
                          <span className="text-sm font-bold text-slate-800">{formatCurrency(acc.amount, preferences)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Horizontal visual comparison */}
                <div className="mt-2">
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>Card outstanding vs. Bank spends allocation weights</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 flex overflow-hidden">
                    {accountSpends.map((acc) => {
                      const totalAccSpends = accountSpends.reduce((sum, a) => sum + a.amount, 0);
                      const width = totalAccSpends > 0 ? (acc.amount / totalAccSpends) * 100 : 0;
                      return (
                        <div 
                          key={acc.id}
                          className="h-full transition-all duration-300"
                          style={{ 
                            width: `${width}%`, 
                            backgroundColor: acc.color,
                          }}
                          title={`${acc.name}: ${formatCurrency(acc.amount, preferences)}`}
                        ></div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between text-[11px] text-slate-400">
            <span>Segment values based on active monthly log.</span>
            <button 
              onClick={() => setCurrentTab('budgets')}
              className="text-indigo-600 hover:underline font-semibold"
            >
              Modify Budgets &rarr;
            </button>
          </div>
        </div>

        {/* LARGE EXPENSES TRACKER */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-5 flex flex-col justify-between overflow-hidden relative">
          <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-indigo-600 rounded-full opacity-[0.04] pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex justify-between items-center pb-2 border-b border-slate-50">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                Large Expense Tracker
              </h2>
              <span className="text-[8px] bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-mono font-bold">
                &ge; {formatCurrency(threshold, preferences)}
              </span>
            </div>

            {/* Threshold ratio display */}
            <div className="my-3.5 bg-slate-50/55 dark:bg-slate-900/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60">
              <div className="flex justify-between text-[10px] font-semibold text-slate-550 dark:text-slate-300 mb-1.5">
                <span>Large Spends ({largeExpenses.length} items)</span>
                <span className="font-mono text-indigo-600">{totalOutflow > 0 ? ((totalLargeExpenses / totalOutflow) * 100).toFixed(0) : 0}% of flow</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 flex overflow-hidden">
                <div 
                  className="bg-amber-500 h-1.5 rounded-l-full" 
                  style={{ width: `${totalOutflow > 0 ? (totalLargeExpenses / totalOutflow) * 100 : 0}%` }}
                ></div>
                <div 
                  className="bg-emerald-500 h-1.5 rounded-r-full" 
                  style={{ width: `${totalOutflow > 0 ? (totalStandardExpenses / totalOutflow) * 100 : 105}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-2 text-[9px] font-bold">
                <span className="text-amber-600">{formatCurrency(totalLargeExpenses, preferences)} Large</span>
                <span className="text-emerald-600">{formatCurrency(totalStandardExpenses, preferences)} Routine</span>
              </div>
            </div>

            {/* Highlighting list of large expenses */}
            <div className="space-y-1.5 mt-2 max-h-[120px] overflow-y-auto pr-1">
              {largeExpenses.length === 0 ? (
                <div className="text-center py-5 border border-dashed border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/30 dark:bg-slate-900/20">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" />
                  <p className="text-[10px] text-slate-500 mt-1 font-medium">No transactions cross cap threshold.</p>
                </div>
              ) : (
                largeExpenses.slice(0, 4).map((exp, index) => {
                  const connectedAccName = accounts.find(a => a.id === exp.accountId)?.name || 'Direct';
                  return (
                    <div 
                      key={`${exp.id}_${index}`}
                      className="p-2 rounded-xl border border-slate-50 dark:border-slate-800/40 bg-slate-50/40 dark:bg-slate-900/30 flex items-center justify-between text-[11px] hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="truncate pr-2" title={exp.description}>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block truncate leading-tight" title={exp.description}>{exp.description}</span>
                        <span className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold block mt-0.5">{exp.category} • Paid with {connectedAccName}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block font-mono">{formatCurrency(exp.amount, preferences)}</span>
                        <span className="text-[8px] text-slate-400 font-bold block">{exp.date}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 relative z-10">
            <span>Automatic large outflow flags active.</span>
            <button 
              onClick={() => setCurrentTab('transactions')}
              className="text-indigo-600 hover:underline font-bold"
            >
              Full Ledger &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
