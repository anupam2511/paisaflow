/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FinanceData, RecurringSpend, FinancialAccount } from '../types';
import { formatCurrency } from '../utils/formatters';
import { 
  Repeat, 
  Plus, 
  Trash2, 
  ShieldAlert, 
  CreditCard, 
  Play, 
  Pause, 
  Calendar, 
  CheckCircle,
  HelpCircle,
  Pencil,
  RefreshCw
} from 'lucide-react';

interface RecurringSpendsSectionProps {
  data: FinanceData;
  setFinanceData: React.Dispatch<React.SetStateAction<FinanceData>>;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

export default function RecurringSpendsSection({ data, setFinanceData }: RecurringSpendsSectionProps) {
  const { recurringSpends = [], accounts = [], budgets = [], preferences } = data;

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(budgets[0]?.category || 'Entertainment');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  
  // Billing Cycle Day/Month controls
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [billingDay, setBillingDay] = useState('15');
  const [billingMonth, setBillingMonth] = useState('6'); // Default June

  const [isVariableDate, setIsVariableDate] = useState(false);
  const [isAutoDebit, setIsAutoDebit] = useState(false);

  // States for manual payment logging modal
  const [paySub, setPaySub] = useState<RecurringSpend | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payAccountId, setPayAccountId] = useState('');
  const [payDate, setPayDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [subToDelete, setSubToDelete] = useState<{ id: string; name: string } | null>(null);

  // States for editing a subscription
  const [editingSub, setEditingSub] = useState<RecurringSpend | null>(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editAccountId, setEditAccountId] = useState('');
  const [editBillingCycle, setEditBillingCycle] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [editBillingDay, setEditBillingDay] = useState('15');
  const [editBillingMonth, setEditBillingMonth] = useState('6');
  const [editIsVariableDate, setEditIsVariableDate] = useState(false);
  const [editIsAutoDebit, setEditIsAutoDebit] = useState(false);

  // Helper function to auto calculate next billing date
  const calculateNextDate = (day: number, cycle: 'monthly' | 'quarterly' | 'yearly', startMonth: number): string => {
    const realNow = new Date();
    // Normalize now to midnight for stable comparison
    const now = new Date(realNow.getFullYear(), realNow.getMonth(), realNow.getDate());
    const currentYear = now.getFullYear();
    const currentMonthNum = now.getMonth() + 1; // 1-12

    let targetYear = currentYear;
    let targetMonth = currentMonthNum;

    if (cycle === 'yearly') {
      targetMonth = startMonth;
      const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
      const targetDay = Math.min(day, daysInMonth);
      const parsedDate = new Date(targetYear, targetMonth - 1, targetDay);
      if (parsedDate < now) {
        targetYear += 1;
      }
      const finalDaysInMonth = new Date(targetYear, targetMonth, 0).getDate();
      const finalTargetDay = Math.min(day, finalDaysInMonth);
      const pad = (num: number) => String(num).padStart(2, '0');
      return `${targetYear}-${pad(targetMonth)}-${pad(finalTargetDay)}`;
    } else if (cycle === 'quarterly') {
      // Occurs starting from startMonth and every 3 months (startMonth, startMonth+3, startMonth+6, startMonth+9)
      const baseMonth = startMonth; // 1-12
      const candidateMonths = [
        baseMonth,
        ((baseMonth + 2) % 12) + 1,
        ((baseMonth + 5) % 12) + 1,
        ((baseMonth + 8) % 12) + 1,
      ];
      
      const candidateDates: { date: Date; yr: number; m: number }[] = [];
      for (const yr of [currentYear, currentYear + 1]) {
        for (const m of candidateMonths) {
          const daysInM = new Date(yr, m, 0).getDate();
          const targetDay = Math.min(day, daysInM);
          candidateDates.push({
            date: new Date(yr, m - 1, targetDay),
            yr,
            m
          });
        }
      }
      
      // Filter candidates that are strictly in the future or equal to today
      const futures = candidateDates.filter(c => c.date >= now);
      futures.sort((a, b) => a.date.getTime() - b.date.getTime());
      
      const selected = futures[0] || candidateDates[candidateDates.length - 1];
      const finalDaysInM = new Date(selected.yr, selected.m, 0).getDate();
      const finalTargetDay = Math.min(day, finalDaysInM);
      const pad = (num: number) => String(num).padStart(2, '0');
      return `${selected.yr}-${pad(selected.m)}-${pad(finalTargetDay)}`;
    } else {
      // Monthly
      const daysInM = new Date(targetYear, targetMonth, 0).getDate();
      const targetDay = Math.min(day, daysInM);
      const parsedDate = new Date(targetYear, targetMonth - 1, targetDay);
      if (parsedDate < now) {
        targetMonth += 1;
        if (targetMonth > 12) {
          targetMonth = 1;
          targetYear += 1;
        }
      }
      const finalDaysInM = new Date(targetYear, targetMonth, 0).getDate();
      const finalTargetDay = Math.min(day, finalDaysInM);
      const pad = (num: number) => String(num).padStart(2, '0');
      return `${targetYear}-${pad(targetMonth)}-${pad(finalTargetDay)}`;
    }
  };

  const handleAddSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setOk('');

    if (!name.trim()) {
      setErr('Please state the subscription descriptor (e.g. Netflix, Wifi plan).');
      return;
    }

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setErr('Please state a valid positive subscription monthly equivalent fee.');
      return;
    }

    if (!accountId) {
      setErr('Please select a default payment instrument.');
      return;
    }

    let dayNum = parseInt(billingDay);
    let monthNum = parseInt(billingMonth);
    let computedNextBillDate = 'Variable Date';

    if (!isVariableDate) {
      if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
        setErr('Please select a valid billing day between 1 and 31.');
        return;
      }

      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        setErr('Please select a valid billing month.');
        return;
      }

      // Auto-compute chronological next billing date based on cycle
      computedNextBillDate = calculateNextDate(dayNum, billingCycle, monthNum);
    } else {
      dayNum = 0;
      monthNum = 1;
    }

    const newSub: RecurringSpend = {
      id: `rec-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      name: name.trim(),
      amount: amt,
      category,
      accountId,
      billingCycle,
      billingDay: dayNum,
      billingMonth: billingCycle !== 'monthly' && !isVariableDate ? monthNum : undefined,
      nextBillingDate: computedNextBillDate,
      isActive: true,
      isVariableDate,
      isAutoDebit: !isVariableDate && isAutoDebit,
    };

    setFinanceData(prev => ({
      ...prev,
      recurringSpends: [...prev.recurringSpends, newSub],
    }));

    setName('');
    setAmount('');
    setIsVariableDate(false);
    setIsAutoDebit(false);
    setOk(
      isVariableDate
        ? `Registered subscription: ${newSub.name} with variable billing dates!`
        : `Registered subscription: ${newSub.name}! Auto-calculated upcoming bill: ${computedNextBillDate}`
    );
    setTimeout(() => setOk(''), 4000);
  };

  const handleToggleState = (id: string, activeState: boolean) => {
    const updated = recurringSpends.map(r => {
      if (r.id === id) {
        return { ...r, isActive: !activeState };
      }
      return r;
    });

    setFinanceData(prev => ({
      ...prev,
      recurringSpends: updated,
    }));
  };

  const handleDeleteSubscription = (id: string, subName: string) => {
    setSubToDelete({ id, name: subName });
  };

  const confirmDeleteSubscription = () => {
    if (!subToDelete) return;
    setFinanceData(prev => ({
      ...prev,
      recurringSpends: prev.recurringSpends.filter(r => r.id !== subToDelete.id),
    }));
    setSubToDelete(null);
  };

  const handleEditSubscriptionSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub) return;

    if (!editName.trim()) {
      alert('Please state the subscription descriptor (e.g. Netflix, Wifi plan).');
      return;
    }

    const amt = parseFloat(editAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please state a valid positive subscription fee.');
      return;
    }

    if (!editAccountId) {
      alert('Please select a default payment instrument.');
      return;
    }

    let dayNum = parseInt(editBillingDay);
    let monthNum = parseInt(editBillingMonth);
    let computedNextBillDate = editingSub.nextBillingDate;

    if (!editIsVariableDate) {
      if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
        alert('Please select a valid billing day between 1 and 31.');
        return;
      }
      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        alert('Please select a valid billing month.');
        return;
      }

      // Recalculate if relevant parameters changed
      if (
        editingSub.isVariableDate ||
        editingSub.billingCycle !== editBillingCycle ||
        editingSub.billingDay !== dayNum ||
        editingSub.billingMonth !== monthNum
      ) {
        computedNextBillDate = calculateNextDate(dayNum, editBillingCycle, monthNum);
      }
    } else {
      dayNum = 0;
      monthNum = 1;
      computedNextBillDate = 'Variable Date';
    }

    const updated = recurringSpends.map(r => {
      if (r.id === editingSub.id) {
        return {
          ...r,
          name: editName.trim(),
          amount: amt,
          category: editCategory,
          accountId: editAccountId,
          billingCycle: editBillingCycle,
          billingDay: dayNum,
          billingMonth: editBillingCycle !== 'monthly' && !editIsVariableDate ? monthNum : undefined,
          nextBillingDate: computedNextBillDate,
          isVariableDate: editIsVariableDate,
          isAutoDebit: !editIsVariableDate && editIsAutoDebit,
        };
      }
      return r;
    });

    setFinanceData(prev => ({
      ...prev,
      recurringSpends: updated,
    }));

    setEditingSub(null);
    setOk(`Updated subscription commitment: ${editName.trim()}!`);
    setTimeout(() => setOk(''), 4000);
  };

  const handleRecordPaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paySub) return;

    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid subscription payment amount.');
      return;
    }

    if (!payAccountId) {
      alert('Please select the billing instrument used.');
      return;
    }

    const sourceAcc = accounts.find(a => a.id === payAccountId);
    if (!sourceAcc) {
      alert('Selected billing instrument not found.');
      return;
    }

    // Deduct from bank balance or add outstanding credit card debt
    const updatedAccounts = accounts.map(a => {
      if (a.id === payAccountId) {
        if (a.type === 'bank') {
          return { ...a, balance: a.balance - amt }; // Liquid bank gets reduced
        } else {
          return { ...a, balance: a.balance + amt }; // Credit card outstanding debt increases
        }
      }
      return a;
    });

    // Create corresponding analytical expense transaction
    const newExpense = {
      id: `exp-sub-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      description: `Subscription: ${paySub.name}`,
      amount: amt,
      category: paySub.category,
      date: payDate,
      accountId: payAccountId,
      isRecurring: true,
      recurringId: paySub.id,
    };

    // Calculate advanced billing date for fixed recurring spends if applicable
    const updatedRecurringSpends = recurringSpends.map(r => {
      if (r.id === paySub.id) {
        if (r.isVariableDate) {
          return r; // variable stays variable
        } else {
          // Increment the billing date forward accurately to keep budget projection calendars updated
          let nextDateStr = r.nextBillingDate;
          try {
            const currentDate = new Date(r.nextBillingDate);
            if (isNaN(currentDate.getTime())) {
              throw new Error('invalid date');
            }
            if (r.billingCycle === 'yearly') {
              currentDate.setFullYear(currentDate.getFullYear() + 1);
            } else if (r.billingCycle === 'quarterly') {
              currentDate.setMonth(currentDate.getMonth() + 3);
            } else {
              // Monthly
              currentDate.setMonth(currentDate.getMonth() + 1);
            }
            const year = currentDate.getFullYear();
            const monthIndex = currentDate.getMonth();
            const lastDay = new Date(year, monthIndex + 1, 0).getDate();
            const targetDay = Math.min(r.billingDay, lastDay);
            const pad = (num: number) => String(num).padStart(2, '0');
            nextDateStr = `${year}-${pad(monthIndex + 1)}-${pad(targetDay)}`;
          } catch (err) {
            // fallback computation
            nextDateStr = calculateNextDate(r.billingDay, r.billingCycle, r.billingMonth || 1);
          }
          return { ...r, nextBillingDate: nextDateStr };
        }
      }
      return r;
    });

    setFinanceData(prev => ({
      ...prev,
      expenses: [newExpense, ...prev.expenses],
      accounts: updatedAccounts,
      recurringSpends: updatedRecurringSpends,
    }));

    setPaySub(null);
    setOk(`Recorded payment of ${formatCurrency(amt, preferences)} for ${paySub.name}! Expense transaction logged.`);
    setTimeout(() => setOk(''), 5000);
  };

  const activeRecurringSpends = recurringSpends.filter(r => r.isActive);
  const totalSubCost = activeRecurringSpends.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div id="subscriptions-root" className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">

      {/* FORM: NEW SUBSCRIPTION */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm lg:col-span-4 h-fit">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-50 mb-4 font-sans">
          <Repeat className="w-5 h-5 text-indigo-600 animate-spin" style={{ animationDuration: '8s' }} />
          <h2 className="text-base font-bold text-slate-800">New Subscription Tracker</h2>
        </div>
        
        <p className="text-xs text-slate-400 mb-4">
          Automate expense bookkeeping for recurring bills. The calendar date is auto-calculated dynamically based on your cycle day.
        </p>

        <form onSubmit={handleAddSubscription} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Service name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Netflix, High-Speed Wifi, gym pass, AWS"
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Equivalent Outflow Cost</label>
            <div className="relative">
              <span className="absolute left-2.5 top-2.5 text-xs text-slate-400 font-bold">{preferences.currencySymbol}</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 599"
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 pl-7 bg-slate-50 focus:outline-none focus:border-indigo-500 font-bold text-slate-800"
              />
            </div>
          </div>

          {/* New Billing Cycle Toggles */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Billing Rhythm</label>
            <div className="grid grid-cols-3 gap-1">
              {(['monthly', 'quarterly', 'yearly'] as const).map(cycle => (
                <button
                  key={cycle}
                  type="button"
                  onClick={() => setBillingCycle(cycle)}
                  className={`text-[10px] capitalize font-bold py-2 px-1 rounded-md border transition cursor-pointer ${billingCycle === cycle ? 'bg-indigo-50 border-indigo-300 dark:bg-indigo-950/45 dark:border-indigo-900/80 text-indigo-700 dark:text-indigo-400' : 'bg-slate-50 dark:bg-slate-900/40 border-slate-150 dark:border-slate-805 text-slate-505 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200'}`}
                >
                  {cycle}
                </button>
              ))}
            </div>
          </div>

          {/* Variable Billing Date Checkbox Toggle */}
          <div className="flex items-start gap-2.5 bg-indigo-50 dark:bg-indigo-950/20 p-3.5 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 mb-1">
            <input
              type="checkbox"
              id="isVariableDate"
              checked={isVariableDate}
              onChange={(e) => setIsVariableDate(e.target.checked)}
              className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4"
            />
            <label htmlFor="isVariableDate" className="text-[11px] text-slate-600 font-medium select-none cursor-pointer leading-tight">
              <strong className="text-slate-900 block font-bold text-[11px] uppercase tracking-wide mb-0.5">Variable Date & Instrument</strong>
              Enable if billing dates or charge targets vary. Keep commitments visible and log with a single click.
            </label>
          </div>

          {/* Auto-Debit Checkbox Toggle */}
          {!isVariableDate && (
            <div className="flex items-start gap-2.5 bg-emerald-50 dark:bg-emerald-950/20 p-3.5 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 mb-1 animate-fade-in text-slate-800 dark:text-slate-100">
              <input
                type="checkbox"
                id="isAutoDebit"
                checked={isAutoDebit}
                onChange={(e) => setIsAutoDebit(e.target.checked)}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer h-4 w-4"
              />
              <label htmlFor="isAutoDebit" className="text-[11.5px] text-slate-650 dark:text-slate-350 font-medium select-none cursor-pointer leading-tight">
                <strong className="text-emerald-900 dark:text-emerald-400 block font-black text-[11px] uppercase tracking-wide mb-0.5">🔄 Enable Auto-Debit</strong>
                PaisaFlow automatically logs the transaction and updates balance figures of the charge target on the due date.
              </label>
            </div>
          )}

          {/* Billing Cycle parameters */}
          {!isVariableDate && (
            <div className="grid grid-cols-2 gap-2 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Billing Day</label>
                <select
                  value={billingDay}
                  onChange={(e) => setBillingDay(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 focus:outline-none focus:border-indigo-500 font-bold text-slate-800"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>On Day {d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  {billingCycle === 'monthly' ? 'Base Month' : 'Start Month'}
                </label>
                <select
                  value={billingMonth}
                  onChange={(e) => setBillingMonth(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
                >
                  {MONTH_NAMES.map((m, idx) => (
                    <option key={idx} value={idx + 1}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:outline-none focus:border-indigo-500 font-medium text-slate-800"
              >
                {budgets.map(b => (
                  <option key={b.category} value={b.category}>{b.category}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Charge target</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
            >
              <option value="">-- Choose Account or Card --</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.type === 'bank' ? 'Liquid' : 'Outstanding Code'})
                </option>
              ))}
            </select>
          </div>

          {err && (
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/25 border border-rose-100 dark:border-rose-900/40 rounded-xl text-[10px] text-rose-600 dark:text-rose-455 dark:text-rose-400 font-semibold flex items-center gap-1 transition-all">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" /> {err}
            </div>
          )}
          {ok && (
            <div className="p-2.5 bg-teal-50 dark:bg-emerald-950/25 border border-teal-100 dark:border-emerald-900/40 rounded-xl text-[10px] text-teal-700 dark:text-emerald-400 font-semibold flex items-center gap-1 transition-all">
              <CheckCircle className="w-3.5 h-3.5 text-teal-600 dark:text-emerald-400 shrink-0" /> {ok}
            </div>
          )}

          <button
            type="submit"
            className="w-full text-xs bg-indigo-600 hover:bg-indigo-700 transition text-white font-extrabold py-3 rounded-xl shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Schedule Outgoing
          </button>
        </form>
      </div>

      {/* SUBSCRIPTION LIST */}
      <div className="lg:col-span-8 space-y-4 font-sans">
        
        {/* Metric summary banner */}
        <div className="flex justify-between items-center bg-white p-6 md:p-7 rounded-3xl border border-slate-100 shadow-sm">
          <div>
            <h2 className="text-base font-bold text-slate-800">Operational Commitments</h2>
            <p className="text-xs text-slate-400 mt-0.5 font-sans">Recurring subscription fees calculated down dynamically.</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 leading-3 block">Total Commits Rate</span>
            <span id="total-subscriptions-rate" className="text-xl font-black text-rose-500">{formatCurrency(totalSubCost, preferences)} / mo</span>
          </div>
        </div>

        {/* List of elements */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {recurringSpends.map(sub => {
            const connectedAcc = accounts.find(a => a.id === sub.accountId);
            return (
              <div
                key={sub.id}
                className={`bg-white p-5 rounded-3xl border border-slate-100 shadow-xs hover:border-slate-200 transition flex flex-col justify-between min-h-[160px] relative ${!sub.isActive ? 'opacity-60 bg-slate-50' : ''}`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md truncate max-w-[120px]" title={sub.category}>
                      {sub.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {/* Active Toggle Button */}
                      <button
                        onClick={() => handleToggleState(sub.id, sub.isActive)}
                        className={`p-1 rounded-md transition cursor-pointer ${sub.isActive ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-slate-400 bg-slate-200 hover:bg-slate-300'}`}
                        title={sub.isActive ? 'Deactivate Subscription' : 'Activate Subscription'}
                      >
                        {sub.isActive ? <Play className="w-3 h-3 fill-emerald-600" /> : <Pause className="w-3 h-3" />}
                      </button>
                      {/* Edit Button */}
                      <button
                        onClick={() => {
                          setEditingSub(sub);
                          setEditName(sub.name);
                          setEditAmount(sub.amount.toString());
                          setEditCategory(sub.category);
                          setEditAccountId(sub.accountId || '');
                          setEditBillingCycle(sub.billingCycle);
                          setEditBillingDay(sub.billingDay.toString());
                          setEditBillingMonth(sub.billingMonth ? sub.billingMonth.toString() : '6');
                          setEditIsVariableDate(sub.isVariableDate || false);
                          setEditIsAutoDebit(sub.isAutoDebit || false);
                        }}
                        className="p-1 text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded cursor-pointer"
                        title="Edit subscription details"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSubscription(sub.id, sub.name)}
                        className="p-1 text-slate-300 hover:text-rose-500 transition hover:bg-rose-50 rounded cursor-pointer"
                        title="Remove subscription schedule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-2.5 flex items-center justify-between gap-2 overflow-hidden" title={sub.name}>
                    <span className="truncate">{sub.name}</span>
                  </h3>
                  
                  <div className="mt-2 text-[11px] flex items-center gap-1 text-slate-500 font-semibold">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" /> Paid via: <span className="font-bold text-slate-700 truncate max-w-[130px]" title={connectedAcc?.name}>{connectedAcc ? connectedAcc.name : 'Unassigned Instrument'}</span>
                  </div>

                  {sub.isActive && (
                    <div className="mt-3.5">
                      {!sub.isAutoDebit ? (
                        <button
                          onClick={() => {
                            setPaySub(sub);
                            setPayAmount(sub.amount.toString());
                            setPayAccountId(sub.accountId || (accounts[0]?.id || ''));
                          }}
                          className="w-full text-center py-2 px-3 bg-indigo-50 hover:bg-indigo-100/80 active:scale-[0.99] text-[10px] font-black tracking-wider text-indigo-700 uppercase rounded-xl transition duration-155 flex items-center justify-center gap-1 cursor-pointer shadow-xs select-none"
                          title="Record a payment event for this billing period"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> Record Month's Pay
                        </button>
                      ) : (
                        <div
                          className="w-full text-center py-2 px-3 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100/60 dark:border-emerald-900/30 text-[10px] font-black tracking-wider text-emerald-800 dark:text-emerald-400 uppercase rounded-xl flex items-center justify-center gap-1.5 select-none cursor-default"
                          title="Auto-debit active"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500 shrink-0" /> Active Auto-Debit
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-end border-t border-slate-50 dark:border-slate-800/40 pt-3 mt-3">
                  <div>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase block leading-3">Schedule Spec</span>
                    {sub.isVariableDate ? (
                      <span className="text-[10px] font-extrabold text-teal-600 dark:text-teal-400 block leading-relaxed">
                        Manual check-off
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 block leading-relaxed">
                        Next: {sub.nextBillingDate}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-slate-800">{formatCurrency(sub.amount, preferences)}</span>
                    <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest block leading-3">{sub.billingCycle}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {recurringSpends.length === 0 && (
            <div className="p-12 text-center bg-white dark:bg-slate-900/30 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl col-span-2 shadow-xs animate-fade-in">
              <Repeat className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" strokeWidth={1.5} />
              <p className="text-sm font-bold text-slate-750 dark:text-slate-300 mt-3">No active commitments</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 max-w-[280px] mx-auto leading-relaxed">Track direct recurring water, gas, OTT or gym subscription schedules cleanly using the left side form.</p>
            </div>
          )}
        </div>
      </div>

      {/* CUSTOM CONFIRMATION DELETION MODAL */}
      {subToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-xl border border-slate-100/80 animate-scale-up">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4 border border-rose-100">
              <Trash2 className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-sans tracking-tight">Delete Active Subscription?</h3>
            <p className="text-xs text-slate-500 mt-2.5 leading-relaxed font-medium">
              Are you sure you want to remove the recurring subscription commitment for <span className="font-bold text-slate-1000">"{subToDelete.name}"</span>? 
              This will unregister its auto-charges from your budget maps and billing calendars.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={confirmDeleteSubscription}
                className="flex-1 text-xs bg-rose-600 hover:bg-rose-700 transition duration-150 text-white font-extrabold py-3 px-4 rounded-xl cursor-pointer shadow-sm hover:shadow-rose-600/10 active:scale-[0.98]"
              >
                Yes, Delete Commitment
              </button>
              <button
                onClick={() => setSubToDelete(null)}
                className="flex-1 text-xs bg-slate-150 hover:bg-slate-200 text-slate-705 font-bold py-3 px-4 rounded-xl transition duration-150 cursor-pointer active:scale-[0.98]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MANUAL SUBSCRIPTION PAYMENT LOGGING MODAL */}
      {paySub && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-xl border border-slate-100/85 animate-scale-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100">
                <Repeat className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">Record Subscription Pay</h3>
                <p className="text-[10px] text-slate-400 font-bold">Instantly log analytical outflow & deduct account balances</p>
              </div>
            </div>

            <form onSubmit={handleRecordPaySubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Subscription Service</label>
                <input
                  type="text"
                  disabled
                  value={paySub.name}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-100 font-bold text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Amount Charged</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5 text-xs text-slate-400 font-bold">{preferences.currencySymbol}</span>
                    <input
                      type="number"
                      required
                      step="any"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 pl-7 bg-slate-50 focus:outline-none focus:border-indigo-500 font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Payment Date</label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 focus:outline-none focus:border-indigo-500 font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Billing Instrument Account</label>
                <select
                  required
                  value={payAccountId}
                  onChange={(e) => setPayAccountId(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:outline-none focus:border-indigo-500 font-bold text-slate-800"
                >
                  <option value="">-- Choose Account or Card --</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.type === 'bank' ? `Bal: ${formatCurrency(acc.balance, preferences)}` : `Debt: ${formatCurrency(acc.balance, preferences)}`})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 text-xs bg-indigo-600 hover:bg-indigo-700 transition text-white font-extrabold py-3 px-4 rounded-xl cursor-pointer shadow-sm hover:shadow-indigo-600/10 active:scale-[0.98]"
                >
                  Confirm & Log Expense
                </button>
                <button
                  type="button"
                  onClick={() => setPaySub(null)}
                  className="flex-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 px-4 rounded-xl transition cursor-pointer active:scale-[0.98]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SUBSCRIPTION MODAL */}
      {editingSub && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-[#0b1329] rounded-3xl max-w-md w-full p-6 md:p-8 shadow-xl border border-slate-100/85 dark:border-slate-805/80 animate-scale-up text-slate-800 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4 border-b border-slate-50 dark:border-slate-800/50 pb-3">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-100 dark:border-indigo-900/40">
                <Pencil className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Edit Subscription</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">Update service details, billing dates, or charge channels</p>
              </div>
            </div>

            <form onSubmit={handleEditSubscriptionSave} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase mb-1">Service name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Netflix, Wifi plan, AWS"
                  className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-900/60 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase mb-1">Equivalent Outflow Cost</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-xs text-slate-450 font-bold">{preferences.currencySymbol}</span>
                  <input
                    type="number"
                    required
                    step="any"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    placeholder="e.g. 599"
                    className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 pl-7 bg-slate-50 dark:bg-slate-900/60 focus:outline-none focus:border-indigo-500 font-bold text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Edit Billing Cycle Toggles */}
              <div>
                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase mb-1.5">Billing Rhythm</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['monthly', 'quarterly', 'yearly'] as const).map(cycle => (
                    <button
                      key={cycle}
                      type="button"
                      onClick={() => setEditBillingCycle(cycle)}
                      className={`text-[10px] capitalize font-bold py-2 px-1 rounded-md border transition cursor-pointer ${editBillingCycle === cycle ? 'bg-indigo-50 border-indigo-300 dark:bg-indigo-950/45 dark:border-indigo-900/80 text-indigo-700 dark:text-indigo-400' : 'bg-slate-50 dark:bg-slate-900/40 border-slate-150 dark:border-slate-805 text-slate-505 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200'}`}
                    >
                      {cycle}
                    </button>
                  ))}
                </div>
              </div>

              {/* Edit Variable Billing Date Checkbox Toggle */}
              <div className="flex items-start gap-2.5 bg-indigo-50 dark:bg-indigo-950/20 p-3.5 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 mb-1">
                <input
                  type="checkbox"
                  id="editIsVariableDate"
                  checked={editIsVariableDate}
                  onChange={(e) => setEditIsVariableDate(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4"
                />
                <label htmlFor="editIsVariableDate" className="text-[11px] text-slate-650 dark:text-slate-350 font-medium select-none cursor-pointer leading-tight">
                  <strong className="text-slate-900 dark:text-slate-200 block font-bold text-[11.5px] uppercase tracking-wide mb-0.5">Variable Date & Instrument</strong>
                  Enable if billing dates or charge targets vary. Keep commitments visible and log with a single click.
                </label>
              </div>

              {/* Edit Auto-Debit Checkbox Toggle */}
              {!editIsVariableDate && (
                <div className="flex items-start gap-2.5 bg-emerald-50 dark:bg-emerald-950/20 p-3.5 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 mb-1 animate-fade-in text-slate-800 dark:text-slate-100">
                  <input
                    type="checkbox"
                    id="editIsAutoDebit"
                    checked={editIsAutoDebit}
                    onChange={(e) => setEditIsAutoDebit(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer h-4 w-4"
                  />
                  <label htmlFor="editIsAutoDebit" className="text-[11.5px] text-slate-650 dark:text-slate-350 font-medium select-none cursor-pointer leading-tight">
                    <strong className="text-emerald-900 dark:text-emerald-400 block font-black text-[11px] uppercase tracking-wide mb-0.5">🔄 Enable Auto-Debit</strong>
                    PaisaFlow automatically logs the transaction and updates balance figures of the charge target on the due date.
                  </label>
                </div>
              )}

              {/* Edit Billing Cycle parameters */}
              {!editIsVariableDate && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase mb-1">Billing Day</label>
                    <select
                      value={editBillingDay}
                      onChange={(e) => setEditBillingDay(e.target.value)}
                      className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg p-2 bg-slate-50 dark:bg-slate-900/60 focus:outline-none focus:border-indigo-500 font-bold text-slate-800 dark:text-slate-250"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                        <option key={d} value={d} className="dark:bg-[#0b1329]">On Day {d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase mb-1">
                      {editBillingCycle === 'monthly' ? 'Base Month' : 'Start Month'}
                    </label>
                    <select
                      value={editBillingMonth}
                      onChange={(e) => setEditBillingMonth(e.target.value)}
                      className="w-full text-xs border border-slate-205 dark:border-slate-805 rounded-lg p-2 bg-slate-50 dark:bg-slate-900/60 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800 dark:text-slate-250"
                    >
                      {MONTH_NAMES.map((m, idx) => (
                        <option key={idx} value={idx + 1} className="dark:bg-[#0b1329]">{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-900/60 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 dark:text-slate-200"
                  >
                    {budgets.map(b => (
                      <option key={b.category} value={b.category} className="dark:bg-[#0b1329]">{b.category}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase mb-1">Charge target</label>
                <select
                  value={editAccountId}
                  onChange={(e) => setEditAccountId(e.target.value)}
                  className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-900/60 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800 dark:text-slate-200"
                >
                  <option value="" className="dark:bg-[#0b1329]">-- Choose Account or Card --</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id} className="dark:bg-[#0b1329]">
                      {acc.name} ({acc.type === 'bank' ? 'Liquid' : 'Outstanding Debt'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 text-xs bg-indigo-600 hover:bg-indigo-700 transition text-white font-extrabold py-3 px-4 rounded-xl cursor-pointer shadow-sm hover:shadow-indigo-600/10 active:scale-[0.98]"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingSub(null)}
                  className="flex-1 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold py-3 px-4 rounded-xl transition cursor-pointer active:scale-[0.98]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
