/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FinanceData, Income, FinancialAccount } from '../types';
import { formatCurrency } from '../utils/formatters';
import { Landmark, ArrowUpRight, Plus, Trash2, ShieldAlert, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface IncomeSectionProps {
  data: FinanceData;
  setFinanceData: React.Dispatch<React.SetStateAction<FinanceData>>;
}

export default function IncomeSection({ data, setFinanceData }: IncomeSectionProps) {
  const { incomes, accounts, preferences } = data;

  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<'monthly' | 'one-time'>('monthly');
  const [date, setDate] = useState('');
  const [targetAccountId, setTargetAccountId] = useState('');

  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [incomeToDelete, setIncomeToDelete] = useState<{ id: string; name: string } | null>(null);

  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

  const sortedIncomes = React.useMemo(() => {
    const list = [...incomes];
    return list.sort((a, b) => {
      if (sortBy === 'date_desc') return b.date.localeCompare(a.date);
      if (sortBy === 'date_asc') return a.date.localeCompare(b.date);
      if (sortBy === 'amount_desc') return b.amount - a.amount;
      if (sortBy === 'amount_asc') return a.amount - b.amount;
      return 0;
    });
  }, [incomes, sortBy]);

  const handleAddIncome = (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setOk('');

    if (!source.trim()) {
      setErr('Please state the source description of this income stream.');
      return;
    }

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setErr('Please input a valid numeric amount greater than 0.');
      return;
    }

    if (!date) {
      setErr('Please register the date this income was or will be received.');
      return;
    }

    const newIncome: Income = {
      id: `inc-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      source: source.trim(),
      amount: amt,
      frequency,
      date,
    };

    // If a destination bank account is selected, let's automatically add this amount to its balance!
    let updatedAccounts = [...accounts];
    if (targetAccountId) {
      updatedAccounts = accounts.map(acc => {
        if (acc.id === targetAccountId) {
          return { ...acc, balance: acc.balance + amt };
        }
        return acc;
      });
    }

    setFinanceData(prev => ({
      ...prev,
      incomes: [...prev.incomes, newIncome],
      accounts: updatedAccounts
    }));

    setSource('');
    setAmount('');
    setDate('');
    setTargetAccountId('');
    setOk(`Registered income of ${formatCurrency(amt, preferences)} successfully! Bank balances incremented.`);
    setTimeout(() => setOk(''), 4000);
  };

  const handleDeleteIncome = (id: string, amount: number, sourceName: string) => {
    setIncomeToDelete({ id, name: sourceName });
  };

  const confirmDeleteIncome = () => {
    if (!incomeToDelete) return;
    setFinanceData(prev => ({
      ...prev,
      incomes: prev.incomes.filter(inc => inc.id !== incomeToDelete.id)
    }));
    setIncomeToDelete(null);
  };

  const totalMonthlyIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);

  return (
    <div id="income-root" className="grid grid-cols-1 lg:grid-cols-12 gap-6">

      {/* FORM: ADD INFLOW SOURCE */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm lg:col-span-4 h-fit">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-50 mb-4">
          <ArrowUpRight className="w-5 h-5 text-indigo-600 animate-bounce" />
          <h2 className="text-base font-bold text-slate-800">Log Income Stream</h2>
        </div>

        <form onSubmit={handleAddIncome} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Inflow Source</label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. Acme Corp Salary, Consultancy project"
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Inflow Amount</label>
            <div className="relative">
              <span className="absolute left-2.5 top-2.5 text-xs text-slate-400 font-bold">{preferences.currencySymbol}</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 70000"
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 pl-7 bg-slate-50 focus:outline-none focus:border-indigo-500 font-bold text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as 'monthly' | 'one-time')}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:outline-none focus:border-indigo-500 font-medium text-slate-800"
              >
                <option value="monthly">Monthly Recurring</option>
                <option value="one-time">One-Time / Spot</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Check Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 focus:outline-none focus:border-indigo-500 font-medium text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Deposit Destination bank <span className="text-[10px] text-slate-400">(Optional)</span></label>
            <select
              value={targetAccountId}
              onChange={(e) => setTargetAccountId(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:outline-none focus:border-indigo-500 font-medium text-slate-800"
            >
              <option value="">-- Do not deposit to balance --</option>
              {accounts.filter(a => a.type === 'bank').map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} (Deposit target)
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-1">If selected, the funds will be instantly simulated into the cash channel balance pool.</p>
          </div>

          {err && (
            <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-[10px] text-rose-600 font-bold flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> {err}
            </div>
          )}
          {ok && (
            <div className="p-2.5 bg-teal-50 border border-teal-100 rounded-xl text-[10px] text-teal-700 font-bold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-teal-600" /> {ok}
            </div>
          )}

          <button
            type="submit"
            className="w-full text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Income Source
          </button>
        </form>
      </div>

      {/* INCOME STREAMS LIST */}
      <div className="lg:col-span-8 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 md:p-7 rounded-3xl border border-slate-100 shadow-sm gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-800">Registered Income Ledger</h2>
            <p id="total-income-readout" className="text-xs text-slate-400 mt-0.5">Tracking periodic wage checks or project advances.</p>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-[8px] uppercase font-bold text-slate-400 mb-0.5">Sort Ledger By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-[11px] border border-slate-200 rounded-lg p-1.5 bg-slate-50 focus:outline-none focus:border-indigo-500 font-bold text-slate-600"
              >
                <option value="date_desc">Date (Newest first)</option>
                <option value="date_asc">Date (Oldest first)</option>
                <option value="amount_desc">Amount (Highest first)</option>
                <option value="amount_asc">Amount (Lowest first)</option>
              </select>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 leading-3 block">Total Combined Inflow</span>
              <span className="text-xl font-black text-emerald-600">{formatCurrency(totalMonthlyIncome, preferences)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {sortedIncomes.map(inc => (
            <div
              key={inc.id}
              className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs hover:border-slate-200 transition flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm shrink-0 dark:bg-emerald-500/15 dark:text-emerald-400">
                  {preferences.currencySymbol}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{inc.source}</h4>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mt-0.5 tracking-wider">
                    {inc.frequency === 'monthly' ? 'Monthly Salary Grade' : 'One-off Spot Check'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-sm font-black text-slate-800">{formatCurrency(inc.amount, preferences)}</span>
                  <span className="text-[10px] text-slate-400 block font-semibold">{inc.date}</span>
                </div>
                <button
                  onClick={() => handleDeleteIncome(inc.id, inc.amount, inc.source)}
                  className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
                  title="Remove Income Line"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>
          ))}

          {incomes.length === 0 && (
            <div className="p-12 text-center bg-white dark:bg-slate-900/30 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs animate-fade-in">
              <Landmark className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-750 dark:text-slate-300 mt-3">No income statements filed</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 max-w-[280px] mx-auto leading-relaxed">Please add your monthly salary streams or spot incomes on the left panel to calculate financial balances correctly.</p>
            </div>
          )}
        </div>
      </div>

      {/* CUSTOM CONFIRMATION DELETION MODAL */}
      {incomeToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-xl border border-slate-100/80 animate-scale-up">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4 border border-rose-100">
              <Trash2 className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-sans tracking-tight">Delete Income Stream Entry?</h3>
            <p className="text-xs text-slate-500 mt-2.5 leading-relaxed font-medium">
              Do you want to delete the income entry <span className="font-bold text-slate-1040">"{incomeToDelete.name}"</span>? 
              (Please note: simulated balances previously deposited to bank accounts will not be retroactively deducted, keeping active accounts aligned).
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={confirmDeleteIncome}
                className="flex-1 text-xs bg-rose-600 hover:bg-rose-700 transition duration-150 text-white font-extrabold py-3 px-4 rounded-xl cursor-pointer shadow-sm hover:shadow-rose-600/10 active:scale-[0.98]"
              >
                Yes, Delete Income
              </button>
              <button
                onClick={() => setIncomeToDelete(null)}
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
