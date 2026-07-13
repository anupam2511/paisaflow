import React, { useState, useEffect } from 'react';
import { FinanceData } from '../types';
import { formatCurrency } from '../utils/formatters';
import { UtilizationBar } from './finance/UtilizationBar';
import { 
  ShieldAlert, 
  HelpCircle, 
  DollarSign, 
  Heart, 
  TrendingUp, 
  Award, 
  AlertTriangle, 
  CheckCircle2, 
  Flame, 
  Compass, 
  Activity 
} from 'lucide-react';
import { motion } from 'motion/react';

interface EmergencyFundSectionProps {
  data: FinanceData;
  setFinanceData?: React.Dispatch<React.SetStateAction<FinanceData>>;
}

export default function EmergencyFundSection({ data, setFinanceData }: EmergencyFundSectionProps) {
  const { accounts, expenses, recurringSpends, preferences } = data;

  // 1. Calculate dynamic actual monthly outflow
  const actualExpensesOnly = expenses.filter(e => e.category.toLowerCase() !== 'transfer');
  const baseMonthlyExpenses = actualExpensesOnly.reduce((sum, e) => sum + e.amount, 0) / Math.max(1, (actualExpensesOnly.length > 0 ? 3 : 1)); // avg over 3 months or similar
  const baseSubscriptions = recurringSpends.filter(s => s.isActive).reduce((sum, s) => sum + s.amount, 0);
  const baseEmis = (data.emis || []).filter(e => e.isActive).reduce((sum, e) => sum + e.amount, 0);
  
  // Total baseline monthly essentials (Must be paid no matter what)
  const monthlyOutflowEssentials = (baseMonthlyExpenses > 0 ? baseMonthlyExpenses : 25000) + baseSubscriptions + baseEmis;

  // 2. Aggregate available liquid reserves (Bank accounts only, exclude credit cards)
  const bankAccounts = accounts.filter(a => a.type === 'bank');
  const totalInCheckingSavings = bankAccounts.reduce((sum, a) => sum + a.balance, 0);

  // 3. User customized params
  const [coverageMultiplier, setCoverageMultiplier] = useState<number>(6); // Default 6 months of living expenses
  const [customAuxiliary, setCustomAuxiliary] = useState<number>(30000); // e.g. medical emergency buffer
  const allocatedReserve = preferences.emergencyAllocated !== undefined
    ? preferences.emergencyAllocated
    : Math.round(totalInCheckingSavings * 0.45);

  const targetBuffer = Math.round((monthlyOutflowEssentials * coverageMultiplier) + customAuxiliary);
  const progressPercent = Math.min(100, Math.round((totalInCheckingSavings / targetBuffer) * 100));
  const remainingDeficit = Math.max(0, targetBuffer - totalInCheckingSavings);

  const monthsCoveredEstimate = Math.round((totalInCheckingSavings / monthlyOutflowEssentials) * 10) / 10;

  // Define dynamic safety color statuses
  const getSafetyStatus = () => {
    if (monthsCoveredEstimate < 3) return { label: 'CRITICAL SHIELD DEFICIT', color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/25 border-rose-100 dark:border-rose-900/30', icon: Flame, desc: 'Your liquid reserves cover less than 3 months of essential outflows. Any sudden income freeze leaves your credit lines heavily exposed.' };
    if (monthsCoveredEstimate < 6) return { label: 'VULNERABLE COVERAGE', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/25 border-amber-100 dark:border-amber-900/30', icon: AlertTriangle, desc: 'You have sound intermediate coverage, but fall below the recommended gold standard of 6 months of security.' };
    return { label: 'FRICTIONLESS SHIELD ACTIVE', color: 'text-emerald-750 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/25 border-emerald-100 dark:border-emerald-900/30', icon: CheckCircle2, desc: 'Maximum peace of mind activated! Your cash reserves are mathematically optimal to bypass any major credit dependencies.' };
  };

  const statusObj = getSafetyStatus();
  const StatusIcon = statusObj.icon;

  return (
    <div id="emergency-section-root" className="space-y-6 select-none font-sans">
      
      {/* SECTION HEADER */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-indigo-500 shrink-0" />
          Emergency Reserve Shield Calculator
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Calculate, allocate, and buffer intermediate liquid reserves. Protecting yourself fully ensures you avoid credit card foreclosure or personal loan traps.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* INPUTS AND SLIDERS */}
        <div className="bg-white dark:bg-[#0b1329] p-5 rounded-2xl border border-slate-150 dark:border-slate-800 lg:col-span-5 space-y-4 shadow-xs">
          
          <div className="flex items-center gap-2 border-b border-slate-105 dark:border-slate-850 pb-2 mb-2">
            <Compass className="w-4 h-4 text-indigo-505 text-indigo-500" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Shield Parameters</h3>
          </div>

          {/* COVERAGE MULTIPLIER BUTTONS */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-tight">Preferred Coverage Horizon</label>
            <div className="grid grid-cols-4 gap-2">
              {[3, 6, 9, 12].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setCoverageMultiplier(m)}
                  className={`text-[10.5px] py-2 px-1.5 rounded-xl border font-bold transition duration-200 cursor-pointer ${
                    coverageMultiplier === m
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {m} Months
                </button>
              ))}
            </div>
            <span className="text-[9px] text-slate-400 block pt-0.5">Recommended horizon: 6 months for salaried, 12 months for self-employed professionals.</span>
          </div>

          {/* DYNAMIC ESSENTIAL OUTFLOW VALUE */}
          <div className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs font-semibold">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Dynamic Monthly Essentials Outflow</span>
              <span className="text-slate-500 text-[10px] block mt-0.5">Average monthly bills, subscriptions, EMIs.</span>
            </div>
            <span className="font-mono text-sm font-black text-slate-850 dark:text-slate-150">
              {formatCurrency(monthlyOutflowEssentials, preferences)}
            </span>
          </div>

          {/* AUXILIARY COVERAGE INPUT */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-600 dark:text-slate-450">Auxiliary Backup Buffer (e.g. Medical)</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{formatCurrency(customAuxiliary, preferences)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="200000"
              step="5000"
              value={customAuxiliary}
              onChange={(e) => setCustomAuxiliary(parseInt(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          {/* LOCK RESERVE ALLOCATION SLIDER */}
          <div className="space-y-1 pt-3 border-t border-slate-50 dark:border-slate-805">
            <div className="flex justify-between items-center text-xs">
              <span className="font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1">🔒 Officially Allocating Reserves</span>
              <span className="font-mono font-black text-indigo-700 dark:text-indigo-305">{formatCurrency(allocatedReserve, preferences)}</span>
            </div>
            <p className="text-[9.5px] text-slate-400 mb-2 leading-relaxed">
              Officially allocate a portion of your checking bank balance specifically for your Emergency Fund, safely separating it conceptually from liquid spending money.
            </p>
            <input
              type="range"
              min="0"
              max={totalInCheckingSavings}
              step="2000"
              value={allocatedReserve}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setFinanceData?.(prev => ({
                  ...prev,
                  preferences: {
                    ...prev.preferences,
                    emergencyAllocated: val
                  }
                }));
              }}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

        </div>

        {/* DETAILS AND STATUS */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* DYNAMIC METRIC STATUS CHANNELS */}
          <div className={`p-5 rounded-2xl border flex items-start gap-4 shadow-sm relative overflow-hidden transition-all duration-300 ${statusObj.color}`}>
            <div className="p-3 bg-white/60 dark:bg-slate-900/40 rounded-xl shrink-0">
              <StatusIcon className="w-6 h-6 stroke-2" />
            </div>
            <div>
              <span className="text-[9px] uppercase font-black tracking-widest block opacity-70">Security Shield status</span>
              <h4 className="text-sm font-black tracking-tight mt-0.5">{statusObj.label}</h4>
              <p className="text-xs leading-relaxed mt-1.5 opacity-90">{statusObj.desc}</p>
              
              <div className="flex gap-4 mt-3 text-xs font-bold">
                <div>
                  <span className="opacity-70 text-[9px] uppercase block">Reserves cover</span>
                  <span className="text-sm font-black font-mono block mt-0.5">{monthsCoveredEstimate} Months</span>
                </div>
                {remainingDeficit > 0 ? (
                  <div>
                    <span className="opacity-70 text-[9px] uppercase block">Deficit targeting</span>
                    <span className="text-sm font-black font-mono text-rose-600 block mt-0.5">{formatCurrency(remainingDeficit, preferences)}</span>
                  </div>
                ) : (
                  <div>
                    <span className="opacity-70 text-[9px] uppercase block">Excess surplus</span>
                    <span className="text-sm font-black font-mono text-emerald-600 block mt-0.5">+{formatCurrency(totalInCheckingSavings - targetBuffer, preferences)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RADIAL/COMPACT VALUE METRIC CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* TOTAL DEPOSITS IN BANK */}
            <div className="bg-white dark:bg-[#0b1329] border border-slate-150 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-1">
              <span className="text-[9px] font-extrabold text-blue-600 bg-blue-50 dark:bg-blue-950/30 px-20 px-2.5 py-0.5 rounded-md uppercase tracking-wider font-mono">
                CASH RESERVES BANK
              </span>
              <h3 className="text-slate-450 text-[10px] font-bold uppercase tracking-wider pt-2.5">Available Liquid Cash</h3>
              <p className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5 leading-none">
                {formatCurrency(totalInCheckingSavings, preferences)}
              </p>
              <span className="text-[9px] text-slate-400 block pt-1.5 font-medium">Sum of all active bank account checking structures.</span>
            </div>

            {/* TARGET COMPASS BUFFER */}
            <div className="bg-white dark:bg-[#0b1329] border border-slate-150 dark:border-[#0b1329] p-5 rounded-2xl shadow-xs space-y-1 border-indigo-100">
              <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 px-2.5 py-0.5 rounded-md uppercase tracking-wider font-mono">
                SHIELD TARGET BUFFER
              </span>
              <h3 className="text-slate-450 text-[10px] font-bold uppercase tracking-wider pt-2.5">Required Emergency Fund</h3>
              <p className="text-xl lg:text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-0.5 leading-none">
                {formatCurrency(targetBuffer, preferences)}
              </p>
              <span className="text-[9px] text-slate-400 block pt-1.5 font-medium">{coverageMultiplier} months essentials ({formatCurrency(monthlyOutflowEssentials, preferences)}/mo) + backup.</span>
            </div>

          </div>

          {/* FUNDING PROGRESS METER BAR */}
          <div className="bg-white dark:bg-[#0b1329] border border-slate-150 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">Reserves Shield Progress Meter</span>
            </div>
            <UtilizationBar
              value={totalInCheckingSavings}
              limit={targetBuffer}
              showLabels={true}
            />
          </div>

        </div>

      </div>

    </div>
  );
}
