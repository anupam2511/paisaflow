/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FinanceData, Expense } from '../../types';
import { formatCurrency, getDaysRemaining } from '../../utils/formatters';
import { Target, Plus } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

interface UpcomingCommitmentsProps {
  data: FinanceData;
  setFinanceData: React.Dispatch<React.SetStateAction<FinanceData>>;
  setCurrentTab: (tab: string) => void;
}

export default function UpcomingCommitments({ data, setFinanceData, setCurrentTab }: UpcomingCommitmentsProps) {
  const { showToast } = useFinance();
  const { savingGoals = [], accounts = [], preferences } = data;

  const [quickSaveGoalId, setQuickSaveGoalId] = useState<string>('');
  const [quickSaveType, setQuickSaveType] = useState<'installment' | 'addon'>('installment');
  const [quickSaveAmount, setQuickSaveAmount] = useState<string>('');
  const [quickSaveAccId, setQuickSaveAccId] = useState<string>('');

  useEffect(() => {
    if (!quickSaveGoalId) {
      setQuickSaveAmount('');
      return;
    }
    const chosenGoal = savingGoals.find(g => g.id === quickSaveGoalId);
    if (chosenGoal && chosenGoal.goalType === 'fixed') {
      if (quickSaveType === 'installment') {
        setQuickSaveAmount(chosenGoal.installmentAmount?.toString() || '');
      } else if (quickSaveAmount === chosenGoal.installmentAmount?.toString()) {
        setQuickSaveAmount('');
      }
    }
  }, [quickSaveGoalId, quickSaveType, savingGoals]);

  const handleQuickSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!quickSaveGoalId || !quickSaveAmount || !quickSaveAccId) {
      showToast('Please select a goal, source account, and input a valid amount.', 'error');
      return;
    }

    const amt = parseFloat(quickSaveAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('Please enter a positive numeric amount.', 'error');
      return;
    }

    const sourceAcc = accounts.find(a => a.id === quickSaveAccId);
    if (!sourceAcc) {
      showToast('Selected source account not found.', 'error');
      return;
    }

    if (sourceAcc.type === 'bank' && sourceAcc.balance < amt) {
      showToast(`Insufficient balance in ${sourceAcc.name}. Available: ${formatCurrency(sourceAcc.balance, preferences)}`, 'error');
      return;
    }

    if (sourceAcc.type === 'credit_card') {
      const avail = (sourceAcc.limit || 0) - sourceAcc.balance;
      if (avail < amt) {
        showToast(`Insufficient credit limit on ${sourceAcc.name}. Available credit: ${formatCurrency(avail, preferences)}`, 'error');
        return;
      }
    }

    const updatedGoals = savingGoals.map(g => {
      if (g.id === quickSaveGoalId) {
        const newAmount = g.currentAmount + amt;
        if (g.goalType === 'fixed') {
          if (quickSaveType === 'installment') {
            return {
              ...g,
              currentAmount: newAmount,
              paidInstallments: (g.paidInstallments || 0) + 1
            };
          } else {
            return {
              ...g,
              currentAmount: newAmount
            };
          }
        }
        return { 
          ...g, 
          currentAmount: newAmount
        };
      }
      return g;
    });

    const updatedAccounts = accounts.map(a => {
      if (a.id === quickSaveAccId) {
        const diff = a.type === 'bank' ? -amt : amt;
        return { ...a, balance: a.balance + diff };
      }
      return a;
    });

    const savingsExpense: Expense = {
      id: `exp-goalsave-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      description: `Savings Goal Contribution: ${savingGoals.find(g => g.id === quickSaveGoalId)?.name}`,
      amount: amt,
      category: 'Miscellaneous',
      date: new Date().toISOString().split('T')[0],
      accountId: quickSaveAccId,
      isRecurring: false,
      savingGoalId: quickSaveGoalId
    };

    setFinanceData(prev => ({
      ...prev,
      savingGoals: updatedGoals,
      accounts: updatedAccounts,
      expenses: [savingsExpense, ...prev.expenses]
    }));

    setQuickSaveAmount('');
    showToast('Allocated successfully! Cash balances adjusted.', 'success');
  };

  return (
    <div id="savings-and-assets-split" className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
      {/* TARGETED SAVINGS MILESTONES */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-8 space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-slate-50 mb-1">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-indigo-500" />
            Active Savings Targets
          </h2>
          <button 
            onClick={() => setCurrentTab('savings')}
            className="text-[10px] text-indigo-600 hover:underline font-extrabold"
          >
            Manage Savings &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {savingGoals.slice(0, 3).map(goal => {
            const isFixed = goal.goalType === 'fixed';
            const daysLeft = getDaysRemaining(goal.targetDate);
            
            let progressPct = 0;
            let targetAmt = goal.targetAmount;
            let savedAmt = goal.currentAmount;
            let remaining = 0;

            if (isFixed) {
              const instAmt = goal.installmentAmount || 0;
              const totInst = goal.totalInstallments || 0;
              targetAmt = instAmt * totInst;
              savedAmt = goal.currentAmount;
              remaining = Math.max(0, targetAmt - savedAmt);
              progressPct = targetAmt > 0 ? (savedAmt / targetAmt) * 100 : 0;
            } else {
              targetAmt = goal.targetAmount;
              savedAmt = goal.currentAmount;
              remaining = Math.max(0, targetAmt - savedAmt);
              progressPct = targetAmt > 0 ? (savedAmt / targetAmt) * 100 : 0;
            }
            
            return (
              <div key={goal.id} className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-150 transition bg-white flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-1">
                    <span className="text-[9px] font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded truncate max-w-[85px]" title={goal.category}>
                      {goal.category}
                    </span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase">{daysLeft} Days left</span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-800 mt-2 truncate" title={goal.name}>{goal.name}</h3>
                  
                  <div className="flex justify-between items-end mt-3">
                    <div>
                      <span className="text-[8px] text-slate-400 block font-semibold leading-none">Saved</span>
                      <span className="text-[11px] font-bold text-slate-800 font-mono">{formatCurrency(savedAmt, preferences)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] text-slate-400 block font-semibold leading-none">
                        {isFixed ? 'Plan Rate' : 'Target'}
                      </span>
                      <span className="text-[11px] font-bold text-indigo-600 font-mono">
                        {isFixed 
                          ? `${formatCurrency(goal.installmentAmount || 0, preferences)}/mo` 
                          : formatCurrency(targetAmt, preferences)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, progressPct)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-50 flex justify-between items-center text-[9px]">
                  <span className="text-slate-400 font-bold">
                    {isFixed 
                      ? `Paid ${goal.paidInstallments}/${goal.totalInstallments} (${progressPct.toFixed(0)}%)` 
                      : `${progressPct.toFixed(0)}% Complete`}
                  </span>
                  <span className="text-indigo-600 font-bold truncate">
                    {remaining > 0 ? `Need ${formatCurrency(remaining, preferences)}` : 'Completed 🎯'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* QUICK ALLOCATION PANEL */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-4 flex flex-col justify-between">
        <div>
          <h2 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-50">
            <Plus className="w-3.5 h-3.5 text-teal-500" />
            Quick Savings Allocator
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">Move cash instantly from checking to support a specific milestone.</p>

          <form onSubmit={handleQuickSave} className="space-y-2.5 mt-3">
            <div>
              <label className="block text-[8px] uppercase font-bold text-slate-400 mb-0.5">Select Saving Target</label>
              <select
                value={quickSaveGoalId}
                onChange={(e) => setQuickSaveGoalId(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg p-1.5 bg-slate-50 focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="">-- Choose Target --</option>
                {savingGoals.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[8px] uppercase font-bold text-slate-400 mb-0.5">Source Account</label>
              <select
                value={quickSaveAccId}
                onChange={(e) => setQuickSaveAccId(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg p-1.5 bg-slate-50 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
              >
                <option value="">-- Choose Account --</option>
                <optgroup label="Bank Accounts" className="font-semibold text-slate-700">
                  {accounts.filter(a => a.type === 'bank').map(a => (
                    <option key={a.id} value={a.id} className="font-normal text-slate-600">
                      {a.name} ({formatCurrency(a.balance, preferences)})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-[8px] uppercase font-bold text-slate-400 mb-0.5">Amount to Transfer</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-bold">{preferences.currencySymbol}</span>
                <input
                  type="number"
                  value={quickSaveAmount}
                  onChange={(e) => setQuickSaveAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full text-xs border border-slate-200 rounded-lg p-1.5 pl-6 bg-white focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg shadow-sm transition flex items-center justify-center gap-1 cursor-pointer mt-1"
            >
              <Plus className="w-3 h-3" /> Commit Savings Fund
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
