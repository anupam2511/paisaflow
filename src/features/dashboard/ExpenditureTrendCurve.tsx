/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FinanceData } from '../../types';
import { formatCurrency, formatCompactCurrency } from '../../utils/formatters';
import { TrendingUp } from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';

interface ExpenditureTrendCurveProps {
  data: FinanceData;
}

export default function ExpenditureTrendCurve({ data }: ExpenditureTrendCurveProps) {
  const { 
    accounts = [], 
    expenses = [], 
    budgets = [], 
    preferences 
  } = data;

  const [trendDimension, setTrendDimension] = useState<'category' | 'credit_card' | 'bank'>('category');
  const [selectedSubFilter, setSelectedSubFilter] = useState<string>('All');
  const [trendTimeFilter, setTrendTimeFilter] = useState<string>('All time');

  return (
    <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100/90 dark:border-slate-800/80 shadow-2xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-850">
        <div>
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-indigo-500 animate-pulse" />
            Dynamic Expenditure Trend Curve
          </h2>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            Segment parameters to plot direct chronological capital outflow trends.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-50 dark:bg-slate-900/60 p-0.5 rounded-lg border border-slate-150/60 dark:border-slate-800/60">
            <button
              type="button"
              onClick={() => {
                setTrendDimension('category');
                setSelectedSubFilter('All');
              }}
              className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded transition duration-200 cursor-pointer ${trendDimension === 'category' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              Category
            </button>
            <button
              type="button"
              onClick={() => {
                setTrendDimension('credit_card');
                setSelectedSubFilter('All');
              }}
              className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded transition duration-200 cursor-pointer ${trendDimension === 'credit_card' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              Card
            </button>
            <button
              type="button"
              onClick={() => {
                setTrendDimension('bank');
                setSelectedSubFilter('All');
              }}
              className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded transition duration-200 cursor-pointer ${trendDimension === 'bank' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              Bank
            </button>
          </div>

          <select
            value={selectedSubFilter}
            onChange={(e) => setSelectedSubFilter(e.target.value)}
            className="text-[10px] font-bold border border-slate-200 dark:border-slate-800 rounded p-1 bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-350 focus:outline-none cursor-pointer"
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
            className="text-[10px] font-bold border border-slate-200 dark:border-slate-800 rounded p-1 bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-350 focus:outline-none cursor-pointer"
          >
            <option value="All time">All time</option>
            <option value="Last 1 year">Last 1 year</option>
            <option value="Last 6 months">Last 6 months</option>
            <option value="Last 3 months">Last 3 months</option>
            <option value="Last 30 days">Last 30 days</option>
          </select>
        </div>
      </div>

      <div className="mt-4 w-full h-[240px]">
        {(() => {
          const filteredExpensesByTime = (() => {
            if (trendTimeFilter === 'All time') return expenses;
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const timeThreshold = new Date(now);
            if (trendTimeFilter === 'Last 30 days') {
              timeThreshold.setDate(now.getDate() - 30);
            } else if (trendTimeFilter === 'Last 3 months') {
              timeThreshold.setMonth(now.getMonth() - 3);
            } else if (trendTimeFilter === 'Last 6 months') {
              timeThreshold.setMonth(now.getMonth() - 6);
            } else if (trendTimeFilter === 'Last 1 year') {
              timeThreshold.setFullYear(now.getFullYear() - 1);
            }
            return expenses.filter(e => {
              if (e.category && e.category.toLowerCase() === 'transfer') return false;
              const expDate = new Date(e.date);
              if (isNaN(expDate.getTime())) return false;
              return expDate >= timeThreshold;
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
              <div className="flex flex-col items-center justify-center h-full border border-dashed border-slate-200 dark:border-slate-850 rounded-xl bg-slate-50/20 dark:bg-slate-900/10 p-4">
                <TrendingUp className="w-6 h-6 text-slate-300 dark:text-slate-650 animate-pulse" />
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-semibold">No transactions detected under selection.</p>
              </div>
            );
          }

          return (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendChartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-850" />
                <XAxis 
                  dataKey="label" 
                  stroke="#94a3b8" 
                  fontSize={9} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={5}
                  className="font-bold font-sans dark:fill-slate-500"
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={9} 
                  tickLine={false} 
                  axisLine={false} 
                  width={45}
                  tickFormatter={(v) => formatCompactCurrency(v, preferences)}
                  className="font-bold font-mono dark:fill-slate-500"
                />
                <Tooltip 
                  content={({ active, payload, label }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 dark:bg-slate-950 border border-slate-800 dark:border-slate-850 text-white p-2.5 rounded-lg shadow-md text-xs font-sans">
                          <p className="font-bold text-slate-400 dark:text-slate-550">{label}</p>
                          <p className="text-xs font-black text-indigo-300 dark:text-indigo-400 mt-0.5">
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
  );
}
