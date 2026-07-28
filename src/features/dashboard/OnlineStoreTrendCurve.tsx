/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { FinanceData } from '../../types';
import { formatCurrency, formatCompactCurrency } from '../../utils/formatters';
import { ShoppingBag, HelpCircle, Eye, EyeOff } from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip 
} from 'recharts';

interface OnlineStoreTrendCurveProps {
  data: FinanceData;
}

const STORE_COLORS: { [key: string]: string } = {
  'amazon now': '#ff9900', // Amazon orange
  'flipkart': '#0ea5e9',   // Flipkart sky-blue
  'uber': '#38bdf8',       // Uber bright cyan for contrast
  'zomato': '#ef4444',     // Zomato red
  'swiggy': '#f97316',     // Swiggy orange
  'myntra': '#ec4899',     // Myntra pink
};

const DEFAULT_COLORS = [
  '#a78bfa', // violet
  '#f472b6', // pink
  '#fb7185', // rose
  '#fb923c', // orange
  '#facc15', // yellow
  '#4ade80', // green
  '#60a5fa', // blue
  '#34d399', // emerald
];

export type OnlineStoreTimeframe = 
  | 'All time'
  | 'Last 1 year'
  | 'Last 6 months'
  | 'Last 3 months'
  | 'Last 30 days'
  | 'Last 7 days';

export default function OnlineStoreTrendCurve({ data }: OnlineStoreTrendCurveProps) {
  const { expenses = [], preferences } = data;
  const [timeframe, setTimeframe] = useState<OnlineStoreTimeframe>('Last 6 months');
  const [hiddenStores, setHiddenStores] = useState<Set<string>>(new Set());

  const currentStores = useMemo(() => {
    return preferences?.onlineStores || [
      'Amazon Now',
      'Flipkart',
      'Uber',
      'Zomato',
      'Swiggy',
      'Myntra'
    ];
  }, [preferences?.onlineStores]);

  // Compute the list of points for Recharts based on timeframe choice (daily or monthly)
  const chartData = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const list: { key: string; label: string; isDaily: boolean; year: number; month: number; date?: number }[] = [];

    if (timeframe === 'Last 7 days' || timeframe === 'Last 30 days') {
      const daysCount = timeframe === 'Last 7 days' ? 7 : 30;
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const label = `${monthNames[d.getMonth()]} ${d.getDate()}`;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        
        list.push({
          key,
          label,
          isDaily: true,
          year: d.getFullYear(),
          month: d.getMonth(),
          date: d.getDate()
        });
      }
    } else {
      let monthsCount = 6;
      if (timeframe === 'Last 3 months') monthsCount = 3;
      else if (timeframe === 'Last 6 months') monthsCount = 6;
      else if (timeframe === 'Last 1 year') monthsCount = 12;
      else if (timeframe === 'All time') {
        if (expenses.length > 0) {
          const sortedDates = expenses
            .map(e => new Date(e.date))
            .filter(d => !isNaN(d.getTime()))
            .sort((a, b) => a.getTime() - b.getTime());
          if (sortedDates.length > 0) {
            const oldest = sortedDates[0];
            const diffYears = today.getFullYear() - oldest.getFullYear();
            const diffMonths = today.getMonth() - oldest.getMonth();
            monthsCount = Math.max(6, diffYears * 12 + diffMonths + 1);
            monthsCount = Math.min(monthsCount, 60); // Cap at 5 years for performance
          } else {
            monthsCount = 24;
          }
        } else {
          monthsCount = 24;
        }
      }

      for (let i = monthsCount - 1; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }).replace(' ', "'");
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        
        list.push({
          key,
          label,
          isDaily: false,
          year: d.getFullYear(),
          month: d.getMonth()
        });
      }
    }

    return list.map(item => {
      const point: any = {
        month: item.label,
        rawKey: item.key
      };
      
      let totalSpends = 0;
      
      currentStores.forEach(store => {
        const storeExpenses = expenses.filter(exp => {
          if (!exp.store) return false;
          if (exp.category?.toLowerCase() === 'transfer') return false;
          
          const isSameStore = exp.store.toLowerCase() === store.toLowerCase();
          if (!isSameStore) return false;

          const expDate = new Date(exp.date);
          if (item.isDaily) {
            return (
              expDate.getFullYear() === item.year &&
              expDate.getMonth() === item.month &&
              expDate.getDate() === item.date
            );
          } else {
            return (
              expDate.getFullYear() === item.year &&
              expDate.getMonth() === item.month
            );
          }
        });

        const spend = storeExpenses.reduce((sum, e) => sum + e.amount, 0);
        point[store] = spend;

        if (!hiddenStores.has(store)) {
          totalSpends += spend;
        }
      });
      
      point['Total Store Spends'] = totalSpends;
      return point;
    });
  }, [timeframe, currentStores, expenses, hiddenStores]);

  // Determine if there is any store spend data across the chart points
  const hasSpendData = useMemo(() => {
    return chartData.some(point => {
      return currentStores.some(store => (point[store] || 0) > 0);
    });
  }, [chartData, currentStores]);

  const getStoreColor = (storeName: string, index: number) => {
    const lower = storeName.toLowerCase();
    if (STORE_COLORS[lower]) return STORE_COLORS[lower];
    return DEFAULT_COLORS[index % DEFAULT_COLORS.length];
  };

  const toggleStoreVisibility = (store: string) => {
    setHiddenStores(prev => {
      const updated = new Set(prev);
      if (updated.has(store)) {
        updated.delete(store);
      } else {
        updated.add(store);
      }
      return updated;
    });
  };

  return (
    <div id="online-store-trend-card" className="bg-[#050814] dark:bg-[#030611] border border-slate-850 rounded-3xl p-6 shadow-xl text-left text-slate-100">
      
      {/* HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20 shrink-0">
            <ShoppingBag className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              Online Store Merchant Trend HUD
            </h3>
            <p className="text-[11px] text-slate-450 dark:text-slate-500 font-medium mt-0.5">
              Tracks shopping, food, grocery, and ride-hailing merchant spend distribution curves
            </p>
          </div>
        </div>

        {/* Timeframe selector dropdown */}
        <div className="relative shrink-0 self-end sm:self-auto">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as OnlineStoreTimeframe)}
            className="appearance-none bg-[#0a0f24] hover:bg-[#0e1635] text-slate-200 hover:text-white font-extrabold text-xs px-4 py-2.5 pr-10 rounded-2xl border border-slate-800 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer shadow-md shadow-black/40 text-left"
          >
            <option value="All time" className="bg-[#050814]">All time</option>
            <option value="Last 1 year" className="bg-[#050814]">Last 1 year</option>
            <option value="Last 6 months" className="bg-[#050814]">Last 6 months</option>
            <option value="Last 3 months" className="bg-[#050814]">Last 3 months</option>
            <option value="Last 30 days" className="bg-[#050814]">Last 30 days</option>
            <option value="Last 7 days" className="bg-[#050814]">Last 7 days</option>
          </select>
          {/* Custom chevron indicator */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </div>
      </div>

      {/* CORE VISUALIZATION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
        
        {/* CHART PORT */}
        <div className="lg:col-span-3 h-[340px] w-full">
          {!hasSpendData ? (
            <div className="flex flex-col items-center justify-center h-full border border-dashed border-slate-800 rounded-2xl bg-slate-950/20 p-6 text-center">
              <HelpCircle className="w-8 h-8 text-slate-700 animate-bounce" />
              <p className="text-xs text-slate-400 mt-2 font-black uppercase">No Merchant Spends Logged</p>
              <p className="text-[10px] text-slate-550 max-w-xs mt-1">
                Assign an "Online Store/App" when logging or editing expenses to plot beautiful merchant analytics here.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <defs>
                  {/* Total Store Spends Gradient */}
                  <linearGradient id="totalStoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                  
                  {/* Store Gradients */}
                  {currentStores.map((store, idx) => {
                    const color = getStoreColor(store, idx);
                    return (
                      <linearGradient key={`grad-${store}`} id={`grad-${store}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    );
                  })}
                </defs>

                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#111827" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 9, fontWeight: 'bold', fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 9, fontWeight: 'bold', fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatCompactCurrency(v, preferences)}
                />
                <RechartsTooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-950 border border-slate-800 text-white p-4 rounded-2xl shadow-2xl text-[11px] font-sans min-w-[220px] space-y-2 text-left">
                          <p className="font-extrabold text-slate-400 border-b border-slate-850 pb-1.5 mb-1.5">{label}</p>
                          <div className="space-y-1.5 font-mono">
                            {payload.map((p: any, idx: number) => {
                              if (p.value === undefined || p.value === null) return null;
                              const isTotal = p.name === 'Total Store Spends';
                              return (
                                <div key={idx} className={`flex items-center justify-between gap-4 ${isTotal ? 'border-t border-slate-850 pt-1.5 mt-1 text-indigo-300 font-extrabold' : ''}`}>
                                  <div className="flex items-center gap-1.5">
                                    <span 
                                      className="w-1.5 h-1.5 rounded-full" 
                                      style={{ backgroundColor: p.color || '#fff' }}
                                    ></span>
                                    <span className="text-slate-350">{p.name}</span>
                                  </div>
                                  <span className="text-white">{formatCurrency(p.value, preferences)}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                
                {/* Total Line Area */}
                <Area
                  type="monotone"
                  dataKey="Total Store Spends"
                  name="Total Store Spends"
                  stroke="#818cf8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#totalStoreGrad)"
                />

                {/* Individual Store Areas */}
                {currentStores.map((store, idx) => {
                  if (hiddenStores.has(store)) return null;
                  const color = getStoreColor(store, idx);
                  return (
                    <Area
                      key={store}
                      type="monotone"
                      dataKey={store}
                      name={store}
                      stroke={color}
                      strokeWidth={1.5}
                      fillOpacity={1}
                      fill={`url(#grad-${store})`}
                    />
                  );
                })}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* LEGEND SEGMENTS PANEL */}
        <div className="flex flex-col gap-2 bg-slate-900/30 p-4 rounded-2xl border border-slate-850 h-full max-h-[340px] overflow-y-auto">
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2">
            Store Legend & Filter
          </p>
          {currentStores.map((store, idx) => {
            const isHidden = hiddenStores.has(store);
            const color = getStoreColor(store, idx);
            
            // Calculate total spent on this store across the visible timeframe
            const storeSum = chartData.reduce((sum, point) => sum + (point[store] || 0), 0);

            return (
              <button
                key={store}
                type="button"
                onClick={() => toggleStoreVisibility(store)}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition duration-200 cursor-pointer ${
                  isHidden 
                    ? 'border-transparent bg-slate-950/20 opacity-40 hover:opacity-60' 
                    : 'border-slate-850 bg-slate-950/40 hover:bg-slate-950/70 hover:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: color }}></span>
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-200 truncate">{store}</p>
                    <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                      Total: {formatCurrency(storeSum, preferences)}
                    </p>
                  </div>
                </div>
                {isHidden ? (
                  <EyeOff className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-2" />
                ) : (
                  <Eye className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>

      </div>

    </div>
  );
}
