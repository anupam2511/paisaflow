/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';
import { Menu } from 'lucide-react';

export default function Header() {
  const {
    financeData,
    setIsMobileMenuOpen
  } = useFinance();

  const bankAccounts = financeData.accounts.filter(a => a.type === 'bank');
  const creditCards = financeData.accounts.filter(a => a.type === 'credit_card');

  const totalLiquidAssets = bankAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalOutstandingCredit = creditCards.reduce((sum, a) => sum + a.balance, 0);
  const aggregateNetWorth = totalLiquidAssets - totalOutstandingCredit;

  return (
    <header className="bg-white dark:bg-[#0b1329] border-b border-slate-100 dark:border-slate-800/80 sticky top-0 z-30 shadow-xs h-[73px] flex items-center shrink-0">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center gap-4">
          
          {/* Left Segment: Mobile burger handler & HUD Title */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl border border-slate-150 dark:border-slate-800 cursor-pointer"
              title="Open Navigation Drawer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-slate-600 dark:text-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                Live Capital HUD
              </h1>
            </div>
          </div>

          {/* Net worth / cash readouts */}
          <div className="flex bg-slate-50 dark:bg-slate-900 rounded-xl px-2.5 py-1.5 sm:px-4 sm:py-2 border border-slate-100 dark:border-slate-800 w-auto shrink-0 gap-3 md:gap-5 max-w-full">
            <div className="hidden sm:block">
              <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-extrabold leading-3 block">Cash reserves</span>
              <span id="header-liquid-readout" className="text-xs md:text-sm font-black text-slate-700 dark:text-slate-200 block whitespace-nowrap font-mono mt-0.5">
                {formatCurrency(totalLiquidAssets, financeData.preferences, 2)}
              </span>
            </div>
            <div className="hidden sm:block border-l border-slate-200 dark:border-slate-800 pl-3 md:pl-4">
              <span className="text-[9px] text-slate-450 dark:text-slate-505 uppercase font-extrabold leading-3 block text-rose-500/90">Credit cards</span>
              <span id="header-credit-readout" className="text-xs md:text-sm font-black text-rose-600 dark:text-rose-450 block whitespace-nowrap font-mono mt-0.5">
                {formatCurrency(totalOutstandingCredit, financeData.preferences, 2)}
              </span>
            </div>
            <div className="sm:border-l sm:border-slate-200 dark:sm:border-slate-850 sm:pl-3 md:pl-4">
              <span className="text-[9px] text-zinc-400 dark:text-slate-500 uppercase font-extrabold leading-3 block text-right">Net Worth</span>
              <span id="header-net-readout" className={`text-xs md:text-sm font-extrabold block whitespace-nowrap font-mono mt-0.5 text-right ${aggregateNetWorth >= 0 ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-600 dark:text-rose-450'}`}>
                {formatCurrency(aggregateNetWorth, financeData.preferences, 2)}
              </span>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
