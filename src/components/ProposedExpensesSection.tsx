/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { FinanceData, ProposedExpense, Expense } from '../types';
import { formatCurrency } from '../utils/formatters';
import { CurrencyValue } from './finance/CurrencyValue';
import { 
  ListTodo, 
  Plus, 
  CheckCircle2, 
  CreditCard, 
  ShoppingBag, 
  Trash2, 
  Pencil, 
  Search, 
  Calendar, 
  Tag, 
  AlertCircle, 
  ShieldCheck, 
  X, 
  Sparkles,
  ArrowUpRight,
  Filter,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProposedExpensesSectionProps {
  data: FinanceData;
  setFinanceData: React.Dispatch<React.SetStateAction<FinanceData>>;
}

export default function ProposedExpensesSection({ data, setFinanceData }: ProposedExpensesSectionProps) {
  const { expenses = [], accounts = [], budgets = [], preferences, savingGoals = [], proposedExpenses = [] } = data;

  // New Proposed Expense Form states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(budgets[0]?.category || 'Shopping');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'paid' | 'all'>('pending');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modal States
  const [payingItem, setPayingItem] = useState<ProposedExpense | null>(null);
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payAccountId, setPayAccountId] = useState(accounts[0]?.id || '');
  const [payStore, setPayStore] = useState('');
  const [payGoalId, setPayGoalId] = useState('');

  // Editing state
  const [editingItem, setEditingItem] = useState<ProposedExpense | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Feedback messages
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Delete modal state
  const [itemToDelete, setItemToDelete] = useState<ProposedExpense | null>(null);

  const currentStores = preferences.onlineStores || [
    'Amazon Now',
    'Flipkart',
    'Uber',
    'Zomato',
    'Swiggy',
    'Myntra'
  ];

  // Quick stats
  const stats = useMemo(() => {
    const pendingList = proposedExpenses.filter(p => !p.isPaid);
    const paidList = proposedExpenses.filter(p => p.isPaid);

    const pendingTotal = pendingList.reduce((sum, p) => sum + p.amount, 0);
    const paidTotal = paidList.reduce((sum, p) => sum + p.amount, 0);

    return {
      pendingTotal,
      paidTotal,
      pendingCount: pendingList.length,
      paidCount: paidList.length
    };
  }, [proposedExpenses]);

  // Handle Add Proposed Expense
  const handleAddProposedExpense = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!description.trim()) {
      setErrorMsg('Please enter a description for the proposed expense.');
      return;
    }

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg('Please enter a valid positive amount.');
      return;
    }

    const newProposedItem: ProposedExpense = {
      id: `prop-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      description: description.trim(),
      amount: amt,
      category,
      createdAt: new Date().toISOString().split('T')[0],
      dueDate: dueDate || undefined,
      notes: notes.trim() || undefined,
      isPaid: false
    };

    setFinanceData(prev => ({
      ...prev,
      proposedExpenses: [newProposedItem, ...(prev.proposedExpenses || [])]
    }));

    // Reset Form
    setDescription('');
    setAmount('');
    setDueDate('');
    setNotes('');
    setIsAddOpen(false);
    setSuccessMsg(`Added "${newProposedItem.description}" (${formatCurrency(amt, preferences)}) to Proposed Expenses To-Do list.`);

    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Open "Tap to Pay" Modal
  const openPayModal = (item: ProposedExpense) => {
    setPayingItem(item);
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayAccountId(accounts[0]?.id || '');
    setPayStore('');
    setPayGoalId('');
    setErrorMsg('');
  };

  // Confirm Payment ("Tap to Pay" Execution)
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingItem) return;

    setErrorMsg('');
    setSuccessMsg('');

    const targetAccount = accounts.find(a => a.id === payAccountId);
    if (!targetAccount) {
      setErrorMsg('Please select a valid account/card to charge.');
      return;
    }

    const amt = payingItem.amount;

    // 1. Update Account / Card Balances
    const updatedAccounts = accounts.map(a => {
      if (a.id === payAccountId) {
        if (a.type === 'bank') {
          return { ...a, balance: a.balance - amt }; // Bank balance decreases
        } else {
          return { ...a, balance: a.balance + amt }; // Credit card debt increases
        }
      }
      return a;
    });

    // 2. Update Saving Goals if linked
    const updatedGoals = payGoalId
      ? savingGoals.map(g => {
          if (g.id === payGoalId) {
            const newAmount = g.currentAmount + amt;
            let extraFields = {};
            if (g.goalType === 'fixed' && g.installmentAmount) {
              const newPaid = Math.floor(newAmount / g.installmentAmount);
              extraFields = {
                paidInstallments: Math.min(newPaid, g.totalInstallments || newPaid)
              };
            }
            return { ...g, currentAmount: newAmount, ...extraFields };
          }
          return g;
        })
      : savingGoals;

    // 3. Create actual Expense
    const newExpenseId = `exp-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    const newExpense: Expense = {
      id: newExpenseId,
      description: payingItem.description,
      amount: amt,
      category: payingItem.category,
      date: payDate,
      accountId: payAccountId,
      isRecurring: false,
      savingGoalId: payGoalId || undefined,
      store: payStore || undefined,
    };

    // 4. Create CC Transaction if card used
    let newCcTx = null;
    if (targetAccount.type === 'credit_card') {
      newCcTx = {
        id: `tx_${newExpenseId}`,
        cardId: payAccountId,
        type: 'purchase' as const,
        description: payingItem.description,
        amount: amt,
        date: payDate,
        category: payingItem.category,
      };
    }

    // 5. Update Proposed Expense item to isPaid: true
    const updatedProposedExpenses = (proposedExpenses || []).map(p => {
      if (p.id === payingItem.id) {
        return {
          ...p,
          isPaid: true,
          paidExpenseId: newExpenseId,
          paidAt: payDate,
          paidAccountId: payAccountId,
          paidStore: payStore || undefined
        };
      }
      return p;
    });

    // Save everything in financeData
    setFinanceData(prev => ({
      ...prev,
      accounts: updatedAccounts,
      savingGoals: updatedGoals,
      expenses: [newExpense, ...prev.expenses],
      ccTransactions: newCcTx ? [newCcTx, ...(prev.ccTransactions || [])] : prev.ccTransactions,
      proposedExpenses: updatedProposedExpenses
    }));

    setSuccessMsg(`Paid ${formatCurrency(amt, preferences)} for "${payingItem.description}" charged on ${targetAccount.name}. Logged as Expense!`);
    setPayingItem(null);

    setTimeout(() => setSuccessMsg(''), 5000);
  };

  // Open Edit Modal
  const openEditModal = (item: ProposedExpense) => {
    setEditingItem(item);
    setEditDescription(item.description);
    setEditAmount(item.amount.toString());
    setEditCategory(item.category);
    setEditDueDate(item.dueDate || '');
    setEditNotes(item.notes || '');
    setErrorMsg('');
  };

  // Confirm Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const amt = parseFloat(editAmount);
    if (!editDescription.trim() || isNaN(amt) || amt <= 0) {
      setErrorMsg('Please enter a valid description and positive amount.');
      return;
    }

    setFinanceData(prev => ({
      ...prev,
      proposedExpenses: (prev.proposedExpenses || []).map(p => {
        if (p.id === editingItem.id) {
          return {
            ...p,
            description: editDescription.trim(),
            amount: amt,
            category: editCategory,
            dueDate: editDueDate || undefined,
            notes: editNotes.trim() || undefined
          };
        }
        return p;
      })
    }));

    setEditingItem(null);
    setSuccessMsg('Proposed expense updated successfully.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Delete Proposed Expense
  const handleDeleteProposed = () => {
    if (!itemToDelete) return;

    setFinanceData(prev => ({
      ...prev,
      proposedExpenses: (prev.proposedExpenses || []).filter(p => p.id !== itemToDelete.id)
    }));

    setItemToDelete(null);
    setSuccessMsg('Item removed from Proposed Expenses To-Do list.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Filtered List
  const filteredList = useMemo(() => {
    return (proposedExpenses || []).filter(p => {
      // Status filter
      if (statusFilter === 'pending' && p.isPaid) return false;
      if (statusFilter === 'paid' && !p.isPaid) return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesDesc = p.description.toLowerCase().includes(term);
        const matchesCategory = p.category.toLowerCase().includes(term);
        const matchesNotes = p.notes?.toLowerCase().includes(term) || false;
        if (!matchesDesc && !matchesCategory && !matchesNotes) return false;
      }

      // Category filter
      if (categoryFilter !== 'All' && p.category !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [proposedExpenses, statusFilter, searchTerm, categoryFilter]);

  const categories = useMemo(() => {
    const defaultCats = [
      'Food & Dining',
      'Rent & Utilities',
      'Travel',
      'Shopping',
      'Entertainment',
      'Groceries',
      'Miscellaneous'
    ];
    const budgetCats = budgets.map(b => b.category);
    return Array.from(new Set([...defaultCats, ...budgetCats]));
  }, [budgets]);

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      
      {/* SECTION HEADER & REASSURANCE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#080d1a] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-500/30 shrink-0">
            <ListTodo className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-50 uppercase tracking-wide flex items-center gap-2">
              Proposed Expenses To-Do List
              <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-extrabold px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                Tap to Pay Queue
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Add proposed or future expenses here. Your bank & card balances stay untouched until you click <span className="font-extrabold text-indigo-600 dark:text-indigo-400">'Tap to Pay'</span> or <span className="font-extrabold text-indigo-600 dark:text-indigo-400">'Record Payment'</span>.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddOpen(!isAddOpen)}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition cursor-pointer shrink-0"
        >
          {isAddOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isAddOpen ? 'Close Form' : 'Add Proposed Expense'}
        </button>
      </div>

      {/* FEEDBACK NOTIFICATIONS */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-2xl text-xs font-bold flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 rounded-2xl text-xs font-bold flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="bg-white dark:bg-[#080d1a] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Pending Proposed Total</p>
            <p className="text-lg font-black font-mono text-indigo-600 dark:text-indigo-400 mt-1">
              <CurrencyValue value={stats.pendingTotal} />
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-bold">{stats.pendingCount} planned items pending</p>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
            <ListTodo className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#080d1a] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Completed / Paid Outgo</p>
            <p className="text-lg font-black font-mono text-emerald-500 mt-1">
              <CurrencyValue value={stats.paidTotal} />
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-bold">{stats.paidCount} items paid & logged</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#080d1a] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tap-to-Pay Mode</p>
            <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200 mt-1">
              Zero Impact Until Paid
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-bold">Safely queue future spends</p>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* ADD PROPOSED EXPENSE FORM */}
      <AnimatePresence>
        {isAddOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleAddProposedExpense} className="bg-white dark:bg-[#080d1a] p-6 rounded-3xl border border-indigo-500/30 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    Add New Proposed Expense
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                  No Payment Charged Yet
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                    Expense Title / Proposed Item <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Ergonomic Office Chair, Annual Car Insurance, Laptop Upgrade"
                    className="w-full bg-slate-50 dark:bg-[#0a0f24] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                    Proposed Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 12500"
                    className="w-full bg-slate-50 dark:bg-[#0a0f24] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0a0f24] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Date */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                    Target / Due Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0a0f24] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Notes */}
                <div className="md:col-span-3">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                    Notes / Justification (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Waiting for monsoon discount before buying"
                    className="w-full bg-slate-50 dark:bg-[#0a0f24] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-[10px] text-slate-400 font-medium">
                  💡 Payment channel & date will be asked only when you click <span className="font-bold text-slate-200">'Tap to Pay'</span>.
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-extrabold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md cursor-pointer"
                  >
                    Save to To-Do List
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SEARCH, FILTER & TAB CONTROLS */}
      <div className="bg-white dark:bg-[#080d1a] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        
        {/* Status Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800/80 w-full md:w-auto">
          <button
            onClick={() => setStatusFilter('pending')}
            className={`flex-1 md:flex-initial px-4 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 shadow-none'
            }`}
          >
            Pending To-Do ({stats.pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            className={`flex-1 md:flex-initial px-4 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
              statusFilter === 'paid'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 shadow-none'
            }`}
          >
            Completed / Paid ({stats.paidCount})
          </button>
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex-1 md:flex-initial px-4 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 shadow-none'
            }`}
          >
            All Items ({proposedExpenses.length})
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-grow sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search proposed items..."
              className="w-full bg-slate-50 dark:bg-[#0a0f24] border border-slate-200 dark:border-slate-800 pl-9 pr-3 py-1.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 dark:bg-[#0a0f24] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl text-xs font-extrabold focus:outline-none cursor-pointer"
          >
            <option value="All">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

      </div>

      {/* PROPOSED EXPENSES CARDS GRID */}
      {filteredList.length === 0 ? (
        <div className="bg-white dark:bg-[#080d1a] p-12 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto">
            <ListTodo className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            No Proposed Expenses Found
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {statusFilter === 'pending'
              ? 'You have no pending proposed expenses. Click "Add Proposed Expense" above to add items you plan to buy.'
              : 'No items match your current filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map((item) => {
            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition-all duration-200 relative flex flex-col justify-between ${
                  item.isPaid
                    ? 'bg-slate-50/50 dark:bg-[#060a16]/60 border-slate-200 dark:border-slate-850 opacity-80'
                    : 'bg-white dark:bg-[#080d1a] border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 shadow-xs'
                }`}
              >
                <div>
                  {/* Top Header Row */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.isPaid && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                          PAID & LOGGED
                        </span>
                      )}

                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {item.category}
                      </span>
                    </div>

                    {/* Actions Menu */}
                    <div className="flex items-center gap-1">
                      {!item.isPaid && (
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                          title="Edit proposed expense"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => setItemToDelete(item)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                        title="Delete item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Amount */}
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 line-clamp-2 mt-1">
                    {item.description}
                  </h3>

                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-xl font-black font-mono text-slate-900 dark:text-slate-50">
                      <CurrencyValue value={item.amount} />
                    </span>
                  </div>

                  {/* Notes if any */}
                  {item.notes && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium italic mt-2 bg-slate-50 dark:bg-[#0a0f24] p-2 rounded-xl border border-slate-150 dark:border-slate-850">
                      "{item.notes}"
                    </p>
                  )}

                  {/* Target Date / Paid Info */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-850/80 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {item.isPaid ? (
                          `Paid on ${item.paidAt}`
                        ) : item.dueDate ? (
                          `Target: ${item.dueDate}`
                        ) : (
                          `Added: ${item.createdAt}`
                        )}
                      </span>
                    </div>

                    {item.paidStore && (
                      <span className="text-[10px] text-indigo-400 font-extrabold flex items-center gap-1">
                        <ShoppingBag className="w-3 h-3" />
                        {item.paidStore}
                      </span>
                    )}
                  </div>
                </div>

                {/* BOTTOM ACTION BUTTON */}
                <div className="mt-4 pt-2">
                  {!item.isPaid ? (
                    <button
                      onClick={() => openPayModal(item)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md shadow-indigo-500/20 transition duration-200 cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4 animate-bounce" style={{ animationDuration: '2s' }} />
                      Tap to Pay / Record Payment
                    </button>
                  ) : (
                    <div className="w-full text-center py-2 px-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-500" />
                      Recorded in Expense Ledger
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* RECORD PAYMENT ("TAP TO PAY") MODAL */}
      <AnimatePresence>
        {payingItem && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-left"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                      Record Payment
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold">
                      Convert proposed item to active expense
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPayingItem(null)}
                  className="p-1 text-slate-400 hover:text-slate-200 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Summary Card */}
              <div className="bg-slate-50 dark:bg-[#0a0f24] p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Item Details</p>
                <p className="text-sm font-black text-slate-900 dark:text-slate-100 mt-0.5">{payingItem.description}</p>
                <p className="text-lg font-black font-mono text-indigo-500 mt-1">
                  <CurrencyValue value={payingItem.amount} />
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-700 dark:text-slate-300">
                    Category: {payingItem.category}
                  </span>
                </div>
              </div>

              <form onSubmit={handleRecordPayment} className="space-y-4">
                
                {/* Payment Date */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                    Payment Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0a0f24] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                {/* Charged On / Account */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                    Charged On / Payment Account <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={payAccountId}
                    onChange={(e) => setPayAccountId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0a0f24] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
                    required
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.type === 'bank' ? 'Bank' : 'Credit Card'}) — {formatCurrency(acc.balance, preferences)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Online Store / App */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                    Online Store / App (Optional)
                  </label>
                  <select
                    value={payStore}
                    onChange={(e) => setPayStore(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0a0f24] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">-- Direct / None --</option>
                    {currentStores.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Linked Saving Goal if any */}
                {savingGoals.length > 0 && (
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                      Link to Savings Goal Contribution (Optional)
                    </label>
                    <select
                      value={payGoalId}
                      onChange={(e) => setPayGoalId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0a0f24] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="">-- Not linked to goal --</option>
                      {savingGoals.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPayingItem(null)}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-extrabold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    Confirm & Record Payment
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT MODAL */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-left"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Edit Proposed Expense
                </h3>
                <button onClick={() => setEditingItem(null)} className="p-1 text-slate-400 hover:text-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Title</label>
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0a0f24] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0a0f24] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0a0f24] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Target Date</label>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0a0f24] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Notes</label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0a0f24] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-medium"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-extrabold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {itemToDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center"
            >
              <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Delete Proposed Item?
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  Are you sure you want to remove "{itemToDelete.description}" from your proposed expenses to-do list?
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setItemToDelete(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-extrabold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProposed}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
