import React, { useState } from 'react';
import { FinanceData, Investment, FinancialAccount } from '../types';
import { formatCurrency } from '../utils/formatters';
import { advanceBillingDate } from '../utils/billing';
import {
  Coins,
  TrendingUp,
  Plus,
  Trash2,
  Edit,
  X,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRightLeft,
  Search,
  Layers,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';

interface InvestmentsSectionProps {
  data: FinanceData;
  setFinanceData: React.Dispatch<React.SetStateAction<FinanceData>>;
}

export default function InvestmentsSection({ data, setFinanceData }: InvestmentsSectionProps) {
  const { accounts, investments = [], preferences } = data;

  // Dynamic customization categories retrieved from preferences
  const standardCategories = preferences.investmentCategories || [
    'Mutual Funds',
    'Government Schemes',
    'Gold Investment',
    'Fixed Deposits',
    'Stocks & Equities',
    'Alternative Assets'
  ];

  // Form State for Create/Edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<string>(standardCategories[0] || 'Mutual Funds');
  const [investmentType, setInvestmentType] = useState<Investment['investmentType']>('recurring');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<Investment['frequency']>('monthly');
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [totalInvested, setTotalInvested] = useState('');
  const [accountId, setAccountId] = useState('');
  const [notes, setNotes] = useState('');
  const [isAutoDebit, setIsAutoDebit] = useState(false);
  const [billingDay, setBillingDay] = useState('15');

  // Helper function to auto calculate next billing date for investments
  const calculateNextInvestmentDate = (day: number, cycle: 'monthly' | 'quarterly' | 'yearly', startD: string): string => {
    const d = new Date(startD);
    if (isNaN(d.getTime())) {
      const now = new Date();
      d.setTime(now.getTime());
    }
    const year = d.getFullYear();
    const month = d.getMonth() + 1; // 1-12
    const pad = (num: number) => String(num).padStart(2, '0');
    
    // Dynamic days-in-month check instead of solid clamping to 28
    const lastDay = new Date(year, month, 0).getDate();
    const targetDay = Math.min(day, lastDay);
    
    // Target date string with the specified/selected billing day
    const targetDateStr = `${year}-${pad(month)}-${pad(targetDay)}`;
    
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    
    if (targetDateStr >= todayStr) {
      return targetDateStr;
    } else {
      // It lies in the past, advance it once or more correctly
      let computed = targetDateStr;
      while (computed < todayStr) {
        computed = advanceBillingDate(computed, cycle, day);
      }
      return computed;
    }
  };

  // Top-Up states
  const [topUpInvestment, setTopUpInvestment] = useState<Investment | null>(null);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpAccountId, setTopUpAccountId] = useState('');
  const [recordExpense, setRecordExpense] = useState(true);
  const [topUpErr, setTopUpErr] = useState('');
  const [topUpOk, setTopUpOk] = useState('');

  // States for manual SIP payment logging modal
  const [payInvestment, setPayInvestment] = useState<Investment | null>(null);
  const [paySIPAmount, setPaySIPAmount] = useState('');
  const [paySIPAccountId, setPaySIPAccountId] = useState('');
  const [paySIPDate, setPaySIPDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [paySIPErr, setPaySIPErr] = useState('');
  const [paySIPOk, setPaySIPOk] = useState('');

  // Notifications and messages
  const [formErr, setFormErr] = useState('');
  const [formOk, setFormOk] = useState('');
  const [investmentToDelete, setInvestmentToDelete] = useState<Investment | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterMode, setFilterMode] = useState<string>('all');

  // Load defaults for add state
  const resetForm = () => {
    setEditingId(null);
    setName('');
    setType(standardCategories[0] || 'Mutual Funds');
    setInvestmentType('recurring');
    setAmount('');
    setFrequency('monthly');
    setHasEndDate(false);
    setEndDate('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setTotalInvested('');
    setAccountId(accounts.filter(a => a.type === 'bank')[0]?.id || '');
    setNotes('');
    setFormErr('');
    setIsAutoDebit(false);
    setBillingDay('15');
  };

  const handleStartEdit = (inv: Investment) => {
    setEditingId(inv.id);
    setName(inv.name);
    setType(inv.type);
    setInvestmentType(inv.investmentType);
    setAmount(inv.amount.toString());
    setFrequency(inv.frequency || 'monthly');
    setHasEndDate(inv.hasEndDate);
    setEndDate(inv.endDate || '');
    setStartDate(inv.startDate);
    setTotalInvested(inv.totalInvested.toString());
    setAccountId(inv.accountId || '');
    setNotes(inv.notes || '');
    setFormErr('');
    setFormOk('');
    setIsAutoDebit(inv.isAutoDebit || false);
    setBillingDay((inv.billingDay || 15).toString());
  };

  const handleCreateOrUpdateInvestment = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr('');
    setFormOk('');

    if (!name.trim()) {
      setFormErr('Please provide a descriptive name for this investment.');
      return;
    }

    const amtVal = parseFloat(amount);
    if (isNaN(amtVal) || amtVal <= 0) {
      setFormErr('Please enter a valid amount greater than zero.');
      return;
    }

    const totVal = parseFloat(totalInvested);
    if (isNaN(totVal) || totVal < 0) {
      setFormErr('Please specify the actual total invested value (can be 0 if initiating).');
      return;
    }

    if (!startDate) {
      setFormErr('Please pick a start or purchase date.');
      return;
    }

    if (hasEndDate && !endDate) {
      setFormErr('Please select when the investment matures, or disable the end date toggle.');
      return;
    }

    if (!accountId) {
      setFormErr('Please select a bank account linked to power this investment action.');
      return;
    }

    const computedNextBillDate = (investmentType === 'recurring' && isAutoDebit)
      ? calculateNextInvestmentDate(parseInt(billingDay), frequency || 'monthly', startDate)
      : undefined;

    if (editingId) {
      // Modify Existing
      setFinanceData(prev => {
        const list = prev.investments || [];
        const updated = list.map(item => {
          if (item.id === editingId) {
            return {
              ...item,
              name: name.trim(),
              type,
              investmentType,
              amount: amtVal,
              frequency: investmentType === 'recurring' ? frequency : undefined,
              hasEndDate,
              endDate: hasEndDate ? endDate : undefined,
              startDate,
              totalInvested: totVal,
              accountId,
              notes: notes.trim(),
              isAutoDebit: investmentType === 'recurring' && isAutoDebit,
              billingDay: investmentType === 'recurring' && isAutoDebit ? parseInt(billingDay) : undefined,
              nextBillingDate: computedNextBillDate
            };
          }
          return item;
        });

        return {
          ...prev,
          investments: updated
        };
      });

      setFormOk('Investment profile successfully refreshed.');
      setEditingId(null);
    } else {
      // Add New Investment
      const newItem: Investment = {
        id: `inv-${Date.now()}`,
        name: name.trim(),
        type,
        investmentType,
        amount: amtVal,
        frequency: investmentType === 'recurring' ? frequency : undefined,
        hasEndDate,
        endDate: hasEndDate ? endDate : undefined,
        startDate,
        totalInvested: totVal,
        accountId,
        notes: notes.trim(),
        isAutoDebit: investmentType === 'recurring' && isAutoDebit,
        billingDay: investmentType === 'recurring' && isAutoDebit ? parseInt(billingDay) : undefined,
        nextBillingDate: computedNextBillDate
      };

      setFinanceData(prev => ({
        ...prev,
        investments: [...(prev.investments || []), newItem]
      }));

      setFormOk('Investment target successfully integrated into your profile.');
    }

    // Reset fields
    setName('');
    setAmount('');
    setTotalInvested('');
    setNotes('');
    setHasEndDate(false);
    setEndDate('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setIsAutoDebit(false);
    setBillingDay('15');
    setTimeout(() => setFormOk(''), 4000);
  };

  const handleDeleteConfirm = () => {
    if (!investmentToDelete) return;
    setFinanceData(prev => ({
      ...prev,
      investments: (prev.investments || []).filter(inv => inv.id !== investmentToDelete.id)
    }));
    setInvestmentToDelete(null);
  };

  const handleTopUpConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setTopUpErr('');
    setTopUpOk('');

    if (!topUpInvestment) return;

    const topUpAmt = parseFloat(topUpAmount);
    if (isNaN(topUpAmt) || topUpAmt <= 0) {
      setTopUpErr('Please enter a positive numeric funding amount.');
      return;
    }

    if (!topUpAccountId) {
      setTopUpErr('Please choose a bank account to withdraw funds.');
      return;
    }

    const fundingAccount = accounts.find(a => a.id === topUpAccountId);
    if (!fundingAccount) {
      setTopUpErr('Source checking account not located.');
      return;
    }

    if (fundingAccount.balance < topUpAmt) {
      setTopUpErr(`Bank balance is insufficient! ${fundingAccount.institution} has only ${formatCurrency(fundingAccount.balance, preferences)} available.`);
      return;
    }

    // Update balances, investments, and append optional transactions expense
    setFinanceData(prev => {
      const updatedAccounts = prev.accounts.map(acc => {
        if (acc.id === topUpAccountId) {
          return { ...acc, balance: acc.balance - topUpAmt };
        }
        return acc;
      });

      const updatedInvestments = (prev.investments || []).map(inv => {
        if (inv.id === topUpInvestment.id) {
          return { ...inv, totalInvested: inv.totalInvested + topUpAmt };
        }
        return inv;
      });

      let updatedExpenses = prev.expenses || [];
      if (recordExpense) {
        const topUpExpense = {
          id: `exp-topup-${Date.now()}`,
          description: `SIP Top-up: ${topUpInvestment.name}`,
          amount: topUpAmt,
          category: 'Investment',
          date: new Date().toISOString().split('T')[0],
          accountId: topUpAccountId,
          isRecurring: false
        };
        updatedExpenses = [topUpExpense, ...updatedExpenses];
      }

      return {
        ...prev,
        accounts: updatedAccounts,
        investments: updatedInvestments,
        expenses: updatedExpenses
      };
    });

    setTopUpOk(`Successfully loaded ${formatCurrency(topUpAmt, preferences)} into portfolio!`);
    setTopUpAmount('');
    setTimeout(() => {
      setTopUpInvestment(null);
      setTopUpOk('');
    }, 2000);
  };

  const handleRecordSIPPaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPaySIPErr('');
    setPaySIPOk('');

    if (!payInvestment) return;

    const amt = parseFloat(paySIPAmount);
    if (isNaN(amt) || amt <= 0) {
      setPaySIPErr('Please enter a valid investment payment amount.');
      return;
    }

    if (!paySIPAccountId) {
      setPaySIPErr('Please select the funding/source bank account.');
      return;
    }

    const sourceAcc = accounts.find(a => a.id === paySIPAccountId);
    if (!sourceAcc) {
      setPaySIPErr('Selected funding bank account not found.');
      return;
    }

    // Deduct from bank balance or increase credit card debt
    const updatedAccounts = accounts.map(a => {
      if (a.id === paySIPAccountId) {
        if (a.type === 'bank') {
          return { ...a, balance: a.balance - amt };
        } else {
          return { ...a, balance: a.balance + amt };
        }
      }
      return a;
    });

    // Create corresponding analytical expense transaction in ledger
    const newExpense = {
      id: `exp-inv-manual-${Date.now()}`,
      description: `SIP Investment: ${payInvestment.name}`,
      amount: amt,
      category: 'Investment',
      date: paySIPDate,
      accountId: paySIPAccountId,
      isRecurring: true,
      recurringId: payInvestment.id,
    };

    // Update investment's next billing date & accumulated total value
    const updatedInvestments = investments.map(inv => {
      if (inv.id === payInvestment.id) {
        let nextDateStr = inv.nextBillingDate;
        if (nextDateStr) {
          try {
            nextDateStr = advanceBillingDate(
              nextDateStr,
              inv.frequency || 'monthly',
              inv.billingDay || 15
            );
          } catch (err) {
            if (inv.billingDay) {
              nextDateStr = calculateNextInvestmentDate(inv.billingDay, inv.frequency || 'monthly', nextDateStr);
            }
          }
        }
        return {
          ...inv,
          nextBillingDate: nextDateStr,
          totalInvested: (inv.totalInvested || 0) + amt,
        };
      }
      return inv;
    });

    setFinanceData(prev => ({
      ...prev,
      expenses: [newExpense, ...(prev.expenses || [])],
      accounts: updatedAccounts,
      investments: updatedInvestments,
    }));

    setPaySIPOk(`Recorded SIP payment of ${formatCurrency(amt, preferences)} for ${payInvestment.name}! Account updated and expense entry added to transaction history.`);
    setPaySIPAmount('');
    setTimeout(() => {
      setPayInvestment(null);
      setPaySIPOk('');
    }, 2000);
  };

  // Human Friendly Category Label
  const assetClassificationLabel = (val: string) => {
    switch (val) {
      case 'mutual_fund': return 'Mutual Funds';
      case 'govt_scheme': return 'Government Schemes';
      case 'gold': return 'Gold Investment';
      case 'fixed_deposit': return 'Fixed Deposits';
      case 'stocks': return 'Stocks & Equities';
      case 'other': return 'Alternative Assets';
      default: return val;
    }
  };

  const getBadgeColors = (t: string) => {
    const normalized = t.toLowerCase();
    if (normalized.includes('fund') || normalized.includes('mutual')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (normalized.includes('scheme') || normalized.includes('govt')) {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    } else if (normalized.includes('gold')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    } else if (normalized.includes('deposit') || normalized.includes('fixed')) {
      return 'bg-sky-50 text-sky-700 border-sky-200';
    } else if (normalized.includes('stock') || normalized.includes('equity') || normalized.includes('crypt') || normalized.includes('share')) {
      return 'bg-teal-50 text-teal-700 border-teal-200';
    } else {
      return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const monthlyScaledInvestment = (inv: Investment) => {
    if (inv.investmentType === 'spot') return 0;
    const freq = inv.frequency || 'monthly';
    if (freq === 'monthly') return inv.amount;
    if (freq === 'quarterly') return inv.amount / 3;
    if (freq === 'yearly') return inv.amount / 12;
    return 0;
  };

  // Summaries
  const totalValuation = investments.reduce((sum, inv) => sum + inv.totalInvested, 0);
  const totalMonthlyCommitment = investments.reduce((sum, inv) => sum + monthlyScaledInvestment(inv), 0);
  const spotCount = investments.filter(i => i.investmentType === 'spot').length;
  const recurringCount = investments.filter(i => i.investmentType === 'recurring').length;

  // Filter
  const filteredInvestments = investments.filter(inv => {
    const matchesSearch = inv.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (inv.notes && inv.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          assetClassificationLabel(inv.type).toLowerCase().includes(searchQuery.toLowerCase());
    
    const friendlyType = assetClassificationLabel(inv.type);
    const friendlyFilter = assetClassificationLabel(filterType);

    const matchesType = filterType === 'all' || 
                        inv.type === filterType || 
                        friendlyType === filterType ||
                        friendlyType.toLowerCase() === friendlyFilter.toLowerCase();
                        
    const matchesMode = filterMode === 'all' || inv.investmentType === filterMode;

    return matchesSearch && matchesType && matchesMode;
  });

  return (
    <div id="investments-root" className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
      
      {/* LEFT COLUMN: STATISTICS & MANAGE FORM */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* INVESTMENT PORTFOLIO SUMMARY CARD */}
        <div className="bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 text-slate-800 dark:text-white rounded-3xl p-6 border border-slate-200/60 dark:border-slate-800 shadow-xs dark:shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-600/5 dark:bg-white/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
          <div className="absolute left-10 bottom-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl -ml-6 -mb-6"></div>
          
          <div className="flex justify-between items-center mb-5 z-10 relative">
            <span className="text-[10px] font-extrabold uppercase tracking-widest bg-indigo-50 dark:bg-white/10 px-2.5 py-1 rounded-full text-indigo-700 dark:text-indigo-200">
              Wealth Portfolio Investment
            </span>
            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>

          <h3 className="text-sm font-semibold text-slate-550 dark:text-slate-300">Total Invested Holdings</h3>
          <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1.5 font-mono">
            {formatCurrency(totalValuation, preferences)}
          </p>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-slate-200/60 dark:border-white/10 text-slate-500 dark:text-slate-300">
            <div>
              <span className="text-[10px] text-slate-400 dark:text-slate-400 block uppercase font-bold">Monthly SIP Commitment</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white block mt-0.5 font-mono">
                {formatCurrency(totalMonthlyCommitment, preferences)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 dark:text-slate-400 block uppercase font-bold">Invested Assets Count</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white block mt-0.5">
                {spotCount} Spot / {recurringCount} Recurring
              </span>
            </div>
          </div>
        </div>

        {/* INPUT FORM */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-50 mb-4">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-800">
                {editingId ? 'Modify Asset Profile' : 'Integrate New Asset'}
              </h2>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-[10px] text-slate-400 hover:text-slate-600 font-bold bg-slate-50 hover:bg-slate-100 p-1 px-2 rounded-lg flex items-center gap-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" /> Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleCreateOrUpdateInvestment} className="space-y-4">
            
            {/* Asset Name */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Asset Description/Name</label>
              <input
                type="text"
                placeholder="e.g. Nippon India Small Cap, Sovereign Gold Bond"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-600 focus:bg-white rounded-xl py-3 px-3.5 outline-none transition"
              />
            </div>

            {/* Asset Category */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Holdings Asset Category</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 outline-none transition cursor-pointer font-semibold text-slate-700"
              >
                {standardCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Investment Type (Recurring vs Spot) */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Investment Frequency Stream</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setInvestmentType('recurring');
                    if (!amount) setAmount('5000');
                  }}
                  className={`text-xs py-2.5 px-3 rounded-xl border font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    investmentType === 'recurring'
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  Recurring (SIP)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInvestmentType('spot');
                    if (amount) setAmount('0');
                  }}
                  className={`text-xs py-2.5 px-3 rounded-xl border font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    investmentType === 'spot'
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Spot (Lump-sum)
                </button>
              </div>
            </div>

            {/* If Recurring, Frequency Select */}
            {investmentType === 'recurring' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contribution Billing Cycle</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as Investment['frequency'])}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 outline-none transition cursor-pointer"
                  >
                    <option value="monthly">Monthly Recurring (SIP)</option>
                    <option value="quarterly">Quarterly Recurring</option>
                    <option value="yearly">Yearly Recurring</option>
                  </select>
                </div>

                {/* Auto-Debit Checkbox Toggle for SIPs */}
                <div className="flex flex-col gap-2.5 bg-emerald-50 dark:bg-emerald-950/20 p-3.5 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 text-slate-800 dark:text-slate-100">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="isAutoDebit-chk"
                      checked={isAutoDebit}
                      onChange={(e) => {
                        setIsAutoDebit(e.target.checked);
                        if (e.target.checked && startDate) {
                          const d = new Date(startDate);
                          if (!isNaN(d.getTime())) {
                            setBillingDay(d.getDate().toString());
                          }
                        }
                      }}
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer h-4 w-4"
                    />
                    <label htmlFor="isAutoDebit-chk" className="text-[11.5px] text-slate-650 dark:text-slate-350 font-medium select-none cursor-pointer leading-tight">
                      <strong className="text-emerald-900 dark:text-emerald-400 block font-black text-[11px] uppercase tracking-wide mb-0.5">🔄 Enable SIP Auto-Debit</strong>
                      PaisaFlow automatically transfers periodic installments from the linked bank account to this investment and logs an expense transaction on the due date.
                    </label>
                  </div>

                  {isAutoDebit && (
                    <div className="pt-2.5 border-t border-emerald-100/50 dark:border-emerald-900/30 grid grid-cols-2 gap-2 animate-fade-in">
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase text-emerald-800 dark:text-emerald-400 mb-1">Due Day of Month</label>
                        <select
                          value={billingDay}
                          onChange={(e) => setBillingDay(e.target.value)}
                          className="w-full text-xs bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-xl py-1.5 px-2 outline-none font-semibold text-slate-750 dark:text-slate-250 cursor-pointer"
                        >
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(dayNum => (
                            <option key={dayNum} value={dayNum}>{dayNum}th of month</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col justify-end">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase mb-1">Target cycle</span>
                        <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 capitalize">{frequency} SIP</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Investment Amount Input */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                {investmentType === 'recurring' ? 'Periodic Contribution Installment' : 'One-time Lump-sum Cost'}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-400 text-xs font-bold">{preferences.currencySymbol}</span>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-600 focus:bg-white rounded-xl py-3 pl-8 pr-3.5 outline-none transition font-semibold"
                />
              </div>
            </div>

            {/* Cumulative Holdings/Total Valuation */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Total Capital Invested
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-400 text-xs font-bold">{preferences.currencySymbol}</span>
                <input
                  type="number"
                  placeholder="e.g. 45000"
                  value={totalInvested}
                  onChange={(e) => setTotalInvested(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-600 focus:bg-white rounded-xl py-3 pl-8 pr-3.5 outline-none transition font-semibold"
                />
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Purchase / SIP Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 outline-none transition cursor-pointer"
              />
            </div>

            {/* End Date Feature */}
            <div className="bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-extrabold text-slate-700 dark:text-slate-100 block">Predetermined End / Maturity Date</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-400">Specify if this scheme or fixed asset matures on a target month.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setHasEndDate(!hasEndDate)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${
                    hasEndDate ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition duration-200 ease-in-out ${
                      hasEndDate ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {hasEndDate && (
                <div className="mt-1 pt-2.5 border-t border-slate-200/50">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target End Year & Month</label>
                  <input
                    type="month"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl py-2.5 px-3 outline-none transition cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Linked Bank Account */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Linked Funding Account</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 outline-none transition cursor-pointer text-slate-700 font-semibold"
              >
                <option value="" disabled>-- Select Linked Bank Account --</option>
                {accounts.filter(a => a.type === 'bank').map(a => (
                  <option key={a.id} value={a.id}>{a.institution} - {a.name}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Administrative Notes (Optional)</label>
              <textarea
                placeholder="e.g. Account number, lock-in period constraints, tax exempt boundaries"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-600 focus:bg-white rounded-xl py-2 px-3 outline-none transition resize-none text-slate-700"
              />
            </div>

            {/* Feedback Lines */}
            {formErr && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-1.5 font-bold border border-red-100">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formErr}</span>
              </div>
            )}

            {formOk && (
              <div className="p-3 bg-green-50 text-green-700 rounded-xl text-xs flex items-center gap-1.5 font-bold border border-green-100">
                <CheckCircle className="w-4 h-4 shrink-0 animate-pulse" />
                <span>{formOk}</span>
              </div>
            )}

            {/* Submit buttons */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="submit"
                className="w-full text-xs bg-indigo-600 hover:bg-indigo-700 transition text-white font-extrabold py-3.5 rounded-xl shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {editingId ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {editingId ? 'Save Adjusted Asset Boundary' : 'Establish Asset Record'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full text-xs bg-slate-100 hover:bg-slate-200 transition text-slate-600 font-semibold py-2.5 rounded-xl cursor-pointer"
                >
                  Discard Edits
                </button>
              )}
            </div>

          </form>
        </div>

      </div>

      {/* RIGHT COLUMN: SEARCH, FILTERS & THE ASSETS REGISTER */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* ACTION HEADER & FILTERS BAR */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-800 font-sans">Your Investment Holdings</h2>
            <p className="text-slate-500 text-xs mt-0.5">Track, audit, or restructure physical and paper portfolio channels.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto shrink-0">
            {/* Search Input */}
            <div className="relative w-full sm:w-48">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search holdings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 text-xs border border-slate-200 focus:border-indigo-600 rounded-xl py-2.5 pl-9 pr-3 outline-none"
              />
            </div>

            {/* Filter by Asset Type */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-50 text-xs text-slate-600 border border-slate-200 rounded-xl py-2.5 px-3 outline-none cursor-pointer font-semibold"
            >
              <option value="all">All Asset Categories</option>
              {standardCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Filter by stream mode */}
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              className="bg-slate-50 text-xs text-slate-600 border border-slate-200 rounded-xl py-2.5 px-3 outline-none cursor-pointer font-semibold"
            >
              <option value="all">All Streams</option>
              <option value="recurring">Recurring (SIP)</option>
              <option value="spot">Spot (Lump)</option>
            </select>
          </div>
        </div>

        {/* DETAILED LISTING FOR ASSETS */}
        <div className="space-y-4">
          {filteredInvestments.map(inv => {
            const linkedAcc = accounts.find(a => a.id === inv.accountId);
            
            // Format end date/month prettily
            let beautifulEndLabel = '';
            if (inv.hasEndDate && inv.endDate) {
              const [year, month] = inv.endDate.split('-');
              const dateObj = new Date(parseInt(year), parseInt(month) - 1);
              const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
              
              const currentYearMonth = new Date();
              const diffMonths = (parseInt(year) - currentYearMonth.getFullYear()) * 12 + (parseInt(month) - (currentYearMonth.getMonth() + 1));
              
              if (diffMonths <= 0) {
                beautifulEndLabel = `Matured (${formattedDate})`;
              } else if (diffMonths < 12) {
                beautifulEndLabel = `Matures ${formattedDate} (${diffMonths} mths rem.)`;
              } else {
                const yrs = Math.floor(diffMonths / 12);
                const rm = diffMonths % 12;
                beautifulEndLabel = `Matures ${formattedDate} (${yrs}y ${rm}m rem.)`;
              }
            }

            return (
              <motion.div
                key={inv.id}
                layoutId={`inv-card-${inv.id}`}
                className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden ${
                  editingId === inv.id ? 'border-indigo-400 bg-indigo-50/10' : 'border-slate-100'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 relative">
                  
                  {/* Left segment info title / badge */}
                  <div className="space-y-1 w-full md:max-w-[48%]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 border rounded-lg uppercase ${getBadgeColors(inv.type)}`}>
                        {assetClassificationLabel(inv.type)}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg ${
                        inv.investmentType === 'recurring' 
                        ? 'bg-slate-100 text-slate-700' 
                        : 'bg-indigo-50 text-indigo-700'
                      }`}>
                        {inv.investmentType === 'recurring' ? 'Recurring (SIP)' : 'Spot/On-Demand'}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-800 tracking-tight transition hover:text-indigo-600 pt-0.5">
                      {inv.name}
                    </h3>

                    {inv.notes && (
                      <p className="text-xs text-slate-500 italic max-w-full truncate">{inv.notes}</p>
                    )}

                    {/* SIP Top-Up or Record Month's Pay Actions inside card */}
                    {inv.investmentType === 'recurring' && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <button
                          onClick={() => {
                            setTopUpInvestment(inv);
                            setTopUpAccountId(inv.accountId || accounts.filter(a => a.type === 'bank')[0]?.id || '');
                            setTopUpAmount('');
                            setTopUpErr('');
                            setTopUpOk('');
                          }}
                          className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 active:scale-[0.99] transition duration-155 py-2 px-3 rounded-xl flex items-center gap-1 cursor-pointer w-fit select-none shrink-0 shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> One-time Top-up
                        </button>
                        {!inv.isAutoDebit ? (
                          <button
                            onClick={() => {
                              setPayInvestment(inv);
                              setPaySIPAmount(inv.amount.toString());
                              setPaySIPAccountId(inv.accountId || (accounts.filter(a => a.type === 'bank')[0]?.id || ''));
                              setPaySIPDate(() => {
                                const today = new Date();
                                const yyyy = today.getFullYear();
                                const mm = String(today.getMonth() + 1).padStart(2, '0');
                                const dd = String(today.getDate()).padStart(2, '0');
                                return `${yyyy}-${mm}-${dd}`;
                              });
                            }}
                            className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 active:scale-[0.99] transition duration-155 py-2 px-3 rounded-xl flex items-center gap-1 cursor-pointer w-fit select-none shrink-0 shadow-xs"
                            title="Record a recurring SIP payment event manually"
                          >
                            <CheckCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> Record Month's Pay
                          </button>
                        ) : (
                          <div
                            className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100/60 dark:border-emerald-900/30 py-2 px-3 rounded-xl flex items-center gap-1.5 cursor-default w-fit select-none shrink-0"
                            title="SIP is set to automatically debit from linked account"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500 shrink-0" /> Active Auto-Debit
                          </div>
                        )}
                      </div>
                    )}

                    {/* Funding stream source */}
                    {linkedAcc && (
                      <div className="flex items-center gap-1.5 pt-1.5 text-slate-400 text-[11px] font-medium">
                        <ArrowRightLeft className="w-3 h-3 shrink-0" />
                        <span>Source account: <strong className="text-slate-600">{linkedAcc.institution}</strong> ({linkedAcc.name})</span>
                      </div>
                    )}
                  </div>

                  {/* Pricing segment values */}
                  <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto select-none">
                    <div className="text-left md:text-right space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Total Invested</span>
                      <span className="text-base font-black text-indigo-700 font-mono">
                        {formatCurrency(inv.totalInvested, preferences)}
                      </span>
                    </div>

                    <div className="text-left md:text-right space-y-0.5 animate-fade-in">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                        {inv.investmentType === 'recurring' ? 'Sustaining Cost' : 'Acquisition Cost'}
                      </span>
                      <span className="text-sm font-extrabold text-slate-700 font-mono">
                        {formatCurrency(inv.amount, preferences)}
                        {inv.investmentType === 'recurring' && (
                          <span className="text-[10px] font-medium text-slate-400 block -mt-0.5">
                            per {inv.frequency || 'month'}
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Timeline segment */}
                    <div className="text-left md:text-right space-y-0.5 hidden sm:block">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Timeline</span>
                      <div className="text-slate-600 text-[11px] font-semibold flex items-center gap-1 md:justify-end">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>Started {new Date(inv.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                      </div>
                      {inv.hasEndDate && (
                        <span className="text-[10px] text-indigo-600 font-bold block">
                          {beautifulEndLabel}
                        </span>
                      )}
                      {inv.investmentType === 'recurring' && inv.isAutoDebit && inv.nextBillingDate && (
                        <div className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1 md:justify-end mt-1 font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                          <span>Next SIP: {new Date(inv.nextBillingDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
                        </div>
                      )}
                    </div>

                    {/* Interactive controls */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleStartEdit(inv)}
                        className={`p-2 rounded-xl transition cursor-pointer ${
                          editingId === inv.id 
                            ? 'text-indigo-600 bg-indigo-50 border border-indigo-200' 
                            : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-50'
                        }`}
                        title="Edit holding boundaries"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setInvestmentToDelete(inv)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                        title="Delete this holding history"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>

                </div>

                {/* Inline mobile representation of Timeline details */}
                {(inv.hasEndDate || inv.startDate) && (
                  <div className="mt-3 pt-3 border-t border-slate-50 flex flex-wrap gap-4 text-[10px] text-slate-500 sm:hidden">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Started: <strong>{inv.startDate}</strong></span>
                    </div>
                    {inv.hasEndDate && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Maturity: <strong className="text-indigo-600">{beautifulEndLabel}</strong></span>
                      </div>
                    )}
                  </div>
                )}

              </motion.div>
            );
          })}

          {filteredInvestments.length === 0 && (
            <div className="text-center py-16 bg-white dark:bg-slate-900/30 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs animate-fade-in">
              <Coins className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto stroke-1" />
              <h3 className="text-slate-700 dark:text-slate-300 font-extrabold text-sm mt-3">No matching investments found</h3>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1.5 md:max-w-md mx-auto leading-relaxed">
                No active records match the selected categorization queries. Use the left configuration drawer to inject asset data.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* SIP ONE-TIME TOP UP MODAL */}
      {topUpInvestment && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-50 mb-4">
              <div className="flex items-center gap-2 text-indigo-600">
                <Coins className="w-5 h-5 shrink-0" />
                <h4 className="text-sm font-black">SIP Direct Top-up</h4>
              </div>
              <button
                onClick={() => setTopUpInvestment(null)}
                className="p-1 rounded-lg hover:bg-slate-50 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
              You are adding a one-time capital top-up to <strong className="text-slate-800">{topUpInvestment.name}</strong>. This boosts its cumulative invested valuation immediately:
            </p>

            <form onSubmit={handleTopUpConfirm} className="space-y-4">
              {/* Top up Amount */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Boost Capital Contribution</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">{preferences.currencySymbol}</span>
                  <input
                    type="number"
                    placeholder="e.g. 10000"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-7 pr-3 outline-none focus:border-indigo-600 font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Funding checking bank source */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Funding Checking Account</label>
                <select
                  value={topUpAccountId}
                  onChange={(e) => setTopUpAccountId(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-2 outline-none font-semibold text-slate-700 cursor-pointer"
                  required
                >
                  <option value="" disabled>-- Funding Bank Account --</option>
                  {accounts.filter(a => a.type === 'bank').map(a => (
                    <option key={a.id} value={a.id}>
                      {a.institution} - {a.name} ({formatCurrency(a.balance, preferences)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Record transaction checkbox */}
              <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <input
                  type="checkbox"
                  id="record-expense-chk"
                  checked={recordExpense}
                  onChange={(e) => setRecordExpense(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="record-expense-chk" className="text-[10px] font-bold text-slate-600 cursor-pointer select-none">
                  Log as standard transaction in ledger
                </label>
              </div>

              {/* Feedback */}
              {topUpErr && (
                <div className="p-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[10px] font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{topUpErr}</span>
                </div>
              )}

              {topUpOk && (
                <div className="p-2.5 bg-green-50 text-green-700 border border-green-100 rounded-xl text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0 animate-bounce" />
                  <span>{topUpOk}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2.5">
                <button
                  type="button"
                  onClick={() => setTopUpInvestment(null)}
                  className="flex-1 text-xs font-semibold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl py-2.5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl py-2.5 shadow-md flex items-center justify-center gap-1 cursor-pointer"
                >
                  Confirm Boost
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANUAL SIP INVESTMENT PAYMENT LOGGING MODAL */}
      {payInvestment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-[#0b1329] rounded-3xl max-w-md w-full p-6 md:p-8 shadow-xl border border-slate-100/85 dark:border-slate-805/80 animate-scale-up text-slate-800 dark:text-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40">
                <CheckCircle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Record SIP Payment</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">Instantly log SIP outflow, update asset value & bank balances</p>
              </div>
            </div>

            <form onSubmit={handleRecordSIPPaySubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Target Asset/Fund</label>
                <input
                  type="text"
                  disabled
                  value={payInvestment.name}
                  className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 bg-slate-100 dark:bg-slate-900/50 font-bold text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Installment Paid</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5 text-xs text-slate-400 font-bold">{preferences.currencySymbol}</span>
                    <input
                      type="number"
                      required
                      step="any"
                      value={paySIPAmount}
                      onChange={(e) => setPaySIPAmount(e.target.value)}
                      className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 pl-7 bg-slate-50 dark:bg-slate-900/40 focus:outline-none focus:border-emerald-500 font-bold text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Payment Date</label>
                  <input
                    type="date"
                    required
                    value={paySIPDate}
                    onChange={(e) => setPaySIPDate(e.target.value)}
                    className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50 dark:bg-slate-900/40 focus:outline-none focus:border-emerald-500 font-semibold text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Funding Bank Account</label>
                <select
                  required
                  value={paySIPAccountId}
                  onChange={(e) => setPaySIPAccountId(e.target.value)}
                  className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 bg-slate-50 dark:bg-slate-900/40 focus:outline-none focus:border-emerald-500 font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="">-- Choose Bank Account --</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.institution} - {acc.name} ({acc.type === 'bank' ? `Bal: ${formatCurrency(acc.balance, preferences)}` : `Debt: ${formatCurrency(acc.balance, preferences)}`})
                    </option>
                  ))}
                </select>
              </div>

              {/* Feedback messages inside modal */}
              {paySIPErr && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/25 text-red-650 dark:text-red-400 border border-red-100 dark:border-red-900/40 rounded-xl text-[10px] font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{paySIPErr}</span>
                </div>
              )}

              {paySIPOk && (
                <div className="p-2.5 bg-green-50 dark:bg-green-950/25 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-900/40 rounded-xl text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0 animate-bounce" />
                  <span>{paySIPOk}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={!!paySIPOk}
                  className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition text-white font-extrabold py-3 px-4 rounded-xl cursor-pointer shadow-sm hover:shadow-emerald-600/10 active:scale-[0.98]"
                >
                  Confirm & Log SIP
                </button>
                <button
                  type="button"
                  onClick={() => setPayInvestment(null)}
                  className="flex-1 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold py-3 px-4 rounded-xl transition cursor-pointer active:scale-[0.98]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL CHANNELS */}
      {investmentToDelete && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertCircle className="w-6 h-6 stroke-2" />
              <h4 className="text-sm font-black">Remove Asset Record?</h4>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed mb-5">
              Are you sure you want to delete <strong className="text-slate-800">{investmentToDelete.name}</strong> from your active holdings tracking registry? This cannot be undone.
            </p>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setInvestmentToDelete(null)}
                className="flex-1 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl py-2.5 outline-none transition cursor-pointer"
              >
                Keep Holding
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="flex-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl py-2.5 shadow-sm outline-none transition cursor-pointer"
              >
                Delete Holding
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
