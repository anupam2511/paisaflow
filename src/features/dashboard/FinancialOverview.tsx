/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FinanceData } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { motion } from 'motion/react';
import { 
  Wallet, 
  Building, 
  CreditCard, 
  Coins, 
  ShieldAlert 
} from 'lucide-react';
import { analyzeNetWorth } from '../../lib/finance/netWorthCalculator';
import { defaultNetWorthCategories } from './dashboard.utils';

interface FinancialOverviewProps {
  data: FinanceData;
  setCurrentTab: (tab: string) => void;
}

export default function FinancialOverview({ data, setCurrentTab }: FinancialOverviewProps) {
  const { 
    accounts = [], 
    preferences, 
    investments = [], 
    ccEmis = [], 
    emis = [] 
  } = data;

  const allocatedEmergency = preferences.emergencyAllocated || 0;

  // Assets and Cash calculations
  const bankAccounts = accounts.filter(a => a.type === 'bank');
  const totalBankCash = bankAccounts.reduce((sum, a) => sum + a.balance, 0);
  const isReserveBreached = allocatedEmergency > 0 && totalBankCash < allocatedEmergency;
  const availableSpendingCash = Math.max(0, totalBankCash - allocatedEmergency);

  // Credit Card & Liabilities calculations
  const totalCardBalances = accounts.filter(a => a.type === 'credit_card').reduce((sum, a) => sum + a.balance, 0);
  const ccFutureLiability = ccEmis
    .filter(e => e.status === 'active')
    .reduce((sum, e) => {
      const unpaid = e.installments.filter(inst => inst.paidStatus === 'unpaid');
      return sum + unpaid.reduce((total, inst) => total + inst.totalInstallmentAmount, 0);
    }, 0);
  const totalCreditOutstanding = totalCardBalances + ccFutureLiability;
  const totalCreditLimit = accounts.filter(a => a.type === 'credit_card').reduce((sum, a) => sum + (a.limit || 0), 0);
  const overallCreditUtilizationPct = totalCreditLimit > 0 ? (totalCardBalances / totalCreditLimit) * 100 : 0;

  // Investments calculations
  const totalInvestmentsValuation = investments.reduce((sum, inv) => sum + inv.totalInvested, 0);
  const getMonthlyScaledInvestment = (inv: any) => {
    if (inv.investmentType === 'spot') return 0;
    const freq = inv.frequency || 'monthly';
    if (freq === 'monthly') return inv.amount;
    if (freq === 'quarterly') return inv.amount / 3;
    if (freq === 'yearly') return inv.amount / 12;
    return 0;
  };
  const totalMonthlySIPCommitment = investments.reduce((sum, inv) => sum + getMonthlyScaledInvestment(inv), 0);

  // Net Worth calculations
  const netWorthAnalysis = analyzeNetWorth({
    categories: preferences.netWorthSettings?.categories || defaultNetWorthCategories,
    accounts,
    investments,
    ccEmis,
    emis
  });

  return (
    <div className="space-y-6">
      {/* EMERGENCY RESERVE LOCK STATUS BANNER */}
      {allocatedEmergency > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-sm font-sans transition-all duration-200 ${
            isReserveBreached 
              ? 'bg-rose-50 border-rose-200 text-rose-900' 
              : 'bg-indigo-50/80 border-indigo-150 text-indigo-950'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl shrink-0 ${
              isReserveBreached 
                ? 'bg-rose-100 text-rose-700' 
                : 'bg-indigo-100 text-indigo-700'
            }`}>
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className={`text-[9px] uppercase font-extrabold px-2 py-0.5 rounded ${
                isReserveBreached 
                  ? 'bg-rose-100 text-rose-800' 
                  : 'bg-indigo-100 text-indigo-850'
              }`}>
                {isReserveBreached ? '⚠️ Core Shield Breached' : '🛡️ Emergency Fund Shield Secured'}
              </span>
              <p className="font-semibold mt-1">
                {isReserveBreached 
                  ? `Alert: Your cash balances have dipped below safety levels. You are consuming emergency reserves by ${formatCurrency(allocatedEmergency - totalBankCash, preferences)}!`
                  : `Your safety reserve of ${formatCurrency(allocatedEmergency, preferences)} is safely ring-fenced. Spending cash available: ${formatCurrency(availableSpendingCash, preferences)}.`
                }
              </p>
            </div>
          </div>
          <button 
            onClick={() => setCurrentTab('emergency')}
            className={`px-3 py-1.5 rounded-lg font-bold text-[11px] border cursor-pointer hover:shadow-xs transition shrink-0 ${
              isReserveBreached 
                ? 'bg-rose-600 border-rose-600 text-white hover:bg-rose-700' 
                : 'bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50'
            }`}
          >
            Adjust Shield Reserves &rarr;
          </button>
        </motion.div>
      )}

      {/* CORE CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* NET WORTH CARD */}
        <motion.div 
          whileHover={{ y: -2 }}
          onClick={() => setCurrentTab('net_worth')}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between transition-all duration-200 relative overflow-hidden group min-h-[145px] cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider font-sans">
              Consolidated Wealth
            </span>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg group-hover:scale-110 transition-transform duration-200 shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Net Worth Valuation</h3>
            <p className="text-xl font-black text-slate-900 mt-1 font-mono tracking-tight leading-none">
              {formatCurrency(netWorthAnalysis.currentNetWorth, preferences)}
            </p>
            <div className="flex justify-between mt-2.5 pt-2 border-t border-slate-50 text-[10px] text-slate-550">
              <span>Assets: <strong className="text-emerald-600 font-mono">{formatCurrency(netWorthAnalysis.totalAssetsValue, preferences)}</strong></span>
              <span>Debt: <strong className="text-rose-600 font-mono">-{formatCurrency(netWorthAnalysis.totalLiabilitiesValue, preferences)}</strong></span>
            </div>
          </div>
        </motion.div>

        {/* CASH AVAILABLE CARD */}
        <motion.div 
          whileHover={{ y: -2 }}
          onClick={() => setCurrentTab('accounts')}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between transition-all duration-200 relative overflow-hidden group min-h-[145px] cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider font-sans ${isReserveBreached ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {isReserveBreached ? 'Reserve Breached' : 'Liquid Assets'}
            </span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:scale-110 transition-transform duration-200 shrink-0">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Cash Available</h3>
            <p className="text-xl font-black text-slate-900 mt-1 font-mono tracking-tight leading-none">
              {formatCurrency(totalBankCash, preferences)}
            </p>
            <div className="flex justify-between mt-2.5 pt-2 border-t border-slate-50 text-[10px] text-slate-550">
              <span>Spendable: <strong className="text-indigo-600 font-mono">{formatCurrency(availableSpendingCash, preferences)}</strong></span>
              <span>Safety Cap: <strong className="text-slate-400 font-mono">{formatCurrency(allocatedEmergency, preferences)}</strong></span>
            </div>
          </div>
        </motion.div>

        {/* CREDIT OUTSTANDING CARD */}
        <motion.div 
          whileHover={{ y: -2 }}
          onClick={() => setCurrentTab('credit_cards')}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between transition-all duration-200 relative overflow-hidden group min-h-[145px] cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider font-sans ${overallCreditUtilizationPct > 30 ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
              Util: {overallCreditUtilizationPct.toFixed(0)}%
            </span>
            <div className="p-1.5 bg-amber-50 text-amber-500 rounded-lg group-hover:scale-110 transition-transform duration-200 shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Credit Outstanding</h3>
            <p className="text-xl font-black text-rose-600 mt-1 font-mono tracking-tight leading-none">
              {formatCurrency(totalCreditOutstanding, preferences)}
            </p>
            <div className="flex justify-between mt-2.5 pt-2 border-t border-slate-50 text-[10px] text-slate-550">
              <span>Card Debt: <strong className="text-slate-600 font-mono">{formatCurrency(totalCardBalances, preferences)}</strong></span>
              <span>Unbilled EMI: <strong className="text-slate-600 font-mono">{formatCurrency(ccFutureLiability, preferences)}</strong></span>
            </div>
          </div>
        </motion.div>

        {/* INVESTMENTS CARD */}
        <motion.div 
          whileHover={{ y: -2 }}
          onClick={() => setCurrentTab('investments')}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between transition-all duration-200 relative overflow-hidden group min-h-[145px] cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-extrabold text-violet-600 bg-violet-50 px-2 py-0.5 rounded uppercase tracking-wider font-sans">
              {investments.length} Active Holdings
            </span>
            <div className="p-1.5 bg-violet-50 text-violet-600 rounded-lg group-hover:scale-110 transition-transform duration-200 shrink-0">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Investments Portfolio</h3>
            <p className="text-xl font-black text-slate-900 mt-1 font-mono tracking-tight leading-none">
              {formatCurrency(totalInvestmentsValuation, preferences)}
            </p>
            <div className="flex justify-between mt-2.5 pt-2 border-t border-slate-50 text-[10px] text-slate-550">
              <span>SIP Rate: <strong className="text-violet-600 font-mono">{formatCurrency(totalMonthlySIPCommitment, preferences)}/mo</strong></span>
              <span>Assets: <strong className="text-slate-500">{investments.length} classes</strong></span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
