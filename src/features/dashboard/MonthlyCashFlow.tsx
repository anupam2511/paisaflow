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
  TrendingUp,
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

  // Trend graph states
  const [trendDimension, setTrendDimension] = useState<'category' | 'credit_card' | 'bank'>('category');
  const [selectedSubFilter, setSelectedSubFilter] = useState<string>('All');
  const [trendTimeFilter, setTrendTimeFilter] = useState<string>('All time');

  // Basic monthly calculations
  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
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

  // Spends by Category
  const categorySpends = budgets.map(b => {
    const amount = expenses
      .filter(e => e.category.toLowerCase() === b.category.toLowerCase())
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

  // Spends by Account / Card
  const accountSpends = accounts.map(acc => {
    const amount = expenses
      .filter(e => e.accountId === acc.id)
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

  // Large Expenses calculations
  const threshold = preferences.largeExpenseThreshold || 20000;
  const largeExpenses = expenses.filter(e => e.amount >= threshold);
  const totalLargeExpenses = largeExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalStandardExpenses = totalExpenses - totalLargeExpenses;

  return (
    <div className="space-y-6">
      {/* COMPACT ACTIVE MONTHLY GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* INCOME */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col justify-between shadow-xs">
          <span className="text-[9px] font-extrabold text-emerald-600 uppercase tracking-wider">Inflow</span>
          <div className="mt-2">
            <span className="text-[10px] text-slate-400 block font-medium uppercase">Expected Inflow</span>
            <p className="text-base font-black text-slate-800 font-mono">{formatCurrency(totalIncome, preferences)}</p>
          </div>
        </div>

        {/* EXPENSES */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col justify-between shadow-xs">
          <span className="text-[9px] font-extrabold text-rose-600 uppercase tracking-wider">Outflow</span>
          <div className="mt-2">
            <span className="text-[10px] text-slate-400 block font-medium uppercase">Variable Spend</span>
            <p className="text-base font-black text-slate-800 font-mono">{formatCurrency(totalExpenses, preferences)}</p>
          </div>
        </div>

        {/* EMIs */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col justify-between shadow-xs">
          <span className="text-[9px] font-extrabold text-indigo-600 uppercase tracking-wider">Debt Load</span>
          <div className="mt-2">
            <span className="text-[10px] text-slate-400 block font-medium uppercase">EMI Obligations</span>
            <p className="text-base font-black text-slate-800 font-mono">{formatCurrency(totalActiveEmiMonthlyBurden, preferences)}</p>
          </div>
        </div>

        {/* SUBSCRIPTIONS */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col justify-between shadow-xs">
          <span className="text-[9px] font-extrabold text-violet-600 uppercase tracking-wider">Fixed Overhead</span>
          <div className="mt-2">
            <span className="text-[10px] text-slate-400 block font-medium uppercase">Subscriptions</span>
            <p className="text-base font-black text-slate-800 font-mono">{formatCurrency(totalRecurring, preferences)}</p>
          </div>
        </div>

        {/* BUDGET & SURPLUS */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col justify-between shadow-xs">
          <span className={`text-[9px] font-extrabold uppercase tracking-wider ${netMonthlyFlow >= 0 ? 'text-teal-600' : 'text-rose-600'}`}>
            {netMonthlyFlow >= 0 ? 'Surplus' : 'Deficit'}
          </span>
          <div className="mt-2">
            <span className="text-[10px] text-slate-400 block font-medium uppercase">Net Cash Flow</span>
            <p className={`text-base font-black font-mono ${netMonthlyFlow >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
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
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: slice.color }}></span>
                        <span className="text-xs text-slate-650 font-medium truncate">{slice.category}</span>
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
                              <span className="text-xs font-bold text-slate-750 leading-tight truncate">
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
                      <div className="truncate pr-2">
                        <span className="font-bold text-slate-800 block truncate leading-tight">{exp.description}</span>
                        <span className="text-[9px] text-slate-455 dark:text-slate-400 font-semibold block mt-0.5">{exp.category} • Paid with {connectedAccName}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-slate-800 block font-mono">{formatCurrency(exp.amount, preferences)}</span>
                        <span className="text-[8px] text-slate-400 font-bold block">{exp.date}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-455 dark:text-slate-400 relative z-10">
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

      {/* DYNAMIC EXPENDITURE TREND CURVE VISUALIZER */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-50">
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-500 animate-pulse" />
              Dynamic Expenditure Trend Curve
            </h2>
            <p className="text-[11px] text-slate-400">
              Segment parameters to plot direct chronological capital outflow trends.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-slate-50 p-0.5 rounded-lg border border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setTrendDimension('category');
                  setSelectedSubFilter('All');
                }}
                className={`text-[9px] font-bold px-2 py-1 rounded transition duration-200 ${trendDimension === 'category' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
              >
                Category
              </button>
              <button
                type="button"
                onClick={() => {
                  setTrendDimension('credit_card');
                  setSelectedSubFilter('All');
                }}
                className={`text-[9px] font-bold px-2 py-1 rounded transition duration-200 ${trendDimension === 'credit_card' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
              >
                Card
              </button>
              <button
                type="button"
                onClick={() => {
                  setTrendDimension('bank');
                  setSelectedSubFilter('All');
                }}
                className={`text-[9px] font-bold px-2 py-1 rounded transition duration-200 ${trendDimension === 'bank' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
              >
                Bank
              </button>
            </div>

            <select
              value={selectedSubFilter}
              onChange={(e) => setSelectedSubFilter(e.target.value)}
              className="text-[10px] font-bold border border-slate-200 rounded p-1 bg-slate-50 text-slate-600 focus:outline-none"
            >
              {trendDimension === 'category' && (
                <>
                  <option value="All">All Categories</option>
                  {budgets.map(b => (
                    <option key={b.category} value={b.category}>{b.category}</option>
                  ))}
                </>
              )}
              {trendDimension === 'credit_card' && (
                <>
                  <option value="All">All Cards</option>
                  {accounts.filter(a => a.type === 'credit_card').map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </>
              )}
              {trendDimension === 'bank' && (
                <>
                  <option value="All">All Bank Accounts</option>
                  {accounts.filter(a => a.type === 'bank').map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </>
              )}
            </select>

            <select
              value={trendTimeFilter}
              onChange={(e) => setTrendTimeFilter(e.target.value)}
              className="text-[10px] font-bold border border-slate-200 rounded p-1 bg-slate-50 text-slate-600 focus:outline-none"
            >
              <option value="All time">All time</option>
              <option value="Last 1 year">Last 1 year</option>
              <option value="Last 6 months">Last 6 months</option>
              <option value="Last 3 months">Last 3 months</option>
              <option value="Last 30 days">Last 30 days</option>
            </select>
          </div>
        </div>

        <div className="mt-4 w-full h-[220px]">
          {(() => {
            const filteredExpensesByTime = (() => {
              if (trendTimeFilter === 'All time') return expenses;
              const now = new Date();
              now.setHours(0, 0, 0, 0);
              const threshold = new Date(now);
              if (trendTimeFilter === 'Last 30 days') {
                threshold.setDate(now.getDate() - 30);
              } else if (trendTimeFilter === 'Last 3 months') {
                threshold.setMonth(now.getMonth() - 3);
              } else if (trendTimeFilter === 'Last 6 months') {
                threshold.setMonth(now.getMonth() - 6);
              } else if (trendTimeFilter === 'Last 1 year') {
                threshold.setFullYear(now.getFullYear() - 1);
              }
              return expenses.filter(e => {
                const expDate = new Date(e.date);
                if (isNaN(expDate.getTime())) return false;
                return expDate >= threshold;
              });
            })();

            const uniqueDates = Array.from(new Set(filteredExpensesByTime.map(e => e.date))).sort();
            const baseDates = uniqueDates.length > 0 ? uniqueDates : [
              '2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05', 
              '2026-06-06', '2026-06-07', '2026-06-08', '2026-06-09', '2026-06-10'
            ];

            const trendChartData = baseDates.map(dateStr => {
              const matchingExpenses = filteredExpensesByTime.filter(e => {
                if (e.date !== dateStr) return false;

                if (trendDimension === 'category') {
                  if (selectedSubFilter === 'All') return true;
                  return e.category.toLowerCase() === selectedSubFilter.toLowerCase();
                } else if (trendDimension === 'credit_card') {
                  const card = accounts.find(a => a.id === e.accountId);
                  if (!card || card.type !== 'credit_card') return false;
                  if (selectedSubFilter === 'All') return true;
                  return card.id === selectedSubFilter;
                } else {
                  const bank = accounts.find(a => a.id === e.accountId);
                  if (!bank || bank.type !== 'bank') return false;
                  if (selectedSubFilter === 'All') return true;
                  return bank.id === selectedSubFilter;
                }
              });

              const sum = matchingExpenses.reduce((total, exp) => total + exp.amount, 0);

              let dateLabel = dateStr;
              try {
                const parts = dateStr.split('-');
                if (parts.length === 3) {
                  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                  const monthIdx = parseInt(parts[1], 10) - 1;
                  const dayNum = parseInt(parts[2], 10);
                  if (monthIdx >= 0 && monthIdx < 12) {
                    dateLabel = `${monthNames[monthIdx]} ${dayNum}`;
                  }
                }
              } catch (err) {}

              return {
                rawDate: dateStr,
                label: dateLabel,
                amount: sum,
              };
            });

            const allZero = trendChartData.every(item => item.amount === 0);

            if (allZero && expenses.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center h-full border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/20 dark:bg-slate-900/10 p-4">
                  <TrendingUp className="w-6 h-6 text-slate-300 animate-pulse" />
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">No transactions detected under selection.</p>
                </div>
              );
            }

            return (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendChartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="label" 
                    stroke="#94a3b8" 
                    fontSize={9} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={5}
                    className="font-semibold font-sans"
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={9} 
                    tickLine={false} 
                    axisLine={false} 
                    width={45}
                    tickFormatter={(v) => formatCompactCurrency(v, preferences)}
                  />
                  <Tooltip 
                    content={({ active, payload, label }: any) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 border border-slate-800 text-white p-2.5 rounded-lg shadow-md text-xs font-sans">
                            <p className="font-bold text-slate-400">{label}</p>
                            <p className="text-xs font-black text-indigo-300 mt-0.5">
                              Day spend: {formatCurrency(payload[0].value, preferences)}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#6366f1" 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#trendGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
