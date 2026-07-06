/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FinanceData } from '../../types';
import { formatMonthYear, formatCurrency } from '../../utils/formatters';
import { Settings, Download, FileSpreadsheet, Compass } from 'lucide-react';
import { handleExportJSON, handleExportCSV } from './dashboard.utils';

// Component Imports
import FinancialOverview from './FinancialOverview';
import MonthlyCashFlow from './MonthlyCashFlow';
import AttentionRequired from './AttentionRequired';
import NetWorthSummary from './NetWorthSummary';
import UpcomingCommitments from './UpcomingCommitments';

interface DashboardProps {
  data: FinanceData;
  setFinanceData: React.Dispatch<React.SetStateAction<FinanceData>>;
  setCurrentTab: (tab: string) => void;
}

export default function Dashboard({ data, setFinanceData, setCurrentTab }: DashboardProps) {
  const { expenses = [], preferences } = data;
  const threshold = preferences.largeExpenseThreshold || 20000;

  return (
    <div id="dashboard-root" className="space-y-10 pb-8">
      {/* HEADER UTILITY BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 id="dashboard-title" className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            💼 Personal Financial Intelligence
          </h1>
          <p id="dashboard-subtitle" className="text-slate-400 text-xs mt-0.5 font-sans">
            Overview of {formatMonthYear(new Date().toISOString().split('T')[0])} • Organized, automated real-time tracking
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2.5 py-1 rounded-full border border-indigo-100/70 flex items-center gap-1.5 font-sans uppercase tracking-wider shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
            Financial Core Status
          </span>
          <button 
            id="configure-threshold-btn"
            onClick={() => setCurrentTab('settings')}
            className="text-[10px] bg-white hover:bg-slate-50 text-slate-600 transition font-extrabold px-2.5 py-1 rounded-full border border-slate-200 flex items-center gap-1.5 cursor-pointer font-sans uppercase tracking-wider shadow-sm shrink-0"
          >
            <Settings className="w-3 h-3" />
            Large Outflow Cap: {formatCurrency(threshold, preferences)}
          </button>
          <button 
            onClick={() => handleExportJSON(data)}
            className="text-[10px] bg-white dark:bg-slate-900 border border-indigo-150 dark:border-indigo-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1.5 cursor-pointer font-sans uppercase tracking-wider shadow-sm shrink-0"
            title="Download full capital ledger and settings backup in JSON format"
          >
            <Download className="w-3 h-3" />
            JSON Backup
          </button>
          {expenses.length > 0 && (
            <button 
              onClick={() => handleExportCSV(data)}
              className="text-[10px] bg-white dark:bg-slate-900 border border-emerald-150 dark:border-emerald-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1.5 cursor-pointer font-sans uppercase tracking-wider shadow-sm shrink-0"
              title="Download expenses ledger as standard CSV spreadsheet"
            >
              <FileSpreadsheet className="w-3 h-3" />
              CSV Ledger
            </button>
          )}
        </div>
      </div>

      {/* SECTION 1: Where am I today? */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">1. Where am I today?</h2>
            <p className="text-[11px] text-slate-400">Your total consolidated financial footprint, liquid reserves, liabilities, and investments.</p>
          </div>
        </div>
        <FinancialOverview data={data} setCurrentTab={setCurrentTab} />
      </div>

      {/* SECTION 2: What is happening this month? */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">2. What is happening this month?</h2>
            <p className="text-[11px] text-slate-400">Active cash flows, essential overhead consumption, debt commitments, and budget balances.</p>
          </div>
        </div>
        <MonthlyCashFlow data={data} setCurrentTab={setCurrentTab} />
      </div>

      {/* SECTION 3: What needs my attention? */}
      <AttentionRequired data={data} setCurrentTab={setCurrentTab} />

      {/* SECTION 4: Upcoming commitments & savings targets */}
      <UpcomingCommitments data={data} setFinanceData={setFinanceData} setCurrentTab={setCurrentTab} />

      {/* SECTION 5: Net worth & investment class weights */}
      <NetWorthSummary data={data} setCurrentTab={setCurrentTab} />
    </div>
  );
}
