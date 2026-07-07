/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FinanceData, SavingGoal, FinancialAccount, Expense } from '../types';
import { formatCurrency, getDaysRemaining } from '../utils/formatters';
import { Target, Calendar, Plus, Trash2, Shield, CalendarIcon, ArrowRightLeft, AlertCircle, CheckCircle, Edit, X } from 'lucide-react';
import { motion } from 'motion/react';

interface SavingsGoalsSectionProps {
  data: FinanceData;
  setFinanceData: React.Dispatch<React.SetStateAction<FinanceData>>;
}

function calculateCompletionDate(startDateStr: string, totalInstallments: number): string {
  if (!startDateStr || totalInstallments <= 0) return '';
  const parts = startDateStr.split('-');
  if (parts.length !== 3) return '';
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed month
  const day = parseInt(parts[2], 10);

  const targetMonthCount = month + (totalInstallments - 1);
  const targetYear = year + Math.floor(targetMonthCount / 12);
  const targetMonth = targetMonthCount % 12;

  const tempDate = new Date(targetYear, targetMonth, day);
  if (tempDate.getMonth() !== targetMonth) {
    const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
    const finalDate = new Date(targetYear, targetMonth, lastDay);
    const yyyy = finalDate.getFullYear();
    const mm = String(finalDate.getMonth() + 1).padStart(2, '0');
    const dd = String(finalDate.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } else {
    const yyyy = tempDate.getFullYear();
    const mm = String(tempDate.getMonth() + 1).padStart(2, '0');
    const dd = String(tempDate.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}

function formatDateToHuman(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const monthsFull = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  if (isNaN(year) || isNaN(monthIdx) || isNaN(day)) return dateStr;
  return `${day} ${monthsFull[monthIdx] || ''} ${year}`;
}

export default function SavingsGoalsSection({ data, setFinanceData }: SavingsGoalsSectionProps) {
  const { savingGoals, accounts, preferences } = data;

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState('Emergency Fund');

  const [goalType, setGoalType] = useState<'flexible' | 'fixed' | 'investment'>('flexible');
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [totalInstallments, setTotalInstallments] = useState('');
  const [paidInstallments, setPaidInstallments] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [contribType, setContribType] = useState<'installment' | 'addon'>('installment');
  const [contribAmount, setContribAmount] = useState('');
  const [contribAccId, setContribAccId] = useState('');

  // Sync contribution amount based on goal selections and contribution type
  useEffect(() => {
    if (!selectedGoalId) {
      setContribAmount('');
      return;
    }
    const chosenGoal = savingGoals.find(g => g.id === selectedGoalId);
    if (chosenGoal && chosenGoal.goalType === 'fixed') {
      if (contribType === 'installment') {
        setContribAmount(chosenGoal.installmentAmount?.toString() || '');
      } else if (contribAmount === chosenGoal.installmentAmount?.toString()) {
        setContribAmount('');
      }
    } else {
      // For flexible or investment plans, default to empty or custom input
    }
  }, [selectedGoalId, contribType, savingGoals]);

  const [formErr, setFormErr] = useState('');
  const [formOk, setFormOk] = useState('');
  const [contribErr, setContribErr] = useState('');
  const [contribOk, setContribOk] = useState('');
  const [goalToDelete, setGoalToDelete] = useState<{ id: string; name: string } | null>(null);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  const handleStartEdit = (goal: SavingGoal) => {
    setEditingGoalId(goal.id);
    setName(goal.name);
    setTargetAmount(goal.targetAmount.toString());
    setCurrentAmount(goal.currentAmount.toString());
    setTargetDate(goal.targetDate);
    setCategory(goal.category);
    setGoalType(goal.goalType || 'flexible');
    setInstallmentAmount(goal.installmentAmount?.toString() || '');
    setTotalInstallments(goal.totalInstallments?.toString() || '');
    setPaidInstallments(goal.paidInstallments?.toString() || '');
    setStartDate(goal.startDate || (() => {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    })());
    setFormErr('');
    setFormOk('');
  };

  const handleCancelEdit = () => {
    setEditingGoalId(null);
    setName('');
    setTargetAmount('');
    setCurrentAmount('');
    setTargetDate('');
    setCategory('Emergency Fund');
    setGoalType('flexible');
    setInstallmentAmount('');
    setTotalInstallments('');
    setPaidInstallments('');
    setStartDate(() => {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    });
    setFormErr('');
    setFormOk('');
  };

  const savingCategories = [
    'Emergency Fund',
    'Retirement Pool',
    'Vacation & Travel',
    'Electronics & Gadgets',
    'Automobile / Vehicle',
    'Real Estate & Housing',
    'Investments Pool',
    'Special Celebration',
    'Other Milestone'
  ];

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr('');
    setFormOk('');

    if (!name.trim()) {
      setFormErr('Please enter a descriptive name for your savings target.');
      return;
    }

    let tgt = 0;
    let cur = 0;
    let tDate = '';
    let instAmt: number | undefined = undefined;
    let totInst: number | undefined = undefined;
    let paidInst: number | undefined = undefined;
    let sDate: string | undefined = undefined;

    if (goalType === 'fixed') {
      const parsedInstAmt = parseFloat(installmentAmount);
      const parsedTotInst = parseInt(totalInstallments, 10);
      const parsedPaidInst = parseInt(paidInstallments || '0', 10);

      if (isNaN(parsedInstAmt) || parsedInstAmt <= 0) {
        setFormErr('Please enter a valid positive installment amount.');
        return;
      }
      if (isNaN(parsedTotInst) || parsedTotInst <= 0) {
        setFormErr('Please provide a positive total installment count.');
        return;
      }
      if (isNaN(parsedPaidInst) || parsedPaidInst < 0) {
        setFormErr('Paid installments cannot be negative.');
        return;
      }
      if (parsedPaidInst > parsedTotInst) {
        setFormErr('Paid installments cannot exceed total installments.');
        return;
      }
      if (!startDate) {
        setFormErr('Please provide a valid start date.');
        return;
      }

      instAmt = parsedInstAmt;
      totInst = parsedTotInst;
      paidInst = parsedPaidInst;
      sDate = startDate;

      tgt = parsedInstAmt * parsedTotInst;
      cur = parsedInstAmt * parsedPaidInst;
      tDate = calculateCompletionDate(startDate, parsedTotInst);
    } else {
      tgt = parseFloat(targetAmount);
      cur = parseFloat(currentAmount || '0');
      tDate = targetDate;

      if (isNaN(tgt) || tgt <= 0) {
        setFormErr('Please insert a positive target sum to save.');
        return;
      }

      if (isNaN(cur) || cur < 0) {
        setFormErr('Please enter a valid starting saved amount (0 or positive).');
        return;
      }

      if (cur > tgt) {
        setFormErr('Your starting savings cannot exceed the final target amount.');
        return;
      }

      if (!tDate) {
        setFormErr('Please provide a target date for completion.');
        return;
      }

      const today = new Date();
      today.setHours(0,0,0,0);
      const chosenDate = new Date(tDate);
      if (chosenDate <= today) {
        setFormErr('The target date must fall in the future.');
        return;
      }
    }

    if (editingGoalId) {
      setFinanceData(prev => ({
        ...prev,
        savingGoals: prev.savingGoals.map(g => 
          g.id === editingGoalId
            ? { 
                ...g, 
                name: name.trim(), 
                targetAmount: tgt, 
                currentAmount: cur, 
                targetDate: tDate, 
                category,
                goalType,
                installmentAmount: instAmt,
                totalInstallments: totInst,
                paidInstallments: paidInst,
                startDate: sDate
              }
            : g
        )
      }));
      setFormOk('Savings Goal updated successfully!');
      setEditingGoalId(null);
    } else {
      const newGoal: SavingGoal = {
        id: `goal-${Date.now()}`,
        name: name.trim(),
        targetAmount: tgt,
        currentAmount: cur,
        targetDate: tDate,
        category,
        goalType,
        installmentAmount: instAmt,
        totalInstallments: totInst,
        paidInstallments: paidInst,
        startDate: sDate
      };

      setFinanceData(prev => ({
        ...prev,
        savingGoals: [...prev.savingGoals, newGoal]
      }));
      setFormOk('Savings Goal successfully established! It is visible in the metrics list.');
    }

    setName('');
    setTargetAmount('');
    setCurrentAmount('');
    setTargetDate('');
    setInstallmentAmount('');
    setTotalInstallments('');
    setPaidInstallments('');
    setGoalType('flexible');
    setStartDate(() => {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    });
    setTimeout(() => setFormOk(''), 4000);
  };

  const handleDeleteGoal = (id: string, name: string) => {
    setGoalToDelete({ id, name });
  };

  const confirmDeleteGoal = () => {
    if (!goalToDelete) return;
    setFinanceData(prev => ({
      ...prev,
      savingGoals: prev.savingGoals.filter(g => g.id !== goalToDelete.id)
    }));
    setGoalToDelete(null);
  };

  const handleAddContribution = (e: React.FormEvent) => {
    e.preventDefault();
    setContribErr('');
    setContribOk('');

    if (!selectedGoalId || !contribAmount || !contribAccId) {
      setContribErr('Please choose a savings target, select a source account, and key in the transfer amount.');
      return;
    }

    const amt = parseFloat(contribAmount);
    if (isNaN(amt) || amt <= 0) {
      setContribErr('Please enter a positive numeric contribution.');
      return;
    }

    const sourceAcc = accounts.find(a => a.id === contribAccId);
    if (!sourceAcc) {
      setContribErr('The designated source account could not be found.');
      return;
    }

    if (sourceAcc.type === 'bank' && sourceAcc.balance < amt) {
      setContribErr(`Insufficient liquid balance in ${sourceAcc.name}. You have ${formatCurrency(sourceAcc.balance, preferences)} available.`);
      return;
    }

    if (sourceAcc.type === 'credit_card') {
      const avail = (sourceAcc.limit || 0) - sourceAcc.balance;
      if (avail < amt) {
        setContribErr(`Insufficient credit limit on ${sourceAcc.name}. You have ${formatCurrency(avail, preferences)} available credit left.`);
        return;
      }
    }

    // Process balances & savings additions
    const updatedGoals = savingGoals.map(g => {
      if (g.id === selectedGoalId) {
        const newAmount = g.currentAmount + amt;
        if (g.goalType === 'fixed') {
          if (contribType === 'installment') {
            return {
              ...g,
              currentAmount: newAmount,
              paidInstallments: (g.paidInstallments || 0) + 1
            };
          } else {
            // custom one-time addon: leave paidInstallments exactly as-is
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
      if (a.id === contribAccId) {
        const balanceChange = a.type === 'bank' ? -amt : amt; // debit lowers balance, credit card outstanding goes up (unusual but supported)
        return { ...a, balance: a.balance + balanceChange };
      }
      return a;
    });

    // Create an automatic expense line to record the cash outflow
    const savingsExpense: Expense = {
      id: `exp-gcon-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      description: `Savings goal top up: ${savingGoals.find(g => g.id === selectedGoalId)?.name}`,
      amount: amt,
      category: 'Miscellaneous',
      date: new Date().toISOString().split('T')[0],
      accountId: contribAccId,
      isRecurring: false,
      savingGoalId: selectedGoalId
    };

    setFinanceData(prev => ({
      ...prev,
      savingGoals: updatedGoals,
      accounts: updatedAccounts,
      expenses: [savingsExpense, ...prev.expenses]
    }));

    setContribAmount('');
    setContribOk(`Loaded ${formatCurrency(amt, preferences)} to target milestone securely! Balance altered.`);
    setTimeout(() => setContribOk(''), 4000);
  };

  return (
    <div id="savings-root" className="grid grid-cols-1 lg:grid-cols-12 gap-6">

      {/* NEW GOAL CONFIG & TRANSFER SLIDER */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* FORM 1: CONFIGURE SAVINGS GOAL */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-50 mb-4 font-sans">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-800">{editingGoalId ? 'Modify Savings Target' : 'New Savings Target'}</h2>
            </div>
            {editingGoalId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-[10px] text-slate-400 hover:text-slate-600 font-bold bg-slate-50 hover:bg-slate-100 p-1 px-2 rounded-lg flex items-center gap-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" /> Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleCreateGoal} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Milestone Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Downpayment on Flats, Emergency Vault"
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Goal Type</label>
              <select
                value={goalType}
                onChange={(e) => setGoalType(e.target.value as 'flexible' | 'fixed' | 'investment')}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer text-slate-800"
              >
                <option value="flexible">Flexible Savings Goal</option>
                <option value="fixed">Fixed Installment Plan</option>
                <option value="investment">Investment Goal</option>
              </select>
            </div>

            {goalType === 'fixed' ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Installment Amount</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-bold">{preferences.currencySymbol}</span>
                      <input
                        type="number"
                        value={installmentAmount}
                        onChange={(e) => setInstallmentAmount(e.target.value)}
                        placeholder="e.g. 12000"
                        className="w-full text-xs border border-slate-200 rounded-lg p-2 pl-6 bg-slate-50 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Total Installments</label>
                    <input
                      type="number"
                      value={totalInstallments}
                      onChange={(e) => setTotalInstallments(e.target.value)}
                      placeholder="e.g. 10"
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Paid Installments</label>
                    <input
                      type="number"
                      value={paidInstallments}
                      onChange={(e) => setPaidInstallments(e.target.value)}
                      placeholder="e.g. 1"
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
                    />
                  </div>
                </div>

                {/* Derived Preprints Display */}
                {installmentAmount && totalInstallments && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[10px] space-y-1.5 text-slate-600 font-medium">
                    <div className="flex justify-between">
                      <span>Derived Target Amount:</span>
                      <span className="font-extrabold text-slate-900">
                        {formatCurrency((parseFloat(installmentAmount) || 0) * (parseInt(totalInstallments, 10) || 0), preferences)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Derived Saved Amount:</span>
                      <span className="font-extrabold text-emerald-600">
                        {formatCurrency((parseFloat(installmentAmount) || 0) * (parseInt(paidInstallments, 10) || 0), preferences)}
                      </span>
                    </div>
                    {startDate && (
                      <div className="flex justify-between">
                        <span>Calculated Completion Date:</span>
                        <span className="font-extrabold text-indigo-600">
                          {formatDateToHuman(calculateCompletionDate(startDate, parseInt(totalInstallments, 10) || 0))}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Sum</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-bold">{preferences.currencySymbol}</span>
                      <input
                        type="number"
                        value={targetAmount}
                        onChange={(e) => setTargetAmount(e.target.value)}
                        placeholder="e.g. 50000"
                        className="w-full text-xs border border-slate-200 rounded-lg p-2 pl-6 bg-slate-50 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pre-saved Cash</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-bold">{preferences.currencySymbol}</span>
                      <input
                        type="number"
                        value={currentAmount}
                        onChange={(e) => setCurrentAmount(e.target.value)}
                        placeholder="e.g. 5000"
                        className="w-full text-xs border border-slate-200 rounded-lg p-2 pl-6 bg-slate-50 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Completion Date</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Goal Classification</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:outline-none focus:border-indigo-500 font-medium"
              >
                {savingCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {formErr && (
              <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg text-[10px] text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {formErr}
              </div>
            )}
            {formOk && (
              <div className="p-2.5 bg-teal-50 border border-teal-100 rounded-lg text-[10px] text-teal-700 dark:bg-teal-950/20 dark:border-teal-900/30 dark:text-teal-400 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> {formOk}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                type="submit"
                className="w-full text-xs bg-indigo-600 hover:bg-indigo-700 transition text-white font-extrabold py-3 rounded-xl shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {editingGoalId ? <Edit className="w-4.5 h-4.5" /> : <Plus className="w-4.5 h-4.5" />}
                {editingGoalId ? 'Update Target Details' : 'Establish Goal'}
              </button>
              {editingGoalId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="w-full text-xs bg-slate-100 hover:bg-slate-200 transition text-slate-600 font-bold py-2.5 rounded-xl cursor-pointer"
                >
                  Discard Changes
                </button>
              )}
            </div>
          </form>
        </div>

        {/* FORM 2: CONTRIBUTE CASH */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-50 mb-3 font-sans">
            <ArrowRightLeft className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-800">Contribute cash to Goal</h2>
          </div>

          <form onSubmit={handleAddContribution} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Savings Goal</label>
              <select
                value={selectedGoalId}
                onChange={(e) => setSelectedGoalId(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="">-- Choose Savings Target --</option>
                {savingGoals.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({formatCurrency(g.targetAmount - g.currentAmount, preferences)} left)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Source Account</label>
              <select
                value={contribAccId}
                onChange={(e) => setContribAccId(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
              >
                <option value="">-- Select Source Account --</option>
                <optgroup label="Bank Accounts" className="font-semibold text-slate-700">
                  {accounts.filter(a => a.type === 'bank').map(a => (
                    <option key={a.id} value={a.id} className="font-normal text-slate-600">
                      {a.name} (Available Balance: {formatCurrency(a.balance, preferences)})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Credit Cards" className="font-semibold text-slate-700">
                  {accounts.filter(a => a.type === 'credit_card').map(a => {
                    const availableLimit = (a.limit || 0) - a.balance;
                    return (
                      <option key={a.id} value={a.id} className="font-normal text-slate-600">
                        {a.name} (Available Limit: {formatCurrency(availableLimit, preferences)})
                      </option>
                    );
                  })}
                </optgroup>
              </select>
            </div>

            {selectedGoalId && savingGoals.find(g => g.id === selectedGoalId)?.goalType === 'fixed' && (
              <div className="bg-white dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-100/80 dark:border-slate-800 space-y-2">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Contribution Strategy</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setContribType('installment')}
                    className={`py-2 px-1 text-[11px] font-extrabold rounded-lg border transition text-center select-none cursor-pointer ${
                      contribType === 'installment'
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100/50'
                    }`}
                  >
                    Pay Installment
                  </button>
                  <button
                    type="button"
                    onClick={() => setContribType('addon')}
                    className={`py-2 px-1 text-[11px] font-extrabold rounded-lg border transition text-center select-none cursor-pointer ${
                      contribType === 'addon'
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100/50'
                    }`}
                  >
                    One-time Add-on
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  {contribType === 'installment'
                    ? 'Records precise payment for 1 month block & pushes installment count +1.'
                    : 'Increases stored pool by any manual sum without incrementing instalment count.'}
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Amount to Move</label>
              <div className="relative">
                <span className="absolute left-2.5 top-2.5 text-xs text-slate-400 font-bold">{preferences.currencySymbol}</span>
                <input
                  type="number"
                  value={contribAmount}
                  onChange={(e) => setContribAmount(e.target.value)}
                  placeholder="e.g. 2500"
                  disabled={contribType === 'installment' && !!(selectedGoalId && savingGoals.find(g => g.id === selectedGoalId)?.goalType === 'fixed')}
                  className={`w-full text-xs border border-slate-200 rounded-lg p-2.5 pl-6 bg-slate-50 focus:outline-none focus:border-indigo-500 font-bold text-slate-800 ${
                    contribType === 'installment' && selectedGoalId && savingGoals.find(g => g.id === selectedGoalId)?.goalType === 'fixed'
                      ? 'opacity-85 bg-slate-100 cursor-not-allowed text-slate-500'
                      : ''
                  }`}
                />
              </div>
            </div>

            {contribErr && (
              <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg text-[10px] text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {contribErr}
              </div>
            )}
            {contribOk && (
              <div className="p-2.5 bg-teal-50 border border-teal-100 rounded-lg text-[10px] text-teal-700 dark:bg-teal-950/20 dark:border-teal-900/30 dark:text-teal-400 font-semibold flex items-center gap-1 flex-col items-start leading-tight">
                <div className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> Done!</div>
                <span>{contribOk}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full text-xs bg-indigo-600 hover:bg-indigo-700 transition text-white font-extrabold py-3 rounded-xl shadow-sm flex items-center justify-center gap-1.5"
            >
              <ArrowRightLeft className="w-4 h-4" /> Move Cash reserves
            </button>
          </form>
        </div>

      </div>

      {/* SAVINGS GAUGES LIST */}
      <div className="lg:col-span-8 space-y-6 font-sans">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Your savings milestones roadmaps</h2>
          <p className="text-slate-500 text-sm mt-0.5">Below are calculated timelines, monthly requirements, and circles of achievement.</p>
        </div>

         <div className="space-y-4">
          {savingGoals.map(goal => {
            const isFixed = goal.goalType === 'fixed';
            const daysLeft = getDaysRemaining(goal.targetDate);
            const monthsLeft = Math.ceil(daysLeft / 30) || 1;
            
            let progress = 0;
            let remainingToSave = 0;
            let targetAmt = goal.targetAmount;
            let savedAmt = goal.currentAmount;

            if (isFixed) {
              const instAmt = goal.installmentAmount || 0;
              const totInst = goal.totalInstallments || 0;
              
              targetAmt = instAmt * totInst;
              savedAmt = goal.currentAmount;
              remainingToSave = Math.max(0, targetAmt - savedAmt);
              progress = targetAmt > 0 ? (savedAmt / targetAmt) * 100 : 0;
            } else {
              targetAmt = goal.targetAmount;
              savedAmt = goal.currentAmount;
              remainingToSave = Math.max(0, targetAmt - savedAmt);
              progress = targetAmt > 0 ? (savedAmt / targetAmt) * 100 : 0;
            }

            const monthlyContributionRequired = Math.ceil(remainingToSave / monthsLeft);

            return (
              <div
                key={goal.id}
                className="bg-white p-6 md:p-7 rounded-3xl border border-slate-100 shadow-sm hover:border-slate-200 transition flex flex-col md:flex-row gap-5 items-center justify-between"
              >
                {/* Visual Gauge Left */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle cx="40" cy="40" r="32" fill="transparent" stroke="#f1f5f9" strokeWidth="6"></circle>
                      <circle
                        cx="40"
                        cy="40"
                        r="32"
                        fill="transparent"
                        stroke={progress >= 100 ? '#10b981' : '#6366f1'}
                        strokeWidth="6.5"
                        strokeDasharray={2 * Math.PI * 32}
                        strokeDashoffset={2 * Math.PI * 32 * (1 - Math.min(100, progress) / 100)}
                        className="transition-all duration-700 ease-out"
                        strokeLinecap="round"
                      ></circle>
                    </svg>
                    <span className="absolute text-xs font-extrabold text-slate-800">
                      {progress.toFixed(0)}%
                    </span>
                  </div>

                  <div>
                    <div className="flex flex-wrap gap-1 items-center animate-fade-in">
                      <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 border border-slate-100 rounded-md">
                        {goal.category}
                      </span>
                      <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 border border-slate-100 rounded-md">
                        {goal.goalType === 'fixed' 
                          ? 'Fixed Installment Plan' 
                          : goal.goalType === 'investment' 
                          ? 'Investment Goal' 
                          : 'Flexible Savings Goal'}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-800 mt-1">{goal.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Completion Date: {formatDateToHuman(goal.targetDate)} ({daysLeft} Days left)
                    </p>
                  </div>
                </div>

                {/* Progress Details Mid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-l-0 md:border-l border-slate-100/60 pl-0 md:pl-5 w-full md:w-auto grow">
                  <div className="text-left">
                    <span className="text-[10px] text-slate-400 uppercase font-bold leading-3 block">
                      {isFixed ? 'Saved Amount' : 'Total Saved'}
                    </span>
                    <span className="text-sm font-bold text-slate-800 block mt-0.5">{formatCurrency(savedAmt, preferences)}</span>
                    <span className="text-[10px] text-slate-400 block font-semibold mt-0.5">of {formatCurrency(targetAmt, preferences)}</span>
                  </div>

                  <div className="text-left">
                    <span className="text-[10px] text-slate-400 uppercase font-bold leading-3 block">Remaining Amount</span>
                    <span className={`text-sm font-bold block mt-0.5 ${remainingToSave === 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                      {remainingToSave === 0 ? 'Fully Saved!' : formatCurrency(remainingToSave, preferences)}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-semibold mt-0.5">Needed to complete</span>
                  </div>

                  <div className="text-left col-span-2 sm:col-span-1 border-t sm:border-t-0 border-slate-50/60 pt-2.5 sm:pt-0">
                    {isFixed ? (
                      <>
                        <span className="text-[10px] text-slate-400 uppercase font-bold leading-3 block text-indigo-600">Installment Amount</span>
                        <span className="text-sm font-extrabold text-indigo-600 block mt-0.5">
                          {formatCurrency(goal.installmentAmount || 0, preferences)}/mo
                        </span>
                        <span className="text-[10px] text-slate-400 block font-bold leading-snug mt-0.5">
                          Paid {goal.paidInstallments} of {goal.totalInstallments} installments
                        </span>
                        <span className="text-[10px] text-indigo-500 block font-extrabold leading-snug mt-0.5">
                          Remaining {Math.max(0, (goal.totalInstallments || 0) - (goal.paidInstallments || 0))} installments
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-[10px] text-slate-400 uppercase font-bold leading-3 block text-indigo-600">Monthly Deposit req</span>
                        <span className="text-sm font-extrabold text-indigo-600 block mt-0.5">
                          {remainingToSave === 0 ? '0' : formatCurrency(monthlyContributionRequired, preferences)} / mo
                        </span>
                        <span className="text-[10px] text-slate-400 block font-semibold mt-0.5">across {monthsLeft} month{monthsLeft > 1 ? 's' : ''}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions Right */}
                <div className="shrink-0 text-right w-full md:w-auto flex justify-end gap-1 items-center">
                  <button
                    onClick={() => handleStartEdit(goal)}
                    className={`p-2 rounded-xl transition cursor-pointer ${
                      editingGoalId === goal.id 
                        ? 'text-indigo-600 bg-indigo-50 border border-indigo-200' 
                        : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                    }`}
                    title="Edit Savings Milestone"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteGoal(goal.id, goal.name)}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                    title="Remove Savings Milestone"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

              </div>
            );
          })}

          {savingGoals.length === 0 && (
            <div className="p-16 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30 shadow-xs animate-fade-in">
              <Shield className="w-12 h-12 text-indigo-300 dark:text-indigo-600 mx-auto stroke-1" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-4">Unlocks custom milestone progress trackers</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 max-w-[340px] mx-auto leading-relaxed">
                No savings milestones defined yet. Fill out the target configuration on the left to activate deadlines and contribution forecasts!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CUSTOM CONFIRMATION DELETION MODAL */}
      {goalToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 md:p-8 shadow-xl border border-slate-100/80 dark:border-slate-800/50 animate-scale-up">
            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mb-4 border border-rose-100 dark:border-rose-900/30">
              <Trash2 className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-sans tracking-tight">Delete Savings Milestone?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed font-medium">
              Are you sure you want to delete the savings goal <span className="font-bold text-slate-1000 dark:text-slate-200">"{goalToDelete.name}"</span>? 
              This removes the target from active monthly charts and progress tracking. Any simulated reserves previously allocated will be released.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={confirmDeleteGoal}
                className="flex-1 text-xs bg-rose-600 hover:bg-rose-700 transition duration-150 text-white font-extrabold py-3 px-4 rounded-xl cursor-pointer shadow-sm hover:shadow-rose-600/10 active:scale-[0.98]"
              >
                Yes, Delete Goal
              </button>
              <button
                onClick={() => setGoalToDelete(null)}
                className="flex-1 text-xs bg-slate-150 hover:bg-slate-200 text-slate-705 font-bold py-3 px-4 rounded-xl transition duration-150 cursor-pointer active:scale-[0.98]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
