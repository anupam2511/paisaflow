/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FinanceData } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { Coins } from 'lucide-react';
import { getFriendlyTypeLabel, standardInvestmentCategories } from './dashboard.utils';

interface NetWorthSummaryProps {
  data: FinanceData;
  setCurrentTab: (tab: string) => void;
  className?: string;
}

export default function NetWorthSummary({ data, setCurrentTab, className = '' }: NetWorthSummaryProps) {
  const { investments = [], preferences } = data;

  const totalInvestmentsValuation = investments.reduce((sum, inv) => sum + inv.totalInvested, 0);

  const groupedInvestments = standardInvestmentCategories.map(cat => {
    const total = investments
      .filter(inv => inv.type === cat || getFriendlyTypeLabel(inv.type).toLowerCase() === cat.toLowerCase())
      .reduce((sum, inv) => sum + inv.totalInvested, 0);
    return {
      category: cat,
      amount: total,
      pct: totalInvestmentsValuation > 0 ? (total / totalInvestmentsValuation) * 100 : 0
    };
  }).filter(item => item.amount > 0);

  return (
    <div id="dashboard-investments-row" className={`bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100/85 dark:border-slate-800/80 shadow-2xs ${className}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-slate-100 dark:border-slate-850 mb-4 gap-3 shrink-0">
        <div>
          <h2 className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            Wealth Holdings
          </h2>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-sans font-medium">Distributed weights inside holding portfolios</p>
        </div>
        <button 
          onClick={() => setCurrentTab('investments')}
          className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline font-black uppercase tracking-wider cursor-pointer"
        >
          View Assets &rarr;
        </button>
      </div>

      {investments.length > 0 ? (
        <div className="space-y-4 flex-1 flex flex-col justify-between">
          <div className="space-y-2 flex-1 flex flex-col">
            <h3 className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-widest shrink-0">Asset Investment Index</h3>
            <div className="max-h-[160px] overflow-y-auto pr-1 space-y-2 flex-1">
              {investments.slice(0, 3).map(inv => {
                const pct = totalInvestmentsValuation > 0 ? (inv.totalInvested / totalInvestmentsValuation) * 100 : 0;
                return (
                  <div key={inv.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100/70 dark:border-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700 transition-colors flex items-center justify-between text-xs font-sans">
                    <div>
                      <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 block w-fit mb-1">
                        {getFriendlyTypeLabel(inv.type)}
                      </span>
                      <h4 className="font-extrabold text-slate-700 dark:text-slate-350">{inv.name}</h4>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-800 dark:text-slate-100 block font-mono">{formatCurrency(inv.totalInvested, preferences)}</span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-bold">{pct.toFixed(0)}% Weight</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-850 shrink-0">
            <h3 className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-widest">Allocation</h3>
            <div className="space-y-2">
              {groupedInvestments.slice(0, 3).map(group => (
                <div key={group.category} className="space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-slate-600 dark:text-slate-400">{group.category}</span>
                    <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800 dark:text-slate-250">
                      <span>{formatCurrency(group.amount, preferences)}</span>
                      <span className="text-slate-400 dark:text-slate-500 text-[8px] font-semibold">({group.pct.toFixed(0)}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                    <div 
                      className="bg-amber-500 h-1 rounded-full transition-all duration-500" 
                      style={{ width: `${group.pct}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-4">
          <Coins className="w-8 h-8 text-slate-300 mx-auto stroke-1" />
          <h4 className="text-slate-700 dark:text-slate-200 font-bold text-xs mt-2">No active assets registered</h4>
          <p className="text-slate-400 dark:text-slate-400 text-[10px] mt-1 max-w-xs mx-auto leading-relaxed">Configure your holdings within the Portfolio tab to unlock automatic allocation metrics.</p>
        </div>
      )}
    </div>
  );
}
