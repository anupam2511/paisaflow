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
}

export default function NetWorthSummary({ data, setCurrentTab }: NetWorthSummaryProps) {
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
    <div id="dashboard-investments-row" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-slate-50 mb-4 gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-indigo-500" />
            Wealth Asset Holdings & Weights
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5 font-sans">Weight allocations and total distributed value inside holding portfolios.</p>
        </div>
        <button 
          onClick={() => setCurrentTab('investments')}
          className="text-[10px] text-indigo-600 hover:underline font-extrabold"
        >
          Adjust Holdings &rarr;
        </button>
      </div>

      {investments.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-2">
            <h3 className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Asset Investment Index</h3>
            <div className="max-h-[160px] overflow-y-auto pr-1 space-y-2">
              {investments.slice(0, 4).map(inv => {
                const pct = totalInvestmentsValuation > 0 ? (inv.totalInvested / totalInvestmentsValuation) * 100 : 0;
                return (
                  <div key={inv.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100/70 hover:border-slate-200 transition-colors flex items-center justify-between text-xs font-sans">
                    <div>
                      <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 block w-fit mb-1">
                        {getFriendlyTypeLabel(inv.type)}
                      </span>
                      <h4 className="font-extrabold text-slate-700">{inv.name}</h4>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-800 block font-mono">{formatCurrency(inv.totalInvested, preferences)}</span>
                      <span className="text-[9px] text-slate-400 block font-bold">{pct.toFixed(1)}% Weight</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-2.5">
            <h3 className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Asset Class Allocation</h3>
            <div className="space-y-2">
              {groupedInvestments.slice(0, 3).map(group => (
                <div key={group.category} className="space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-slate-600">{group.category}</span>
                    <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800">
                      <span>{formatCurrency(group.amount, preferences)}</span>
                      <span className="text-slate-400 text-[9px] font-semibold">({group.pct.toFixed(0)}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" 
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
