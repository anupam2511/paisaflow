/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FinanceData, EmiItem, FinancialAccount } from '../types';
import { formatCurrency } from '../utils/formatters';
import { 
  CreditCard, 
  Tag, 
  Calendar, 
  Clock, 
  Sparkles, 
  Plus, 
  Trash2, 
  Edit3, 
  TrendingDown, 
  TrendingUp, 
  Coins, 
  Percent, 
  CheckCircle,
  AlertCircle,
  Gauge
} from 'lucide-react';

interface EmisSectionProps {
  data: FinanceData;
  setFinanceData: React.Dispatch<React.SetStateAction<FinanceData>>;
}

export default function EmisSection({ data, setFinanceData }: EmisSectionProps) {
  const { emis = [], accounts, budgets, preferences } = data;

  // New/Edit State form fields
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(budgets[0]?.category || 'Shopping');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [totalTenure, setTotalTenure] = useState('12');
  const [installmentsPaid, setInstallmentsPaid] = useState('0');
  const [startDate, setStartDate] = useState('2026-01');
  const [interestRate, setInterestRate] = useState('0');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Editing state
  const [editingEmiId, setEditingEmiId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form error & success metrics
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  // Confirmation state for deletes
  const [emiToDelete, setEmiToDelete] = useState<{ id: string; name: string } | null>(null);

  // Filters
  const [selectedCardFilter, setSelectedCardFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');



  // Core KPI Calculations
  const activeEmis = emis.filter(e => e.isActive);
  const averageEmiPerMonth = activeEmis.reduce((sum, e) => sum + e.amount, 0);
  
  const totalRemainingInstallmentsValue = activeEmis.reduce((sum, e) => {
    const remaining = Math.max(0, e.totalTenure - e.installmentsPaid);
    return sum + (e.amount * remaining);
  }, 0);

  const completedEmisValue = emis.reduce((sum, e) => {
    return sum + (e.amount * e.installmentsPaid);
  }, 0);

  const completedEmisCount = emis.filter(e => e.installmentsPaid >= e.totalTenure).length;

  // Grouping Calculations: Card/Bank Tracking
  const cardBreakdown = accounts.map(acc => {
    const matchedEmis = activeEmis.filter(e => e.accountId === acc.id);
    const amountSum = matchedEmis.reduce((sum, e) => sum + e.amount, 0);
    return {
      account: acc,
      amountSum,
      count: matchedEmis.length
    };
  }).filter(item => item.count > 0);

  // Grouping Calculations: Category Tracking
  const categoryBreakdown = budgets.map(b => {
    const matchedEmis = activeEmis.filter(e => e.category === b.category);
    const amountSum = matchedEmis.reduce((sum, e) => sum + e.amount, 0);
    return {
      category: b.category,
      amountSum,
      count: matchedEmis.length
    };
  }).filter(item => item.count > 0);

  // Quick Action: Increment paid installments by 1
  const handleQuickPayIncrement = (emiId: string) => {
    let affectedEmiName = '';
    let affectedAmount = 0;
    let affectedAccountName = '';

    setFinanceData(prev => {
      const targetEmi = (prev.emis || []).find(e => e.id === emiId);
      if (!targetEmi) return prev;

      const nextPaidCount = Math.min(targetEmi.totalTenure, targetEmi.installmentsPaid + 1);
      if (nextPaidCount === targetEmi.installmentsPaid) {
        return prev;
      }

      affectedEmiName = targetEmi.name;
      affectedAmount = targetEmi.amount;

      const matchedAcc = prev.accounts.find(a => a.id === targetEmi.accountId);
      affectedAccountName = matchedAcc ? matchedAcc.name : 'Selected Account';

      // Deduct from bank or add to credit card outstanding amount
      const updatedAccounts = prev.accounts.map(a => {
        if (a.id === targetEmi.accountId) {
          if (a.type === 'bank') {
            return { ...a, balance: a.balance - targetEmi.amount }; // bank balance reduces
          } else {
            return { ...a, balance: a.balance + targetEmi.amount }; // outstanding debt on cards increases
          }
        }
        return a;
      });

      // Update the EMI installments paid and active status
      const updatedEmis = (prev.emis || []).map(emi => {
        if (emi.id === emiId) {
          const completedNow = nextPaidCount === emi.totalTenure;
          return {
            ...emi,
            installmentsPaid: nextPaidCount,
            isActive: completedNow ? false : emi.isActive
          };
        }
        return emi;
      });

      // Create standard expense item to log historical ledger footprints
      const todayString = new Date().toISOString().split('T')[0];
      const newExpense = {
        id: `exp-emi-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        description: `EMI Pay: ${targetEmi.name} (${nextPaidCount}/${targetEmi.totalTenure})`,
        amount: targetEmi.amount,
        category: targetEmi.category || 'EMI / Loans',
        date: todayString,
        accountId: targetEmi.accountId,
        isRecurring: false
      };

      return {
        ...prev,
        accounts: updatedAccounts,
        emis: updatedEmis,
        expenses: [newExpense, ...prev.expenses]
      };
    });

    if (affectedEmiName) {
      setOk(`Logged +1 Paid for "${affectedEmiName}" & created ${formatCurrency(affectedAmount, preferences)} expense against "${affectedAccountName}".`);
    } else {
      setOk('Logged +1 Paid Installment successfully!');
    }
    setTimeout(() => setOk(''), 5000);
  };

  // Safe Mode: Initiates Edit Fill
  const handleSelectToEdit = (emi: EmiItem) => {
    setEditingEmiId(emi.id);
    setName(emi.name);
    setAmount(emi.amount.toString());
    setCategory(emi.category);
    setAccountId(emi.accountId);
    setTotalTenure(emi.totalTenure.toString());
    setInstallmentsPaid(emi.installmentsPaid.toString());
    
    // Normalize date format (YYYY-MM-DD or YYYY-MM) to YYYY-MM for month selector
    if (emi.startDate && emi.startDate.length > 7) {
      setStartDate(emi.startDate.substring(0, 7));
    } else {
      setStartDate(emi.startDate || '2026-01');
    }

    setInterestRate(emi.interestRate !== undefined ? emi.interestRate.toString() : '0');
    setNotes(emi.notes || '');
    setIsActive(emi.isActive);
    setShowAddForm(true);
    setErr('');
    setOk('');

    // Smooth scroll user up to the active edit form
    setTimeout(() => {
      const formEl = document.getElementById('emi-form-container');
      if (formEl) {
        formEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 80);
  };

  // Reset form helper
  const handleResetForm = () => {
    setName('');
    setAmount('');
    setCategory(budgets[0]?.category || 'Shopping');
    setAccountId(accounts[0]?.id || '');
    setTotalTenure('12');
    setInstallmentsPaid('0');
    setStartDate('2026-01');
    setInterestRate('0');
    setNotes('');
    setIsActive(true);
    setEditingEmiId(null);
    setShowAddForm(false);
    setErr('');
  };

  // Action: Add / Update EMI form
  const handleSaveEmi = (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setOk('');

    if (!name.trim()) {
      setErr('Please provide a descriptive name for the EMI.');
      return;
    }

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setErr('Please state a valid positive monthly payment amount.');
      return;
    }

    const tenureVal = parseInt(totalTenure);
    if (isNaN(tenureVal) || tenureVal <= 0) {
      setErr('Total tenure must be at least 1 month.');
      return;
    }

    const paidVal = parseInt(installmentsPaid);
    if (isNaN(paidVal) || paidVal < 0 || paidVal > tenureVal) {
      setErr(`Installments completed must be a number between 0 and total tenure ${tenureVal}.`);
      return;
    }

    const rateVal = parseFloat(interestRate);
    if (isNaN(rateVal) || rateVal < 0) {
      setErr('Interest rate must be a non-negative percentage.');
      return;
    }

    if (!accountId) {
      setErr('Please associate this EMI with a card or bank account.');
      return;
    }

    const updatedEmi: EmiItem = {
      id: editingEmiId || `emi-${Date.now()}`,
      name: name.trim(),
      amount: amt,
      category,
      accountId,
      totalTenure: tenureVal,
      installmentsPaid: paidVal,
      startDate,
      interestRate: rateVal,
      isActive: paidVal >= tenureVal ? false : isActive,
      notes: notes.trim() || undefined
    };

    setFinanceData(prev => {
      const baseEmis = prev.emis || [];
      let finalEmis;
      if (editingEmiId) {
        finalEmis = baseEmis.map(item => item.id === editingEmiId ? updatedEmi : item);
      } else {
        finalEmis = [...baseEmis, updatedEmi];
      }
      return {
        ...prev,
        emis: finalEmis
      };
    });

    setOk(editingEmiId ? 'EMI schedule updated successfully!' : 'New EMI schedule activated successfully!');
    handleResetForm();
    setTimeout(() => setOk(''), 3000);
  };

  // Action: Delete confirmed EMI
  const handleConfirmDelete = () => {
    if (!emiToDelete) return;

    setFinanceData(prev => ({
      ...prev,
      emis: (prev.emis || []).filter(e => e.id !== emiToDelete.id)
    }));

    setOk(`Deleted EMI tracker: "${emiToDelete.name}"`);
    setEmiToDelete(null);
    setTimeout(() => setOk(''), 3000);
  };

  // Filter conditions
  const filteredEmis = emis.filter(emi => {
    const cardMatch = selectedCardFilter === 'all' || emi.accountId === selectedCardFilter;
    const catMatch = selectedCategoryFilter === 'all' || emi.category === selectedCategoryFilter;
    return cardMatch && catMatch;
  });

  return (
    <div id="emi-section-wrapper" className="space-y-6">
      
      {/* SECTION HEADER & CRITICAL META */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500 shrink-0" />
            EMI & Loan Trackers
          </h2>
          <p className="text-xs text-slate-500">
            Control, audit, and analyze outstanding monthly installments across credit cards, bank loans, and categories.
          </p>
        </div>
        
        <button
          onClick={() => {
            if (showAddForm) handleResetForm();
            else setShowAddForm(true);
          }}
          className={`flex items-center gap-2 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all duration-200 ${
            showAddForm 
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' 
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow'
          }`}
        >
          {showAddForm ? 'Cancel Form' : (
            <>
              <Plus className="w-4 h-4" />
              Register New EMI
            </>
          )}
        </button>
      </div>

      {/* CORE ALERTS/SUCCESS MESSAGES */}
      {ok && (
        <div className="bg-emerald-50 text-emerald-700 text-xs font-semibold p-4 rounded-xl border border-emerald-100 flex items-center gap-2.5 shadow-xs">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{ok}</span>
        </div>
      )}

      {/* ADD / EDIT FORM BOX */}
      {showAddForm && (
        <form id="emi-form-container" onSubmit={handleSaveEmi} className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-4 max-w-4xl">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              {editingEmiId ? 'Modify Installment Parameters' : 'Register New Payment Installment Schedule'}
            </h3>
            {editingEmiId && (
              <span className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded uppercase">
                Editing Mode
              </span>
            )}
          </div>

          {err && (
            <div className="bg-rose-50 text-rose-700 text-xs font-semibold p-3.5 rounded-xl border border-rose-100 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{err}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* NAME */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">EMI Name / Descriptor</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. MacBook Pro No-cost Card EMI"
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
              />
            </div>

            {/* MONTHLY AMOUNT */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Monthly Installment Amount (EMI)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">{preferences.currencySymbol}</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 5400"
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 pl-7 bg-slate-50 focus:outline-none focus:border-indigo-500 font-mono font-bold text-slate-800"
                />
              </div>
            </div>

            {/* ASSOCIATED CREDIT CARD OR BANK */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Debited Credit Card / Bank Account</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:outline-none focus:border-indigo-500 font-semibold text-slate-700"
              >
                <option value="">-- Select Source --</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.institution} - {acc.name} ({acc.type === 'credit_card' ? 'Card' : 'Bank'})
                  </option>
                ))}
              </select>
            </div>

            {/* CATEGORY */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Expenditure Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:outline-none focus:border-indigo-500 font-semibold text-slate-700"
              >
                {budgets.map(b => (
                  <option key={b.category} value={b.category}>{b.category}</option>
                ))}
                <option value="Electronics">Electronics</option>
                <option value="Shopping">Shopping</option>
                <option value="Rent & Utilities">Rent & Utilities</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </select>
            </div>

            {/* TOTAL TENURE */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Total Tenure (Months)</label>
              <input
                type="number"
                value={totalTenure}
                onChange={(e) => {
                  const val = e.target.value;
                  setTotalTenure(val);
                  const parsedTenure = parseInt(val, 10);
                  const parsedPaid = parseInt(installmentsPaid, 10);
                  if (!isNaN(parsedPaid) && !isNaN(parsedTenure) && parsedPaid < parsedTenure) {
                    setIsActive(true);
                  }
                }}
                placeholder="e.g. 12"
                min="1"
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
              />
            </div>

            {/* INSTALLMENTS GIVEN / COMPLETED */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Instalments Already Given</label>
              <input
                type="number"
                value={installmentsPaid}
                onChange={(e) => {
                  const val = e.target.value;
                  setInstallmentsPaid(val);
                  const parsedPaid = parseInt(val, 10);
                  const parsedTenure = parseInt(totalTenure, 10);
                  if (!isNaN(parsedPaid) && !isNaN(parsedTenure) && parsedPaid < parsedTenure) {
                    setIsActive(true);
                  }
                }}
                placeholder="e.g. 3"
                min="0"
                max={totalTenure}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
              />
            </div>

            {/* START DATE */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">EMI Start Period</label>
              <input
                type="month"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
              />
            </div>

            {/* INTEREST RATE */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Annual Interest Rate (%) <span className="text-slate-400 font-normal">(0 = No-Cost)</span></label>
              <div className="relative">
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">%</span>
                <input
                  type="number"
                  step="0.01"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  placeholder="e.g. 13.5"
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 pr-7 bg-slate-50 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
                />
              </div>
            </div>

            {/* IS ACTIVE TOGGLE */}
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-slate-700">This EMI is currently active</span>
              </label>
            </div>
          </div>

          {/* NOTES */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Internal Notes & Description</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Preselected 18-month duration with HDFC CC credit points checkout discount."
              rows={2}
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:outline-none focus:border-indigo-500 font-medium text-slate-700"
            />
          </div>

          {/* CONTROL CTA BUTTONS */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleResetForm}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 px-3 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors"
            >
              {editingEmiId ? 'Update EMI' : 'Activate EMI Plan'}
            </button>
          </div>
        </form>
      )}

      {/* CORE HIGH-POLISHED METRIC CARDS */}
      <div id="emi-kpi-grid" className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* MONTHLY BURDEN */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between min-h-[110px]">
          <div>
            <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-wider font-sans">
              Monthly Burden
            </span>
            <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-2.5">Avg EMI Per Month</h3>
          </div>
          <p className="text-xl lg:text-2xl font-black text-slate-900 mt-1 font-mono tracking-tight leading-none">
            {formatCurrency(averageEmiPerMonth, preferences)}
          </p>
        </div>

        {/* OUTSTANDING PAYMENTS / DEBT */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between min-h-[110px]">
          <div>
            <span className="text-[9px] font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md uppercase tracking-wider font-sans">
              Pending Principal
            </span>
            <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-2.5">Total Outstanding EMI</h3>
          </div>
          <p className="text-xl lg:text-2xl font-black text-slate-900 mt-1 font-mono tracking-tight leading-none">
            {formatCurrency(totalRemainingInstallmentsValue, preferences)}
          </p>
        </div>

        {/* TOTAL INVESTED OVER LIFETIME OR PAID OUT */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between min-h-[110px]">
          <div>
            <span className="text-[9px] font-extrabold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md uppercase tracking-wider font-sans">
              Sunk Capital
            </span>
            <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-2.5">Completed EMI Paid</h3>
          </div>
          <p className="text-xl lg:text-2xl font-black text-slate-900 mt-1 font-mono tracking-tight leading-none">
            {formatCurrency(completedEmisValue, preferences)}
          </p>
        </div>

        {/* COMPLETED EMIS RATIO */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between min-h-[110px]">
          <div>
            <span className="text-[9px] font-extrabold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md uppercase tracking-wider font-sans">
              Success Ratio
            </span>
            <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-2.5 font-sans">Closed Accounts</h3>
          </div>
          <p className="text-xl lg:text-2xl font-black text-slate-900 mt-1 font-mono tracking-tight leading-none">
            {completedEmisCount} <span className="text-xs text-slate-400 font-normal">Schedules</span>
          </p>
        </div>
      </div>

      {/* DETAILED CATEGORY & CARD ANALYTICS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* CARD/ACCOUNT BREAKDOWN */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 lg:col-span-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-500" />
              Outstanding Card & Loan Burden
            </h3>
            <span className="text-[10px] bg-slate-100 font-bold px-2 py-0.5 rounded text-slate-600 font-mono">
              {cardBreakdown.length} Accounts
            </span>
          </div>

          {cardBreakdown.length === 0 ? (
            <div className="text-center py-6 bg-slate-50/30 dark:bg-slate-900/10 rounded-2xl border border-dashed border-slate-150 dark:border-slate-800 p-4">
              <CreditCard className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto stroke-1" />
              <p className="text-xs text-slate-400 dark:text-slate-500 italic mt-2">No credit card or bank loans active with dynamic EMIs.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cardBreakdown.map((item, idx) => {
                const totalBurdenPercent = averageEmiPerMonth > 0 ? (item.amountSum / averageEmiPerMonth) * 100 : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-700">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.account.color }} />
                        <span className="font-bold">{item.account.institution}</span>
                        <span className="text-slate-400 text-[10px]">({item.account.name})</span>
                      </div>
                      <div className="text-right font-mono font-bold text-slate-800">
                        {formatCurrency(item.amountSum, preferences)}/mo
                        <span className="text-[10px] text-slate-400 font-normal block">({item.count} Active)</span>
                      </div>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="h-1.5 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${totalBurdenPercent}%`,
                          backgroundColor: item.account.color
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CATEGORY BREAKDOWN */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 lg:col-span-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Tag className="w-4 h-4 text-indigo-500" />
              Category Allocations
            </h3>
            <span className="text-[10px] bg-slate-100 font-bold px-2 py-0.5 rounded text-slate-600 font-mono">
              {categoryBreakdown.length} Categories
            </span>
          </div>

          {categoryBreakdown.length === 0 ? (
            <div className="text-center py-6 bg-slate-50/30 dark:bg-slate-900/10 rounded-2xl border border-dashed border-slate-150 dark:border-slate-800 p-4">
              <Tag className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto stroke-1" />
              <p className="text-xs text-slate-400 dark:text-slate-500 italic mt-2">No EMI schedules linked to categories.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {categoryBreakdown.map((item, idx) => {
                const totalBurdenPercent = averageEmiPerMonth > 0 ? (item.amountSum / averageEmiPerMonth) * 100 : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-100 text-slate-700 font-bold text-[9px] px-2 py-0.5 rounded font-mono uppercase">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-right font-mono font-bold text-slate-800">
                        {formatCurrency(item.amountSum, preferences)}/mo
                        <span className="text-[10px] text-slate-400 font-normal block">({item.count} Active)</span>
                      </div>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="h-1.5 rounded-full bg-indigo-600 transition-all duration-300"
                        style={{ width: `${totalBurdenPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* EMI SCHEDULES DYNAMIC INTERACTIVE LIST BOARD */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5">
        
        {/* FILTER BAR ROW */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-3 mb-4 gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-indigo-500" />
              EMI Installment Schedules List
            </h3>
            <span className="text-[10px] bg-slate-100 font-bold px-2 py-0.5 rounded text-slate-500">
              {filteredEmis.length} Trackers
            </span>
          </div>

          {/* DYNAMIC DROPDOWN FILTER ENGINE */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div>
              <select
                value={selectedCardFilter}
                onChange={(e) => setSelectedCardFilter(e.target.value)}
                className="w-full text-[11px] border border-slate-200 rounded-lg p-2 bg-slate-50 focus:outline-none font-bold text-slate-600"
              >
                <option value="all">💳 All Payment Instruments</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>💳 {a.institution} - {a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="w-full text-[11px] border border-slate-200 rounded-lg p-2 bg-slate-50 focus:outline-none font-bold text-slate-600"
              >
                <option value="all">🏷️ All Spend Categories</option>
                {budgets.map(b => (
                  <option key={b.category} value={b.category}>🏷️ {b.category}</option>
                ))}
                <option value="Electronics">🏷️ Electronics</option>
                <option value="Shopping">🏷️ Shopping</option>
                <option value="Rent & Utilities">🏷️ Rent & Utilities</option>
                <option value="Miscellaneous">🏷️ Miscellaneous</option>
              </select>
            </div>
          </div>
        </div>

        {/* LIST TABLE CONTAINER */}
        {filteredEmis.length === 0 ? (
          <div className="text-center py-12 bg-slate-50/30 dark:bg-slate-900/10 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-6 animate-fade-in">
            <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 rounded-xl w-fit mx-auto mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No matching EMI installment trackers found.</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">Refine your card or category filters or add a new checklist schedule.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pl-1">Descriptor / Start date</th>
                  <th className="pb-3">Source Account</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3 text-right">EMI burden</th>
                  <th className="pb-3 text-center">Tenure Progress</th>
                  <th className="pb-3 text-right">Sunk / Outstanding</th>
                  <th className="pb-3 text-center">Action increments</th>
                  <th className="pb-3 text-right pr-1">Ops</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmis.map((emi) => {
                  const accountObj = accounts.find(a => a.id === emi.accountId);
                  const progressPercent = Math.round((emi.installmentsPaid / emi.totalTenure) * 100);
                  const remainingInstallments = emi.totalTenure - emi.installmentsPaid;
                  const sunkSum = emi.amount * emi.installmentsPaid;
                  const futureSum = emi.amount * remainingInstallments;

                  const isBeingEdited = editingEmiId === emi.id;

                  return (
                    <tr 
                      key={emi.id} 
                      className={`text-xs text-slate-700 transition-all duration-150 group ${
                        isBeingEdited 
                          ? 'bg-indigo-50/60 dark:bg-indigo-950/20 border-l-[3px] border-indigo-500 font-medium' 
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      
                      {/* DESCRIPTOR */}
                      <td className="py-3.5 pl-1">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          {emi.name}
                          {!emi.isActive && emi.installmentsPaid >= emi.totalTenure && (
                            <span className="text-[8px] bg-slate-100 font-extrabold text-slate-400 px-1.5 py-0.5 rounded font-sans tracking-wide uppercase">
                              Closed
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-medium">
                          <span className="flex items-center gap-0.5 font-mono">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {emi.startDate} start
                          </span>
                          {emi.interestRate ? (
                            <span className="text-rose-500 bg-rose-50 px-1 rounded text-[9px] font-bold">
                              {emi.interestRate}% APR
                            </span>
                          ) : (
                            <span className="text-teal-600 bg-teal-50 px-1 rounded text-[9px] font-extrabold">
                              No-Cost
                            </span>
                          )}
                        </div>
                        {emi.notes && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[180px] italic mt-1 font-sans">
                            "{emi.notes}"
                          </div>
                        )}
                      </td>

                      {/* CARD/BANK */}
                      <td className="py-3.5">
                        {accountObj ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: accountObj.color }} />
                            <div>
                              <div className="font-bold text-slate-700">{accountObj.institution}</div>
                              <div className="text-[9px] text-slate-400 uppercase font-bold tracking-tight">{accountObj.name}</div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Unknown account</span>
                        )}
                      </td>

                      {/* CATEGORY */}
                      <td className="py-3.5">
                        <span className="bg-slate-100 text-slate-600 font-bold text-[9px] px-2 py-0.5 rounded font-mono uppercase">
                          {emi.category}
                        </span>
                      </td>

                      {/* MONTHLY EMI */}
                      <td className="py-3.5 text-right font-mono font-black text-slate-900">
                        {formatCurrency(emi.amount, preferences)}
                      </td>

                      {/* PROGRESS BAR */}
                      <td className="py-3.5 px-4 min-w-[130px]">
                        <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                          <span>{emi.installmentsPaid} of {emi.totalTenure} paid</span>
                          <span className="font-mono">{progressPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              progressPercent >= 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <div className="text-right text-[9px] text-slate-400 mt-0.5">
                          {remainingInstallments === 0 ? 'Fully completed!' : `${remainingInstallments} instalments remaining`}
                        </div>
                      </td>

                      {/* CAPITAL SUM OUTSTANDING */}
                      <td className="py-3.5 text-right">
                        <div className="font-mono text-slate-800 font-bold">
                          {formatCurrency(futureSum, preferences)}
                          <span className="text-[10px] text-slate-400 font-normal block">Outstanding</span>
                        </div>
                        <div className="font-mono text-slate-400 text-[10px] mt-0.5">
                          Paid: {formatCurrency(sunkSum, preferences)}
                        </div>
                      </td>

                      {/* QUICK INCREMENT */}
                      <td className="py-3.5 text-center">
                        {remainingInstallments > 0 ? (
                          <button
                            onClick={() => handleQuickPayIncrement(emi.id)}
                            className="bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 font-bold text-[10px] text-indigo-600 px-2.5 py-1.5 rounded-lg transition-all transform active:scale-95 inline-flex items-center gap-1"
                            title="Register standard monthly paid installment payment now"
                          >
                            <CheckCircle className="w-3 h-3 text-indigo-500" />
                            +1 Paid
                          </button>
                        ) : (
                          <span className="text-emerald-600 font-bold text-[10px] bg-emerald-50 px-2.5 py-1 rounded inline-block">
                            Closed Schedule
                          </span>
                        )}
                      </td>

                      {/* EDIT AND DELETE OPS */}
                      <td className="py-3.5 text-right pr-1">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSelectToEdit(emi)}
                            className="p-1 px-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition-colors"
                            title="Edit installment particulars"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEmiToDelete({ id: emi.id, name: emi.name })}
                            className="p-1 px-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="Delete this EMI tracker"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {emiToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-100 transform scale-100 transition-transform">
            <h3 className="text-sm font-bold text-slate-800">Delete EMI Tracker?</h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to remove the track history for <strong className="text-slate-800">"{emiToDelete.name}"</strong>? This will clear all logged installment schedules. This operation is irreversible.
            </p>
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-150">
              <button
                onClick={() => setEmiToDelete(null)}
                className="text-xs text-slate-500 hover:text-slate-700.md px-3 py-1.5 font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
