/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FinanceData, Expense, FinancialAccount } from '../types';
import { formatCurrency } from '../utils/formatters';
import { CurrencyValue } from './finance/CurrencyValue';
import { getActiveBillingCycleForDate } from '../utils/billing';
import { ShieldAlert, Plus, Trash2, Pencil, Search, Filter, SlidersHorizontal, Settings, Info, CheckCircle, ArrowDownRight } from 'lucide-react';
import { motion } from 'motion/react';

interface ExpensesSectionProps {
  data: FinanceData;
  setFinanceData: React.Dispatch<React.SetStateAction<FinanceData>>;
}

export default function ExpensesSection({ data, setFinanceData }: ExpensesSectionProps) {
  const { expenses, accounts, budgets, preferences, savingGoals = [] } = data;

  // New expense form states
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(budgets[0]?.category || 'Food & Dining');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [targetAccountId, setTargetAccountId] = useState('');
  const [selectedStore, setSelectedStore] = useState('');

  const allocatedEmergency = preferences.emergencyAllocated || 0;
  const currentStores = preferences.onlineStores || [
    'Amazon Now',
    'Flipkart',
    'Uber',
    'Zomato',
    'Swiggy',
    'Myntra'
  ];

  // Search/Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterAccount, setFilterAccount] = useState('All');
  const [onlyLargeExpenses, setOnlyLargeExpenses] = useState(false);
  const [dateFilterType, setDateFilterType] = useState<string>('all');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [expenseToDelete, setExpenseToDelete] = useState<{ id: string; amount: number; accountId: string; description: string } | null>(null);

  // States for editing an expense
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editAccountId, setEditAccountId] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editGoalId, setEditGoalId] = useState('');
  const [editTargetAccountId, setEditTargetAccountId] = useState('');
  const [editStore, setEditStore] = useState('');

  const threshold = preferences.largeExpenseThreshold;

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!description.trim()) {
      setErrorMsg('Please enter a description for the expense (e.g., Dinner at Starbucks).');
      return;
    }

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg('Please enter a valid expense amount greater than 0.');
      return;
    }

    if (!accountId) {
      setErrorMsg('Please select a payment account or credit card.');
      return;
    }

    if (!date) {
      setErrorMsg('Please select a receipt date.');
      return;
    }

    const sourceAcc = accounts.find(a => a.id === accountId);
    if (!sourceAcc) {
      setErrorMsg('Target credit/bank channel not found.');
      return;
    }

    const isTransfer = category.toLowerCase() === 'transfer';
    if (isTransfer) {
      if (!targetAccountId) {
        setErrorMsg('Please select a target account for the transfer.');
        return;
      }
      if (targetAccountId === accountId) {
        setErrorMsg('Source account and target account must be different.');
        return;
      }
    }

    // Deduct from bank or add to credit card outstanding amount
    const updatedAccounts = accounts.map(a => {
      if (a.id === accountId) {
        if (a.type === 'bank') {
          return { ...a, balance: a.balance - amt }; // bank balance reduces
        } else {
          return { ...a, balance: a.balance + amt }; // outstanding debt on cards increases
        }
      }
      if (isTransfer && a.id === targetAccountId) {
        if (a.type === 'bank') {
          return { ...a, balance: a.balance + amt }; // bank balance increases
        } else {
          return { ...a, balance: Math.max(0, a.balance - amt) }; // outstanding debt on cards decreases
        }
      }
      return a;
    });

    const updatedGoals = selectedGoalId
      ? (savingGoals || []).map(g => {
          if (g.id === selectedGoalId) {
            const newAmount = g.currentAmount + amt;
            let extraFields = {};
            if (g.goalType === 'fixed' && g.installmentAmount) {
              const newPaid = Math.floor(newAmount / g.installmentAmount);
              extraFields = {
                paidInstallments: Math.min(newPaid, g.totalInstallments || newPaid)
              };
            }
            return {
              ...g,
              currentAmount: newAmount,
              ...extraFields
            };
          }
          return g;
        })
      : savingGoals;

    const newExpense: Expense = {
      id: `exp-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      description: description.trim(),
      amount: amt,
      category,
      date,
      accountId,
      isRecurring: false,
      savingGoalId: selectedGoalId || undefined,
      targetAccountId: isTransfer ? targetAccountId : undefined,
      store: selectedStore || undefined,
    };

    let newCcTx = null;
    if (isTransfer) {
      const targetAcc = accounts.find(a => a.id === targetAccountId);
      if (targetAcc && targetAcc.type === 'credit_card') {
        newCcTx = {
          id: `tx_${newExpense.id}`,
          cardId: targetAccountId,
          type: 'bill_payment' as const,
          description: description.trim(),
          amount: amt,
          date,
          category: 'Transfer',
        };
      }
    } else {
      if (sourceAcc && sourceAcc.type === 'credit_card') {
        newCcTx = {
          id: `tx_${newExpense.id}`,
          cardId: accountId,
          type: 'purchase' as const,
          description: description.trim(),
          amount: amt,
          date,
          category,
        };
      }
    }

    setFinanceData(prev => ({
      ...prev,
      expenses: [newExpense, ...prev.expenses],
      accounts: updatedAccounts,
      savingGoals: updatedGoals,
      ccTransactions: newCcTx ? [...(prev.ccTransactions || []), newCcTx] : prev.ccTransactions,
    }));

    setDescription('');
    setAmount('');
    setSelectedGoalId('');
    setTargetAccountId('');
    setSelectedStore('');
    setSuccessMsg(`Logged: "${newExpense.description}" for ${formatCurrency(amt, preferences)}. Balance and target milestone updated.`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleDeleteExpense = (id: string, amountToRefund: number, connectedAccountId: string) => {
    const exp = expenses.find(e => e.id === id);
    setExpenseToDelete({
      id,
      amount: amountToRefund,
      accountId: connectedAccountId,
      description: exp ? exp.description : 'this expense'
    });
  };

  const confirmDeleteExpense = () => {
    if (!expenseToDelete) return;
    const { id, amount: amountToRefund, accountId: connectedAccountId } = expenseToDelete;

    const targetExpense = expenses.find(e => e.id === id);
    const isTransfer = targetExpense?.category.toLowerCase() === 'transfer';
    const targetAccountIdForRefund = targetExpense?.targetAccountId;

    // Refund balance
    const refundedAccounts = accounts.map(a => {
      if (isTransfer) {
        if (a.id === connectedAccountId) {
          if (a.type === 'bank') {
            return { ...a, balance: a.balance + amountToRefund }; // bank gets transfer source money back
          } else {
            return { ...a, balance: Math.max(0, a.balance - amountToRefund) }; // credit card debt goes down
          }
        }
        if (targetAccountIdForRefund && a.id === targetAccountIdForRefund) {
          if (a.type === 'bank') {
            return { ...a, balance: Math.max(0, a.balance - amountToRefund) }; // bank gets transfer target money subtracted
          } else {
            return { ...a, balance: a.balance + amountToRefund }; // credit card debt outstanding goes back up
          }
        }
      } else {
        if (a.id === connectedAccountId) {
          if (a.type === 'bank') {
            return { ...a, balance: a.balance + amountToRefund }; // bank gets money back
          } else {
            return { ...a, balance: Math.max(0, a.balance - amountToRefund) }; // credit card debt goes down
          }
        }
      }
      return a;
    });

    const linkedGoalId = targetExpense?.savingGoalId;

    const updatedGoals = linkedGoalId
      ? (savingGoals || []).map(g => {
          if (g.id === linkedGoalId) {
            const newAmount = Math.max(0, g.currentAmount - amountToRefund);
            let extraFields = {};
            if (g.goalType === 'fixed' && g.installmentAmount) {
              const newPaid = Math.floor(newAmount / g.installmentAmount);
              extraFields = {
                paidInstallments: Math.min(newPaid, g.totalInstallments || newPaid)
              };
            }
            return {
              ...g,
              currentAmount: newAmount,
              ...extraFields
            };
          }
          return g;
        })
      : savingGoals;

    let filteredCcTransactions = data.ccTransactions || [];
    if (targetExpense) {
      if (isTransfer) {
        if (targetAccountIdForRefund) {
          filteredCcTransactions = filteredCcTransactions.filter(t => 
            t.id !== `tx_${targetExpense.id}` && 
            !(t.cardId === targetAccountIdForRefund &&
              t.type === 'bill_payment' &&
              Math.abs(t.amount - targetExpense.amount) < 0.01 &&
              t.description === targetExpense.description &&
              t.date === targetExpense.date)
          );
        }
      } else {
        const connectedAcc = accounts.find(a => a.id === connectedAccountId);
        const isCc = connectedAcc?.type === 'credit_card';
        if (isCc) {
          filteredCcTransactions = filteredCcTransactions.filter(t => 
            t.id !== `tx_${targetExpense.id}` && 
            !(t.cardId === connectedAccountId &&
              t.type === 'purchase' &&
              Math.abs(t.amount - targetExpense.amount) < 0.01 &&
              t.description === targetExpense.description &&
              t.date === targetExpense.date)
          );
        }
      }
    }

    setFinanceData(prev => ({
      ...prev,
      expenses: prev.expenses.filter(exp => exp.id !== id),
      accounts: refundedAccounts,
      savingGoals: updatedGoals,
      ccTransactions: filteredCcTransactions,
    }));
    setExpenseToDelete(null);
  };

  const handleEditExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    if (!editDescription.trim()) {
      alert('Please enter an expense title / description.');
      return;
    }

    const amt = parseFloat(editAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid expense amount greater than 0.');
      return;
    }

    if (!editAccountId) {
      alert('Please select a payment channel.');
      return;
    }

    if (!editDate) {
      alert('Please select a transaction date.');
      return;
    }

    const targetAcc = accounts.find(a => a.id === editAccountId);
    if (!targetAcc) {
      alert('Target payment channel not found.');
      return;
    }

    // 1. Revert effect of the old expense amount from the old account
    const oldAccountId = editingExpense.accountId;
    const oldAmount = editingExpense.amount;
    const oldIsTransfer = editingExpense.category.toLowerCase() === 'transfer';
    const oldTargetAccountId = editingExpense.targetAccountId;

    const revertedAccounts = accounts.map(a => {
      let balance = a.balance;
      if (oldIsTransfer) {
        if (a.id === oldAccountId) {
          if (a.type === 'bank') {
            balance += oldAmount;
          } else {
            balance = Math.max(0, balance - oldAmount);
          }
        }
        if (oldTargetAccountId && a.id === oldTargetAccountId) {
          if (a.type === 'bank') {
            balance = Math.max(0, balance - oldAmount);
          } else {
            balance += oldAmount;
          }
        }
      } else {
        if (a.id === oldAccountId) {
          if (a.type === 'bank') {
            balance += oldAmount; // bank gets money back
          } else {
            balance = Math.max(0, balance - oldAmount); // credit card debt goes down
          }
        }
      }
      return { ...a, balance };
    });

    // 2. Apply new expense effect to the new account
    const newIsTransfer = editCategory.toLowerCase() === 'transfer';
    if (newIsTransfer) {
      if (!editTargetAccountId) {
        alert('Please select a target account for the transfer.');
        return;
      }
      if (editTargetAccountId === editAccountId) {
        alert('Source account and target account must be different.');
        return;
      }
    }

    const updatedAccounts = revertedAccounts.map(a => {
      let balance = a.balance;
      if (newIsTransfer) {
        if (a.id === editAccountId) {
          if (a.type === 'bank') {
            balance -= amt;
          } else {
            balance += amt;
          }
        }
        if (a.id === editTargetAccountId) {
          if (a.type === 'bank') {
            balance += amt;
          } else {
            balance = Math.max(0, balance - amt);
          }
        }
      } else {
        if (a.id === editAccountId) {
          if (a.type === 'bank') {
            balance -= amt; // bank balance reduces
          } else {
            balance += amt; // credit card debt outstanding increases
          }
        }
      }
      return { ...a, balance };
    });

    const oldGoalId = editingExpense.savingGoalId;

    let intermediateGoals = savingGoals || [];
    if (oldGoalId) {
      intermediateGoals = intermediateGoals.map(g => {
        if (g.id === oldGoalId) {
          const newAmount = Math.max(0, g.currentAmount - oldAmount);
          let extraFields = {};
          if (g.goalType === 'fixed' && g.installmentAmount) {
            const newPaid = Math.floor(newAmount / g.installmentAmount);
            extraFields = {
              paidInstallments: Math.min(newPaid, g.totalInstallments || newPaid)
            };
          }
          return {
            ...g,
            currentAmount: newAmount,
            ...extraFields
          };
        }
        return g;
      });
    }

    const updatedGoals = editGoalId
      ? intermediateGoals.map(g => {
          if (g.id === editGoalId) {
            const newAmount = g.currentAmount + amt;
            let extraFields = {};
            if (g.goalType === 'fixed' && g.installmentAmount) {
              const newPaid = Math.floor(newAmount / g.installmentAmount);
              extraFields = {
                paidInstallments: Math.min(newPaid, g.totalInstallments || newPaid)
              };
            }
            return {
              ...g,
              currentAmount: newAmount,
              ...extraFields
            };
          }
          return g;
        })
      : intermediateGoals;

    const updatedExpenses = expenses.map(exp => {
      if (exp.id === editingExpense.id) {
        return {
          ...exp,
          description: editDescription.trim(),
          amount: amt,
          category: editCategory,
          date: editDate,
          accountId: editAccountId,
          savingGoalId: editGoalId || undefined,
          targetAccountId: newIsTransfer ? editTargetAccountId : undefined,
          store: editStore || undefined
        };
      }
      return exp;
    });

    // Sync ccTransactions
    const wasCc = accounts.find(a => a.id === oldAccountId)?.type === 'credit_card';
    const isCc = targetAcc.type === 'credit_card';

    let nextCcTransactions = (data.ccTransactions || []).filter(t => {
      if (t.id === `tx_${editingExpense.id}`) return false;
      if (wasCc && !oldIsTransfer && t.cardId === oldAccountId && t.type === 'purchase' && Math.abs(t.amount - oldAmount) < 0.01 && t.date === editingExpense.date) {
        return false;
      }
      if (oldIsTransfer && oldTargetAccountId && t.cardId === oldTargetAccountId && t.type === 'bill_payment' && Math.abs(t.amount - oldAmount) < 0.01 && t.date === editingExpense.date) {
        return false;
      }
      return true;
    });

    if (newIsTransfer) {
      const editTargetAcc = accounts.find(a => a.id === editTargetAccountId);
      if (editTargetAcc && editTargetAcc.type === 'credit_card') {
        nextCcTransactions.push({
          id: `tx_${editingExpense.id}`,
          cardId: editTargetAccountId,
          type: 'bill_payment' as const,
          description: editDescription.trim(),
          amount: amt,
          date: editDate,
          category: 'Transfer',
        });
      }
    } else {
      if (isCc) {
        nextCcTransactions.push({
          id: `tx_${editingExpense.id}`,
          cardId: editAccountId,
          type: 'purchase' as const,
          description: editDescription.trim(),
          amount: amt,
          date: editDate,
          category: editCategory,
        });
      }
    }

    // Sync ccEmis if any is converted from this expense (with robust backward compatibility mapping)
    const updatedEmis = (data.ccEmis || []).map(emi => {
      const isMatch = emi.convertedFromExpenseId === editingExpense.id || (
        !emi.convertedFromExpenseId &&
        emi.originalAmount === oldAmount &&
        emi.cardId === oldAccountId &&
        (emi.expenseName.toLowerCase().trim() === editingExpense.description.toLowerCase().trim() ||
         emi.expenseName.toLowerCase().trim().includes(editingExpense.description.toLowerCase().trim()) ||
         editingExpense.description.toLowerCase().trim().includes(emi.expenseName.toLowerCase().trim()))
      );
      if (isMatch) {
        return {
          ...emi,
          convertedFromExpenseId: editingExpense.id, // solidify link for future
          cardId: editAccountId,
          expenseName: editDescription.trim(),
          category: editCategory || emi.category,
          originalAmount: amt,
          purchaseDate: editDate,
        };
      }
      return emi;
    });

    setFinanceData(prev => ({
      ...prev,
      expenses: updatedExpenses,
      accounts: updatedAccounts,
      savingGoals: updatedGoals,
      ccTransactions: nextCcTransactions,
      ccEmis: updatedEmis,
    }));

    setEditingExpense(null);
    setEditGoalId('');
    setEditTargetAccountId('');
    setSuccessMsg(`Updated: "${editDescription.trim()}" for ${formatCurrency(amt, preferences)}. Balance and HUD updated.`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Perform Filters & Search on the expense dataset
  const filteredExpenses = expenses.filter(exp => {
    const term = searchTerm.toLowerCase().trim();
    const acc = accounts.find(a => a.id === exp.accountId);
    const accountName = acc ? acc.name.toLowerCase() : '';
    const formattedAmt = formatCurrency(exp.amount, preferences).toLowerCase();

    const matchesSearch = !term ||
                          exp.description.toLowerCase().includes(term) ||
                          exp.category.toLowerCase().includes(term) ||
                          exp.date.includes(term) ||
                          exp.amount.toString().includes(term) ||
                          formattedAmt.includes(term) ||
                          accountName.includes(term);
    
    const matchesCategory = filterCategory === 'All' || exp.category.toLowerCase() === filterCategory.toLowerCase();
    const matchesAccount = filterAccount === 'All' || exp.accountId === filterAccount;
    const matchesLarge = !onlyLargeExpenses || exp.amount >= threshold;

    let matchesDate = true;
    if (dateFilterType === 'today') {
      const todayStr = new Date().toISOString().split('T')[0];
      matchesDate = exp.date === todayStr;
    } else if (dateFilterType === 'this_month') {
      const today = new Date();
      const thisMonthPrefix = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
      matchesDate = exp.date.startsWith(thisMonthPrefix);
    } else if (dateFilterType === 'last_month') {
      const today = new Date();
      let lmYear = today.getFullYear();
      let lmMonth = today.getMonth(); // 0 is Jan, so prev of Jan is Dec of prev year
      if (lmMonth === 0) {
        lmMonth = 12;
        lmYear -= 1;
      }
      const lastMonthPrefix = `${lmYear}-${lmMonth.toString().padStart(2, '0')}`;
      matchesDate = exp.date.startsWith(lastMonthPrefix);
    } else if (dateFilterType === 'billing_cycle') {
      const filterSelectedCard = accounts.find(a => a.id === filterAccount);
      if (filterSelectedCard && filterSelectedCard.type === 'credit_card') {
        const bDay = filterSelectedCard.billingCycleStartDay || 15;
        const cycle = getActiveBillingCycleForDate(bDay, new Date());
        matchesDate = exp.date >= cycle.startStr && exp.date <= cycle.endStr;
      } else {
        // Fallback if no card is selected
        matchesDate = true;
      }
    } else if (dateFilterType === 'custom') {
      if (customStart && exp.date < customStart) matchesDate = false;
      if (customEnd && exp.date > customEnd) matchesDate = false;
    }

    return matchesSearch && matchesCategory && matchesAccount && matchesLarge && matchesDate;
  });

  const sortedExpenses = React.useMemo(() => {
    const list = [...filteredExpenses];
    return list.sort((a, b) => {
      if (sortBy === 'date_desc') return b.date.localeCompare(a.date);
      if (sortBy === 'date_asc') return a.date.localeCompare(b.date);
      if (sortBy === 'amount_desc') return b.amount - a.amount;
      if (sortBy === 'amount_asc') return a.amount - b.amount;
      return 0;
    });
  }, [filteredExpenses, sortBy]);

  const totalFilteredSpent = sortedExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div id="expenses-root" className="grid grid-cols-1 lg:grid-cols-12 gap-6">

      {/* LEFT: LOG FORM & THRESHOLD BOX */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* FORM: LOG EXPENSE */}
        <div className="bg-white dark:bg-[#0b1329] p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-50 dark:border-slate-800/50 mb-4 font-sans">
            <ArrowDownRight className="w-5 h-5 text-indigo-500" />
            <h2 className="text-base font-bold text-slate-850 dark:text-slate-100">Log Outgoing Payment</h2>
          </div>

          <form onSubmit={handleAddExpense} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase mb-1">Expense Title / Vendor</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Grocery Mart, Uber Trip, Pizza"
                className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-900/60 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase mb-1">Amount Charged</label>
              <div className="relative">
                <span className="absolute left-2.5 top-2.5 text-xs text-slate-450 font-bold">{preferences.currencySymbol}</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 1500"
                  className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 pl-6 bg-slate-50 dark:bg-slate-900/60 focus:outline-none focus:border-indigo-500 font-extrabold text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-900/60 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 dark:text-slate-200"
                >
                  {budgets.map(b => (
                    <option key={b.category} value={b.category} className="dark:bg-slate-900">{b.category}</option>
                  ))}
                  <option value="Transfer" className="dark:bg-slate-900">Transfer (Internal Movement)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase mb-1">
                  {category.toLowerCase() === 'transfer' ? 'Source Account (From)' : 'Charged on'}
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full text-xs border border-slate-250 dark:border-slate-800 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-900/60 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800 dark:text-slate-200"
                >
                  <option value="" className="dark:bg-slate-905">-- Select Channel --</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id} className="dark:bg-slate-900">
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {category.toLowerCase() === 'transfer' && (
              <div>
                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase mb-1">Target Account (To)</label>
                <select
                  value={targetAccountId}
                  onChange={(e) => setTargetAccountId(e.target.value)}
                  className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-900/60 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800 dark:text-slate-200"
                >
                  <option value="" className="dark:bg-slate-900">-- Select Target --</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id} className="dark:bg-slate-900">
                      {acc.name} ({acc.type === 'bank' ? 'Liquid' : 'Debt'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase mb-1">Transaction Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs border border-slate-202 dark:border-slate-800 rounded-lg p-2 bg-slate-50 dark:bg-slate-900/60 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase mb-1">Link to Savings Goal (Optional)</label>
              <select
                value={selectedGoalId}
                onChange={(e) => setSelectedGoalId(e.target.value)}
                className="w-full text-xs border border-slate-202 dark:border-slate-800 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-900/60 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="" className="dark:bg-[#0b1329]">-- No Linked Goal --</option>
                {savingGoals.map(g => (
                  <option key={g.id} value={g.id} className="dark:bg-[#0b1329]">
                    {g.name} (Current: {formatCurrency(g.currentAmount, preferences)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase mb-1">Online Store/App (Optional)</label>
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="w-full text-xs border border-slate-202 dark:border-slate-800 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-900/60 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="" className="dark:bg-[#0b1329]">-- No Linked Store --</option>
                {currentStores.map(storeName => (
                  <option key={storeName} value={storeName} className="dark:bg-[#0b1329]">
                    {storeName}
                  </option>
                ))}
              </select>
            </div>

            {/* LIVE EMERGENCY RESERVE CUSHION NOTE */}
            {allocatedEmergency > 0 && (
              (() => {
                const bankAccounts = accounts.filter(a => a.type === 'bank');
                const totalBankCash = bankAccounts.reduce((sum, a) => sum + a.balance, 0);
                const inputAmt = parseFloat(amount) || 0;
                
                // Check if target is a bank account
                const selectedAccount = accounts.find(a => a.id === accountId);
                const isSpendingFromBank = selectedAccount && selectedAccount.type === 'bank';
                const postSpendBankCash = isSpendingFromBank ? (totalBankCash - inputAmt) : totalBankCash;
                const isReservesBreachedAfterSpend = postSpendBankCash < allocatedEmergency;
                
                return (
                  <div className={`p-2.5 rounded-xl border text-[10px] font-sans transition-colors duration-200 ${
                    isReservesBreachedAfterSpend 
                      ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/45 text-amber-900 dark:text-amber-305 dark:text-amber-300' 
                      : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/45 text-emerald-900 dark:text-emerald-305 dark:text-emerald-300'
                  }`}>
                    {isReservesBreachedAfterSpend ? (
                      <span className="font-semibold block leading-relaxed">
                        ⚠️ Reserve Alert: This expense of <CurrencyValue value={inputAmt} /> will dip your total bank balance (<CurrencyValue value={postSpendBankCash} />) below your set Emergency Reserve of <CurrencyValue value={allocatedEmergency} />!
                      </span>
                    ) : (
                      <span className="font-semibold block leading-relaxed">
                        🛡️ Shield Guard Active: Your set emergency fund of <CurrencyValue value={allocatedEmergency} /> remains completely safe. Remaining free cash cushion: <CurrencyValue value={postSpendBankCash - allocatedEmergency} />.
                      </span>
                    )}
                  </div>
                );
              })()
            )}

            {errorMsg && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 rounded-xl flex items-center gap-1.5 text-[10px] text-rose-600 dark:text-rose-400 font-semibold transition-all">
                <ShieldAlert className="w-3.5 h-3.5" /> {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-2.5 bg-teal-50 dark:bg-emerald-950/30 border border-teal-100 dark:border-emerald-900/40 rounded-xl flex items-center gap-1.5 text-[10px] text-teal-700 dark:text-emerald-400 font-semibold transition-all">
                <CheckCircle className="w-3.5 h-3.5 text-teal-600 dark:text-emerald-400" /> {successMsg}
              </div>
            )}

            <button
              type="submit"
              className="w-full text-xs bg-indigo-600 hover:bg-indigo-700 transition text-white font-extrabold py-3 rounded-xl shadow-sm"
            >
              Add Expense Entry
            </button>
          </form>
        </div>

      </div>

      {/* RIGHT: FILTER CONTROLS & EXPENSES GRID */}
      <div className="lg:col-span-8 space-y-4">
        
        {/* FILTER BAR PANEL MAP */}
        <div className="bg-white dark:bg-[#0b1329] p-6 md:p-7 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-sm font-sans">
          <div className="flex items-center gap-1.5 mb-3 text-slate-705 dark:text-slate-200">
            <Search className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-bold">Search & Filter Audit Ledger</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Search Table Fields</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search vendor, amount, category, date, or card..."
                className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg p-2 bg-slate-50 dark:bg-slate-900/60 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg p-2 bg-slate-50 dark:bg-slate-900/60 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 dark:text-slate-200"
              >
                <option value="All" className="dark:bg-[#0b1329]">All Categories</option>
                {budgets.map(b => (
                  <option key={b.category} value={b.category} className="dark:bg-[#0b1329]">{b.category}</option>
                ))}
                <option value="Transfer" className="dark:bg-[#0b1329]">Transfer (Internal Movement)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Account Channel</label>
              <select
                value={filterAccount}
                onChange={(e) => setFilterAccount(e.target.value)}
                className="w-full text-xs border border-slate-205 dark:border-slate-800 rounded-lg p-2 bg-slate-50 dark:bg-slate-900/60 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 dark:text-slate-200"
              >
                <option value="All" className="dark:bg-[#0b1329]">All Accounts / Cards</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id} className="dark:bg-[#0b1329]">{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Date Filtering controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3.5 pt-3.5 border-t border-slate-100/85 dark:border-slate-800">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Date Period</label>
              <select
                value={dateFilterType}
                onChange={(e) => setDateFilterType(e.target.value)}
                className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg p-2 bg-slate-50 dark:bg-slate-900/60 focus:outline-none focus:border-indigo-500 font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="all" className="dark:bg-[#0b1329]">Show All Dates</option>
                <option value="today" className="dark:bg-[#0b1329]">Today</option>
                <option value="this_month" className="dark:bg-[#0b1329]">This Month</option>
                <option value="last_month" className="dark:bg-[#0b1329]">Last Month</option>
                <option value="billing_cycle" className="dark:bg-[#0b1329]">Billing Statement Cycle</option>
                <option value="custom" className="dark:bg-[#0b1329]">Custom Date Range</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Sort Ledger By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full text-xs border border-slate-205 dark:border-slate-800 rounded-lg p-2 bg-slate-50 dark:bg-[#0b1329] focus:outline-none focus:border-indigo-500 font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="date_desc" className="dark:bg-[#0b1329]">Date (Newest first)</option>
                <option value="date_asc" className="dark:bg-[#0b1329]">Date (Oldest first)</option>
                <option value="amount_desc" className="dark:bg-[#0b1329]">Amount (Highest first)</option>
                <option value="amount_asc" className="dark:bg-[#0b1329]">Amount (Lowest first)</option>
              </select>
            </div>

            {/* Display billing cycle details OR custom range inputs */}
            {dateFilterType === 'billing_cycle' && (() => {
              const selectedCC = accounts.find(a => a.id === filterAccount);
              const isCC = selectedCC?.type === 'credit_card';
              if (isCC) {
                const bDay = selectedCC.billingCycleStartDay || 15;
                const cycle = getActiveBillingCycleForDate(bDay, new Date());
                return (
                  <div className="lg:col-span-2 flex flex-col justify-center bg-indigo-50/55 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl px-3.5 py-1.5">
                    <p className="text-[10px] font-extrabold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest mb-0.5">Active Cycle Period</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-tight">
                      {cycle.startStr} to {cycle.endStr} <span className="text-[10px] text-indigo-500/85 dark:text-indigo-400 font-extrabold">(Statement Day {bDay})</span>
                    </p>
                  </div>
                );
              } else {
                return (
                  <div className="lg:col-span-2 flex flex-col justify-center bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-xl px-3.5 py-1.5 animate-pulse">
                    <p className="text-[10px] font-black text-amber-700 dark:text-amber-500 uppercase tracking-widest mb-0.5">Configuration advice</p>
                    <p className="text-[11px] font-bold text-amber-900 dark:text-amber-300 leading-tight">
                      Please select a Credit Card in "Account Channel" above to activate statement cycle filters.
                    </p>
                  </div>
                );
              }
            })()}

            {dateFilterType === 'custom' && (
              <>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">From Date</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg p-2 bg-slate-50 dark:bg-slate-900/60 focus:outline-none focus:border-indigo-500 font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">To Date</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg p-2 bg-slate-50 dark:bg-slate-900/60 focus:outline-none focus:border-indigo-505 font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                  />
                </div>
              </>
            )}
          </div>

          {/* LARGE EXPENSE LIMIT SWITCH ONLY */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50 dark:border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-650 dark:text-slate-300">
              <input
                type="checkbox"
                checked={onlyLargeExpenses}
                onChange={(e) => setOnlyLargeExpenses(e.target.checked)}
                className="rounded border-slate-350 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              ⚠️ High Outgoings Limit Crossings Only (&ge; {formatCurrency(threshold, preferences)})
            </label>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">
              Showing {sortedExpenses.length} entries • Spent: <span className="font-extrabold text-slate-700 dark:text-slate-300">{formatCurrency(totalFilteredSpent, preferences)}</span>
            </span>
          </div>
        </div>

        {/* LEDGER EXPENSE LIST */}
        <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
          {sortedExpenses.map((exp, index) => {
            const isLarge = exp.amount >= threshold && exp.category.toLowerCase() !== 'transfer';
            const connectedAcc = accounts.find(a => a.id === exp.accountId);
            
            return (
              <div
                key={`${exp.id}_${index}`}
                className={`p-4 bg-white dark:bg-slate-900/50 border rounded-2xl shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-center justify-between ${isLarge ? 'border-amber-200 dark:border-amber-500/30 bg-amber-50/15 dark:bg-amber-950/20' : 'border-slate-100 dark:border-slate-800/80'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isLarge ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                    <ArrowDownRight className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      {exp.description}
                      {isLarge && (
                        <span className="text-[9px] bg-amber-50 border border-amber-200 dark:border-amber-900/30 text-amber-800 font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5" title="Cost crosses large threshold limit set.">
                          ⚠️ Highly Expensive
                        </span>
                      )}
                    </span>
                    <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-slate-400 font-bold mt-0.5">
                      <span>{exp.category}</span>
                      <span>•</span>
                      <span className="text-slate-500 truncate max-w-[120px]" title={connectedAcc?.name}>Chnl: {connectedAcc ? connectedAcc.name : 'Direct Direct'}</span>
                      {exp.store && (
                        <>
                          <span>•</span>
                          <span className="text-violet-600 dark:text-violet-400 font-extrabold bg-violet-50 dark:bg-violet-950/20 px-1.5 py-0.5 rounded text-[9px] border border-violet-150/40" title={`Purchased via ${exp.store}`}>
                            Store: {exp.store}
                          </span>
                        </>
                      )}
                      {exp.isRecurring && (
                        <>
                          <span>•</span>
                          <span className="text-indigo-600">Recurring Commit</span>
                        </>
                      )}
                      {exp.savingGoalId && (
                        <>
                          <span>•</span>
                          <span className="text-teal-600 font-extrabold bg-teal-50 dark:bg-teal-950/20 px-1.5 py-0.5 rounded text-[9px] border border-teal-150/40" title="This expense counts towards a savings milestone">
                            Milestone Target: {savingGoals.find(g => g.id === exp.savingGoalId)?.name || 'Linked Landmark'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-800 block">{formatCurrency(exp.amount, preferences)}</span>
                    <span className="text-[10px] text-slate-400 block font-semibold">{exp.date}</span>
                  </div>
                  <button
                    onClick={() => {
                      setEditingExpense(exp);
                      setEditDescription(exp.description);
                      setEditAmount(exp.amount.toString());
                      setEditCategory(exp.category);
                      setEditAccountId(exp.accountId);
                      setEditDate(exp.date);
                      setEditGoalId(exp.savingGoalId || '');
                      setEditTargetAccountId(exp.targetAccountId || '');
                      setEditStore(exp.store || '');
                    }}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800/50 rounded-lg transition cursor-pointer"
                    title="Edit expense entry"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteExpense(exp.id, exp.amount, exp.accountId)}
                    className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
                    title="Remove expense & revert balance"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredExpenses.length === 0 && (
            <div className="p-16 text-center bg-white dark:bg-slate-900/30 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs animate-fade-in">
              <Info className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-750 dark:text-slate-300 mt-4">No matching records found</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 max-w-[310px] mx-auto leading-relaxed">Try loosening your keyword filters, turning off the large expense filter, or record your initial purchases using the logger on the left!</p>
            </div>
          )}
        </div>

      </div>

      {/* CUSTOM CONFIRMATION DELETION MODAL */}
      {expenseToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-xl border border-slate-100/80 animate-scale-up">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4 border border-rose-100">
              <Trash2 className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-sans tracking-tight">Delete Expense Record?</h3>
            <p className="text-xs text-slate-500 mt-2.5 leading-relaxed font-medium">
              Are you sure you want to delete the expense entry <span className="font-bold text-slate-1000">"{expenseToDelete.description}"</span>? 
              The spent funds (<span className="font-bold text-indigo-600">{formatCurrency(expenseToDelete.amount, preferences)}</span>) will be automatically refunded back to your associated balance/credit limit.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={confirmDeleteExpense}
                className="flex-1 text-xs bg-rose-600 hover:bg-rose-700 transition duration-150 text-white font-extrabold py-3 px-4 rounded-xl cursor-pointer shadow-sm hover:shadow-rose-600/10 active:scale-[0.98]"
              >
                Yes, Delete Record
              </button>
              <button
                onClick={() => setExpenseToDelete(null)}
                className="flex-1 text-xs bg-slate-150 hover:bg-slate-200 text-slate-705 font-bold py-3 px-4 rounded-xl transition duration-150 cursor-pointer active:scale-[0.98]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT EXPENSE MODAL */}
      {editingExpense && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-[#0b1329] rounded-3xl max-w-md w-full p-6 md:p-8 shadow-xl border border-slate-100/85 dark:border-slate-805/80 animate-scale-up text-slate-800 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4 border-b border-slate-50 dark:border-slate-800/50 pb-3">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-100 dark:border-indigo-900/40">
                <Pencil className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Edit Outgoing Payment</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">Update vendor, charged balance amounts, or categorization</p>
              </div>
            </div>

            <form onSubmit={handleEditExpenseSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase mb-1">Expense Title / Vendor</label>
                <input
                  type="text"
                  required
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="e.g. Grocery Mart, Uber Trip"
                  className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-900/60 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase mb-1">Amount Charged</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-xs text-slate-450 font-bold">{preferences.currencySymbol}</span>
                  <input
                    type="number"
                    required
                    step="any"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    placeholder="e.g. 1500"
                    className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 pl-7 bg-slate-50 dark:bg-slate-900/60 focus:outline-none focus:border-indigo-500 font-bold text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                    <option value="Transfer" className="dark:bg-[#0b1329]">Transfer (Internal Movement)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase mb-1 font-sans">
                    {editCategory.toLowerCase() === 'transfer' ? 'Source Account (From)' : 'Payment Channel'}
                  </label>
                  <select
                    value={editAccountId}
                    onChange={(e) => setEditAccountId(e.target.value)}
                    className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-900/60 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800 dark:text-slate-205"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id} className="dark:bg-[#0b1329]">
                        {acc.name} ({acc.type === 'bank' ? 'Liquid' : 'Debt'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {editCategory.toLowerCase() === 'transfer' && (
                <div>
                  <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase mb-1">Target Account (To)</label>
                  <select
                    value={editTargetAccountId}
                    onChange={(e) => setEditTargetAccountId(e.target.value)}
                    className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-900/60 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800 dark:text-slate-200"
                  >
                    <option value="" className="dark:bg-[#0b1329]">-- Select Target --</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id} className="dark:bg-[#0b1329]">
                        {acc.name} ({acc.type === 'bank' ? 'Liquid' : 'Debt'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase mb-1">Transaction Date</label>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-900/60 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase mb-1">Link to Savings Goal (Optional)</label>
                <select
                  value={editGoalId}
                  onChange={(e) => setEditGoalId(e.target.value)}
                  className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-900/60 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="" className="dark:bg-[#0b1329]">-- No Linked Goal --</option>
                  {savingGoals.map(g => (
                    <option key={g.id} value={g.id} className="dark:bg-[#0b1329]">
                      {g.name} (Current: {formatCurrency(g.currentAmount, preferences)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase mb-1">Online Store/App (Optional)</label>
                <select
                  value={editStore}
                  onChange={(e) => setEditStore(e.target.value)}
                  className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-900/60 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="" className="dark:bg-[#0b1329]">-- No Linked Store --</option>
                  {currentStores.map(storeName => (
                    <option key={storeName} value={storeName} className="dark:bg-[#0b1329]">
                      {storeName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 text-xs bg-indigo-600 hover:bg-indigo-700 transition text-white font-extrabold py-3 px-4 rounded-xl cursor-pointer shadow-sm hover:shadow-indigo-600/10 active:scale-[0.98]"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
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
