import React, { useState } from 'react';
import { FinanceData } from '../types';
import { formatCurrency, formatCompactCurrency } from '../utils/formatters';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  Legend 
} from 'recharts';
import { 
  TrendingUp, 
  Calendar, 
  HelpCircle, 
  Sparkles, 
  Sliders, 
  Percent, 
  ArrowUpRight, 
  Coins, 
  Layers 
} from 'lucide-react';
import { motion } from 'motion/react';

interface ForecastingSectionProps {
  data: FinanceData;
}

export default function ForecastingSection({ data }: ForecastingSectionProps) {
  const { accounts, incomes, expenses, recurringSpends, preferences, investments = [] } = data;

  // 1. Calculate historical/starting parameters dynamically
  const bankAccounts = accounts.filter(a => a.type === 'bank');
  const creditCards = accounts.filter(a => a.type === 'credit_card');
  const currentLiquid = bankAccounts.reduce((sum, a) => sum + a.balance, 0);
  const currentDebt = creditCards.reduce((sum, a) => sum + a.balance, 0);
  const startingNetWorth = currentLiquid - currentDebt;

  const currentInvestmentsValue = investments.reduce((sum, inv) => sum + inv.totalInvested, 0);

  // Dynamic monthly income
  const baseMonthlyIncome = incomes
    .filter(i => i.frequency === 'monthly')
    .reduce((sum, i) => sum + i.amount, 0) + 
    incomes.filter(i => i.frequency === 'one-time').reduce((sum, i) => sum + (i.amount / 12), 0); // amortized one-time inflows

  // Dynamic monthly expenses + EMIs + Subscriptions
  const baseMonthlyExpenses = expenses.reduce((sum, e) => sum + e.amount, 0) / Math.max(1, (expenses.length > 0 ? 3 : 1)); // average over 3 months or general
  const baseSubscriptions = recurringSpends.filter(s => s.isActive).reduce((sum, s) => sum + s.amount, 0);
  const baseEmis = (data.emis || []).filter(e => e.isActive).reduce((sum, e) => sum + e.amount, 0);
  const baseTotalExpenses = (baseMonthlyExpenses > 0 ? baseMonthlyExpenses : 15000) + baseSubscriptions + baseEmis;

  // Dynamic monthly SIP investment commitment
  const getMonthlyScaledInvestment = (inv: any) => {
    if (inv.investmentType === 'spot') return 0;
    const freq = inv.frequency || 'monthly';
    if (freq === 'monthly') return inv.amount;
    if (freq === 'quarterly') return inv.amount / 3;
    if (freq === 'yearly') return inv.amount / 12;
    return 0;
  };
  const baseMonthlySip = investments.reduce((sum, inv) => sum + getMonthlyScaledInvestment(inv), 0);

  // 2. User controlled projection sliders (state)
  const [projectionPeriods, setProjectionPeriods] = useState<number>(36); // months (3 years)
  const [expectedIncome, setExpectedIncome] = useState<number>(baseMonthlyIncome > 0 ? baseMonthlyIncome : 80000);
  const [expectedExpenses, setExpectedExpenses] = useState<number>(baseTotalExpenses > 0 ? baseTotalExpenses : 35000);
  const [expectedSip, setExpectedSip] = useState<number>(baseMonthlySip > 0 ? baseMonthlySip : 15000);
  const [expectedRoi, setExpectedRoi] = useState<number>(12); // 12% standard stock mutual funds India
  const [inflationRate, setInflationRate] = useState<number>(6); // 6% Standard CPI index India
  const [liquidGrowthRate, setLiquidGrowthRate] = useState<number>(3.5); // 3.5% Savings Bank Interest

  // Calculates Compound Interest monthly trajectories
  const generateProjectionData = () => {
    const list = [];
    let cumulativeCash = currentLiquid - currentDebt;
    let cumulativeInvestments = currentInvestmentsValue;

    // Projected alternate paths
    let cumulativeInvestmentsOptimistic = currentInvestmentsValue;
    let cumulativeInvestmentsConservative = currentInvestmentsValue;

    const monthlyRoi = expectedRoi / 100 / 12;
    const monthlyRoiOptimistic = (expectedRoi + 3) / 100 / 12;
    const monthlyRoiConservative = (expectedRoi - 3) / 100 / 12;

    const monthlyInflation = inflationRate / 100 / 12;
    const monthlyLiquidGrowth = liquidGrowthRate / 100 / 12;

    const netMonthlySavings = expectedIncome - expectedExpenses - expectedSip;

    const now = new Date();

    for (let m = 0; m <= projectionPeriods; m++) {
      const futureDate = new Date(now.getFullYear(), now.getMonth() + m, 1);
      const label = futureDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

      // Apply inflation adjustment over monthly expense base only (optional visualization factor)
      // Compound expected interest on prior holdings
      if (m > 0) {
        // Growth on Liquid balances
        cumulativeCash = cumulativeCash * (1 + monthlyLiquidGrowth) + netMonthlySavings;

        // Compounding on Investment Portfolio
        cumulativeInvestments = (cumulativeInvestments + expectedSip) * (1 + monthlyRoi);
        cumulativeInvestmentsOptimistic = (cumulativeInvestmentsOptimistic + expectedSip) * (1 + monthlyRoiOptimistic);
        cumulativeInvestmentsConservative = (cumulativeInvestmentsConservative + expectedSip) * (1 + monthlyRoiConservative);
      }

      const totalNetWorth = Math.round(cumulativeCash + cumulativeInvestments);
      const totalNetWorthOptimistic = Math.round(cumulativeCash + cumulativeInvestmentsOptimistic);
      const totalNetWorthConservative = Math.round(cumulativeCash + cumulativeInvestmentsConservative);

      list.push({
        monthIndex: m,
        label,
        CashReserves: Math.round(cumulativeCash),
        InvestmentShares: Math.round(cumulativeInvestments),
        'Balanced Net Worth': totalNetWorth,
        'Optimistic Outlook (ROI +3%)': totalNetWorthOptimistic,
        'Conservative Outlook (ROI -3%)': totalNetWorthConservative,
      });
    }
    return list;
  };

  const chartData = generateProjectionData();
  const endingDataPoint = chartData[chartData.length - 1];

  const totalAddedSavings = (expectedIncome - expectedExpenses) * projectionPeriods;
  const netGrowthEarned = (endingDataPoint['Balanced Net Worth'] - startingNetWorth - currentInvestmentsValue) - totalAddedSavings;

  return (
    <div id="forecasting-wrapper" className="space-y-6">
      
      {/* HEADER SECTION */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-500 shrink-0" />
          Wealth Forecast & Net Worth Projection Engine
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Simulate compound growth, monthly cash envelopes, active systematic investments (SIPs), and long-term capital horizons.
        </p>
      </div>

      {/* CORE CONTROL SLIDERS & DYNAMIC READOUTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SLIDERS INPUT CONSOLE */}
        <div className="bg-white dark:bg-[#0b1329] rounded-2xl border border-slate-150 dark:border-slate-800 p-5 lg:col-span-4 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Simulation Sliders</h3>
          </div>

          {/* PERIODS */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-600 dark:text-slate-400">Forecasting Period</span>
              <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">{projectionPeriods} Months ({Math.round(projectionPeriods / 12 * 10) / 10} Years)</span>
            </div>
            <input
              type="range"
              min="3"
              max="120"
              step="3"
              value={projectionPeriods}
              onChange={(e) => setProjectionPeriods(parseInt(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          {/* INCOME */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-600 dark:text-slate-400">Monthly Inflow (Expected)</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(expectedIncome, preferences)}</span>
            </div>
            <input
              type="range"
              min={Math.max(10000, expectedIncome - 80000)}
              max={expectedIncome + 120000}
              step="1000"
              value={expectedIncome}
              onChange={(e) => setExpectedIncome(parseInt(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          {/* EXPENSES */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-600 dark:text-slate-400">Monthly Expenses (Expected)</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(expectedExpenses, preferences)}</span>
            </div>
            <input
              type="range"
              min="5000"
              max={expectedIncome}
              step="1000"
              value={expectedExpenses}
              onChange={(e) => setExpectedExpenses(parseInt(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          {/* SIP */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-600 dark:text-slate-400">Monthly SIP Contribution</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(expectedSip, preferences)}</span>
            </div>
            <input
              type="range"
              min="0"
              max={expectedIncome - expectedExpenses}
              step="500"
              value={expectedSip}
              onChange={(e) => setExpectedSip(parseInt(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          {/* RETURN ON INVESTMENTS */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-600 dark:text-slate-400">Expected ROI (Annual %)</span>
              <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5"><Percent className="w-3.5 h-3.5" />{expectedRoi}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="0.5"
              value={expectedRoi}
              onChange={(e) => setExpectedRoi(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* INFLATION */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-600 dark:text-slate-400">Annual inflation (%)</span>
              <span className="font-mono font-bold text-rose-550 dark:text-rose-400">{inflationRate}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="15"
              step="0.5"
              value={inflationRate}
              onChange={(e) => setInflationRate(parseFloat(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
          </div>

          {/* SUMMARY META CARDS */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[10.5px] leading-relaxed text-slate-400 space-y-1">
            <p>• Starts with actual net capital: <strong>{formatCurrency(startingNetWorth, preferences)}</strong></p>
            <p>• Starting investment holdings: <strong>{formatCurrency(currentInvestmentsValue, preferences)}</strong></p>
            <p>• Liquid growth: compounded savings bank interest base at <strong>{liquidGrowthRate}% APR</strong>.</p>
          </div>
        </div>

        {/* VISUAL CHART AREA */}
        <div className="bg-white dark:bg-[#0b1329] rounded-2xl border border-slate-150 dark:border-slate-800 p-5 lg:col-span-8 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Compounding Growth Projection Lines
            </h3>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 font-extrabold px-2 py-0.5 rounded text-indigo-600">
              Future Net Worth
            </span>
          </div>

          {/* CHART ELEMENT */}
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="forecastNormal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="forecastOptimistic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800/50" />
                <XAxis 
                  dataKey="label" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10} 
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(v) => formatCompactCurrency(v, preferences)}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 'bold' }}
                  itemStyle={{ fontSize: '11px', fontWeight: 'semibold', padding: '1px 0' }}
                  formatter={(value: any) => [formatCurrency(value, preferences), '']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '15px' }} />
                
                <Area 
                  type="monotone" 
                  dataKey="Conservative Outlook (ROI -3%)" 
                  stroke="#f43f5e" 
                  strokeWidth={1.5}
                  fill="none" 
                  dot={false}
                />
                <Area 
                  type="monotone" 
                  dataKey="Balanced Net Worth" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#forecastNormal)" 
                  dot={false}
                />
                <Area 
                  type="monotone" 
                  dataKey="Optimistic Outlook (ROI +3%)" 
                  stroke="#10b981" 
                  strokeWidth={1.5}
                  fillOpacity={0.5} 
                  fill="url(#forecastOptimistic)" 
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* DYNAMIC ANALYSIS HIGHLIGHT ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-xl">
              <span className="text-[9px] text-slate-400 uppercase font-black">Forecast Net Worth</span>
              <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                {formatCurrency(endingDataPoint['Balanced Net Worth'], preferences)}
              </p>
              <span className="text-[8px] text-slate-400">At month {projectionPeriods}</span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-xl">
              <span className="text-[9px] text-slate-400 uppercase font-black">Growth Multiplex Gain</span>
              <p className="text-sm font-black text-emerald-600 dark:text-emerald-450 font-mono mt-0.5">
                +{formatCurrency(netGrowthEarned > 0 ? netGrowthEarned : 0, preferences)}
              </p>
              <span className="text-[8px] text-slate-400">Net compounding returns</span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-xl">
              <span className="text-[9px] text-slate-400 uppercase font-black">Monthly Net Savings</span>
              <p className="text-sm font-black text-slate-800 dark:text-slate-200 mt-0.5 font-mono">
                {formatCurrency(expectedIncome - expectedExpenses, preferences)}
              </p>
              <span className="text-[8px] text-slate-400">Saved/mo (inclusive of SIP)</span>
            </div>
          </div>

        </div>

      </div>

      {/* HORIZONTAL TIMELINE LOG TABLE */}
      <div className="bg-white dark:bg-[#0b1329] rounded-3xl border border-slate-100 dark:border-slate-800/80 p-6 shadow-xs mt-6">
        <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mb-4">Compounding Milestones Logs</h3>
        <div className="w-full overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800/80">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                <th className="py-3 px-4 text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest">Period Milestone</th>
                <th className="py-3 px-4 text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest text-right">Cash Reserves Base</th>
                <th className="py-3 px-4 text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest text-right">Investments Growth</th>
                <th className="py-3 px-4 text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest text-right">Net Worth (Cons)</th>
                <th className="py-3 px-4 text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest text-right">Net Worth (Balanced)</th>
                <th className="py-3 px-4 text-[10px] font-black text-emerald-500 dark:text-emerald-400 uppercase tracking-widest text-right">Net Worth (Optimistic)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-[#0b1329]">
              {chartData
                .filter((_, idx) => idx === 0 || idx % 12 === 0 || idx === chartData.length - 1)
                .map((row) => (
                  <tr key={row.monthIndex} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 px-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                      {row.monthIndex === 0 ? 'Starting Point' : `Year ${row.monthIndex / 12} (${row.label})`}
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-right font-mono text-slate-600 dark:text-slate-400">{formatCurrency(row.CashReserves, preferences)}</td>
                    <td className="py-3 px-4 text-xs font-semibold text-right font-mono text-slate-600 dark:text-slate-400">{formatCurrency(row.InvestmentShares, preferences)}</td>
                    <td className="py-3 px-4 text-xs font-semibold text-right font-mono text-rose-600 dark:text-rose-400">{formatCurrency(row['Conservative Outlook (ROI -3%)'], preferences)}</td>
                    <td className="py-3 px-4 text-xs font-bold text-right font-mono text-indigo-600 dark:text-indigo-400">{formatCurrency(row['Balanced Net Worth'], preferences)}</td>
                    <td className="py-3 px-4 text-xs font-bold text-right font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(row['Optimistic Outlook (ROI +3%)'], preferences)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
