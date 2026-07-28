/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { FinanceData } from '../../types';
import { formatMonthYear } from '../../utils/formatters';
import { Compass, Activity, AlertTriangle, Target, Coins, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Component Imports
import FinancialOverview from './FinancialOverview';
import MonthlyCashFlow from './MonthlyCashFlow';
import AttentionRequired from './AttentionRequired';
import NetWorthSummary from './NetWorthSummary';
import UpcomingCommitments from './UpcomingCommitments';
import ExpenditureTrendCurve from './ExpenditureTrendCurve';
import OnlineStoreTrendCurve from './OnlineStoreTrendCurve';

interface DashboardProps {
  data: FinanceData;
  setFinanceData: React.Dispatch<React.SetStateAction<FinanceData>>;
  setCurrentTab: (tab: string) => void;
}

export default function Dashboard({ data, setFinanceData, setCurrentTab }: DashboardProps) {
  const { accounts = [], preferences } = data;
  const [isAlertsCollapsed, setIsAlertsCollapsed] = useState(false);

  const capitalPositionStatus = useMemo(() => {
    const bankAccounts = accounts.filter(a => a.type === 'bank');
    const totalBankCash = bankAccounts.reduce((sum, a) => sum + a.balance, 0);
    const allocatedEmergency = preferences.emergencyAllocated || 0;
    const isReserveBreached = allocatedEmergency > 0 && totalBankCash < allocatedEmergency;

    const cards = accounts.filter(a => a.type === 'credit_card');
    const totalCcLimit = cards.reduce((sum, a) => sum + (a.limit || 0), 0);
    const totalCcBalance = cards.reduce((sum, a) => sum + a.balance, 0);
    const ccUtil = totalCcLimit > 0 ? (totalCcBalance / totalCcLimit) * 100 : 0;

    if (isReserveBreached) {
      return {
        label: 'Emergency Reserve Breached',
        color: 'text-rose-700 bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30 dark:text-rose-400',
        dotColor: 'bg-rose-500'
      };
    }
    if (ccUtil >= 50) {
      return {
        label: 'High Credit Utilization',
        color: 'text-amber-700 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30 dark:text-amber-400',
        dotColor: 'bg-amber-500'
      };
    }
    if (ccUtil >= 30) {
      return {
        label: 'Balanced Position',
        color: 'text-indigo-700 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-150 dark:border-indigo-900/30 dark:text-indigo-400',
        dotColor: 'bg-indigo-500'
      };
    }
    return {
      label: 'Healthy & Secure',
      color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-150 dark:border-emerald-900/30 dark:text-emerald-400',
      dotColor: 'bg-emerald-500'
    };
  }, [accounts, preferences]);

  return (
    <div id="dashboard-root" className="space-y-8 pb-8">
      {/* HEADER UTILITY BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-150/60 dark:border-slate-850 pb-5">
        <div>
          <h1 id="dashboard-title" className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
            Personal Financial Intelligence
          </h1>
          <p id="dashboard-subtitle" className="text-slate-400 dark:text-slate-500 text-xs mt-1 font-sans font-medium">
            Overview of {formatMonthYear(new Date().toISOString().split('T')[0])} • Organized, automated real-time tracking
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className={`text-[10px] font-black px-3 py-1.5 rounded-full border flex items-center gap-1.5 font-sans uppercase tracking-wider shrink-0 shadow-2xs ${capitalPositionStatus.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${capitalPositionStatus.dotColor} animate-pulse`}></span>
            Capital Position: {capitalPositionStatus.label}
          </span>
        </div>
      </div>

      {/* SECTION 1: Where am I today? (Full-Width Balance Sheet Cards) */}
      <div className="space-y-4">
        <FinancialOverview data={data} setCurrentTab={setCurrentTab} />
      </div>

      {/* SECTION 3: Priority Intelligence Alerts (Full Width Horizontal Deck with Accordion) */}
      <div className="space-y-4 bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100/90 dark:border-slate-800/80 shadow-2xs">
        <div 
          onClick={() => setIsAlertsCollapsed(!isAlertsCollapsed)}
          className="flex items-center justify-between cursor-pointer select-none group"
        >
          <div className="flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-rose-500"></span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Priority Intelligence Alerts
                </h2>
                <span className="text-[8px] font-black uppercase bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded-sm">
                  System Guard
                </span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Automated risk indicators, credit thresholds, and urgent insights requiring attention</p>
            </div>
          </div>
          <button className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-colors text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 cursor-pointer">
            {isAlertsCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
        
        <AnimatePresence initial={false}>
          {!isAlertsCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-slate-100 dark:border-slate-850">
                <AttentionRequired data={data} setCurrentTab={setCurrentTab} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* TWO-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:items-stretch items-start">
        {/* LEFT COLUMN - Primary Financial Flow (lg:col-span-8) */}
        <div className="lg:col-span-8 flex flex-col">
          {/* SECTION 2: Active Monthly Flow & Spends */}
          <div className="space-y-4 h-full flex flex-col">
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-1 h-5 rounded-full bg-emerald-500"></span>
              <div>
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">Active Monthly Flow</h2>
                <p className="text-[10px] text-slate-400 font-medium">Monthly cash transactions, overhead subscriptions, and variable budgets</p>
              </div>
            </div>
            <MonthlyCashFlow data={data} setCurrentTab={setCurrentTab} className="h-full flex-1 flex flex-col justify-between" />
          </div>
        </div>

        {/* RIGHT COLUMN - Sidebar Actions & Context (lg:col-span-4) */}
        <div className="lg:col-span-4 flex flex-col">
          {/* SECTION 5: Net worth & investment class weights */}
          <div className="space-y-4 h-full flex flex-col">
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-1 h-5 rounded-full bg-amber-500"></span>
              <div>
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">Portfolio Allocation Index</h2>
                <p className="text-[10px] text-slate-400 font-medium">Distributed capital weights inside passive and active holdings</p>
              </div>
            </div>
            <NetWorthSummary data={data} setCurrentTab={setCurrentTab} className="h-full flex-1 flex flex-col justify-between" />
          </div>
        </div>
      </div>

      {/* SECTION 6: Dynamic Expenditure Trend Curve (Full Width) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-indigo-500"></span>
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">Chronological Capital Outflow Trend</h2>
            <p className="text-[10px] text-slate-400 font-medium">Full-screen direct trend metrics and segment filter parameters</p>
          </div>
        </div>
        <ExpenditureTrendCurve data={data} />
      </div>

      {/* SECTION 7: Online Store Spend Curve (Full Width) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-violet-500"></span>
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">Online Store Spending Trends</h2>
            <p className="text-[10px] text-slate-400 font-medium">Merchant spending curves and active digital store transactions</p>
          </div>
        </div>
        <OnlineStoreTrendCurve data={data} />
      </div>

      {/* SECTION 4: Upcoming commitments & savings targets (Full Width Bottom row) */}
      <div className="space-y-4 pt-6">
        <div className="flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-indigo-500"></span>
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">Savings Milestones & Allocations</h2>
            <p className="text-[10px] text-slate-400 font-medium">Targeted saving goals, active progress tracker, and direct transfers</p>
          </div>
        </div>
        <UpcomingCommitments data={data} setFinanceData={setFinanceData} setCurrentTab={setCurrentTab} />
      </div>
    </div>
  );
}
