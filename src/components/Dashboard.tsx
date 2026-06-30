/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FinanceData, Expense, SavingGoal } from '../types';
import { formatCurrency, formatCompactCurrency, formatMonthYear, getDaysRemaining } from '../utils/formatters';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Target, 
  TrendingUp, 
  ShieldAlert, 
  Settings, 
  CheckCircle, 
  Plus, 
  HelpCircle,
  CreditCard,
  Building,
  Coins,
  CalendarClock,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { motion } from 'motion/react';
import { useFinance } from '../context/FinanceContext';

interface DashboardProps {
  data: FinanceData;
  setFinanceData: React.Dispatch<React.SetStateAction<FinanceData>>;
  setCurrentTab: (tab: string) => void;
}

export default function Dashboard({ data, setFinanceData, setCurrentTab }: DashboardProps) {
  const { showToast } = useFinance();
  const { accounts, savingGoals, incomes, expenses, recurringSpends, budgets, preferences, investments = [] } = data;
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [breakdownType, setBreakdownType] = useState<'category' | 'account'>('category');
  const [quickSaveGoalId, setQuickSaveGoalId] = useState<string>('');
  const [quickSaveType, setQuickSaveType] = useState<'installment' | 'addon'>('installment');
  const [quickSaveAmount, setQuickSaveAmount] = useState<string>('');
  const [quickSaveAccId, setQuickSaveAccId] = useState<string>('');

  // Sync quick save contribution amount based on goal selections and contribution type
  const allocatedEmergency = preferences.emergencyAllocated || 0;
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
    } else {
      // Clear/no default for flexible
    }
  }, [quickSaveGoalId, quickSaveType, savingGoals]);

  // Expenditure Trend graph states
  const [trendDimension, setTrendDimension] = useState<'category' | 'credit_card' | 'bank'>('category');
  const [selectedSubFilter, setSelectedSubFilter] = useState<string>('All');

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

  // Financial calculations
  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalRecurring = recurringSpends
    .filter(rec => rec.isActive)
    .reduce((sum, rec) => sum + rec.amount, 0);

  // EMI Calculations
  const emis = data.emis || [];
  const ccEmis = data.ccEmis || [];

  const activeEmis = emis.filter(e => e.isActive);
  const activeCcEmis = ccEmis.filter(e => e.status === 'active');

  const standardEmiMonthlyBurden = activeEmis.reduce((sum, e) => sum + e.amount, 0);
  const ccEmiMonthlyBurden = activeCcEmis.reduce((sum, e) => {
    const nextUnpaid = e.installments.find(inst => inst.paidStatus === 'unpaid');
    return sum + (nextUnpaid ? nextUnpaid.totalInstallmentAmount : 0);
  }, 0);

  const totalActiveEmiMonthlyBurden = standardEmiMonthlyBurden + ccEmiMonthlyBurden;

  const standardFutureLiability = activeEmis.reduce((sum, e) => {
    const remaining = Math.max(0, e.totalTenure - e.installmentsPaid);
    return sum + (e.amount * remaining);
  }, 0);
  const ccFutureLiability = activeCcEmis.reduce((sum, e) => {
    const unpaid = e.installments.filter(inst => inst.paidStatus === 'unpaid');
    return sum + unpaid.reduce((total, inst) => total + inst.totalInstallmentAmount, 0);
  }, 0);

  const totalEmiFutureLiability = standardFutureLiability + ccFutureLiability;

  // Credit Card EMI vs Loan EMI ratio
  const ccEmiRatio = totalActiveEmiMonthlyBurden > 0 ? (ccEmiMonthlyBurden / totalActiveEmiMonthlyBurden) * 100 : 0;
  const loanEmiRatio = totalActiveEmiMonthlyBurden > 0 ? (standardEmiMonthlyBurden / totalActiveEmiMonthlyBurden) * 100 : 0;
  
  const totalOutflow = totalExpenses + totalRecurring + totalActiveEmiMonthlyBurden;
  const netMonthlyFlow = totalIncome - totalOutflow;

  // Spend by Category
  const categorySpends = budgets.map(b => {
    const amount = expenses
      .filter(e => e.category.toLowerCase() === b.category.toLowerCase())
      .reduce((sum, exp) => sum + exp.amount, 0) +
      recurringSpends
      .filter(r => r.isActive && r.category.toLowerCase() === b.category.toLowerCase())
      .reduce((sum, rec) => sum + rec.amount, 0);
    return {
      category: b.category,
      amount,
      limit: b.limit,
      pct: b.limit > 0 ? (amount / b.limit) * 100 : 0
    };
  });

  // Calculate percentage of categories for a pie chart
  const totalSpendForChart = categorySpends.reduce((sum, c) => sum + c.amount, 0);
  
  // Spend by Account / Card
  const accountSpends = accounts.map(acc => {
    const amount = expenses
      .filter(e => e.accountId === acc.id)
      .reduce((sum, exp) => sum + exp.amount, 0) +
      recurringSpends
      .filter(r => r.isActive && r.accountId === acc.id)
      .reduce((sum, rec) => sum + rec.amount, 0);
    return {
      ...acc,
      amount
    };
  });

  // Saving goals calculations
  const totalGoalTarget = savingGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalGoalCurrent = savingGoals.reduce((sum, g) => sum + g.currentAmount, 0);
  const averageGoalProgress = totalGoalTarget > 0 ? (totalGoalCurrent / totalGoalTarget) * 100 : 0;

  // Large Expenses
  const threshold = preferences.largeExpenseThreshold;
  const largeExpenses = expenses.filter(e => e.amount >= threshold);
  const totalLargeExpenses = largeExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalStandardExpenses = totalExpenses - totalLargeExpenses;

  // Emergency Shield and Bank Balance calculations
  const bankAccounts = accounts.filter(a => a.type === 'bank');
  const totalBankCash = bankAccounts.reduce((sum, a) => sum + a.balance, 0);
  const isReserveBreached = allocatedEmergency > 0 && totalBankCash < allocatedEmergency;
  const availableSpendingCash = Math.max(0, totalBankCash - allocatedEmergency);

  // Pie chart calculation helper
  let cumulativePercent = 0;
  const getCategoryColor = (categoryName: string, index: number): string => {
    const normalized = categoryName.trim().toLowerCase();
    
    // Static mapping for common categories to guarantee stable and highly distinct modern colors
    const staticMap: { [key: string]: string } = {
      'miscellaneous': '#6b7280', // Slate Gray (neutral catch-all)
      'other': '#6b7280',
      'misc': '#6b7280',
      'shopping': '#ec4899', // Vibrant Pink
      'electronics': '#0284c7', // Deep Sky Blue
      'electronics & gadgets': '#0284c7',
      'food': '#f97316', // Warm Orange
      'dining': '#f97316',
      'food & dining': '#f97316',
      'grocery': '#10b981', // Emerald Green
      'groceries': '#10b981',
      'house rent': '#2563eb', // Royal Blue
      'rent': '#2563eb',
      'rent & utilities': '#2563eb',
      'utilities': '#06b6d4', // Cyan
      'bills & utilities': '#06b6d4',
      'travel': '#8b5cf6', // Purple/Violet
      'transport': '#8b5cf6',
      'travel & transport': '#8b5cf6',
      'entertainment': '#d946ef', // Fuchsia
      'leisure': '#d946ef',
      'gold investment': '#eab308', // Gold Yellow
      'other investment': '#a855f7', // Medium Violet/Purple
      'investments': '#a855f7',
      'investment': '#a855f7',
      'healthcare': '#ef4444', // Red
      'medical': '#ef4444',
      'education': '#6366f1', // Indigo
      'savings': '#84cc16', // Lime Green
    };

    if (staticMap[normalized]) {
      return staticMap[normalized];
    }

    // Backup array of highly distinct, high-contrast colors for custom/unmapped categories
    const fallbackColors = [
      '#f43f5e', // Rose
      '#a855f7', // Purple
      '#059669', // Dark Emerald
      '#b45309', // Amber Brown
      '#0ea5e9', // Sky Blue
      '#be185d', // Deep Pink
      '#0369a1', // Dark Blue
      '#4d7c0f', // Olive Green
      '#7c3aed', // Deep Violet
      '#c026d3', // Dark Fuchsia
    ];

    return fallbackColors[index % fallbackColors.length];
  };

  const donutData = categorySpends
    .filter(c => c.amount > 0)
    .map((c, idx) => {
      const percentage = totalSpendForChart > 0 ? (c.amount / totalSpendForChart) * 100 : 0;
      const startPercent = cumulativePercent;
      cumulativePercent += percentage;
      
      return {
        ...c,
        percentage,
        startPercent,
        color: getCategoryColor(c.category, idx),
      };
    });

  // Quick savings transfer handler
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

    // Process Savings Increase and Account Balance decrease
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
      if (a.id === quickSaveAccId) {
        // Banks go down, credit cards used for savings would mean increased debt (unusual but possible)
        const diff = a.type === 'bank' ? -amt : amt;
        return { ...a, balance: a.balance + diff };
      }
      return a;
    });

    // Automatically log this as an expense under category "Saving Goals" if wanted, or simply adjust pools
    // Let's create an expense to model this out as a "Goal Investment" allocation
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

  const getFriendlyTypeLabel = (val: string) => {
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

  const standardCategories = preferences.investmentCategories || [
    'Mutual Funds',
    'Government Schemes',
    'Gold Investment',
    'Fixed Deposits',
    'Stocks & Equities',
    'Alternative Assets'
  ];

  const groupedInvestments = standardCategories.map(cat => {
    const total = investments
      .filter(inv => inv.type === cat || getFriendlyTypeLabel(inv.type).toLowerCase() === cat.toLowerCase())
      .reduce((sum, inv) => sum + inv.totalInvested, 0);
    return {
      category: cat,
      amount: total,
      pct: totalInvestmentsValuation > 0 ? (total / totalInvestmentsValuation) * 100 : 0
    };
  }).filter(item => item.amount > 0);

  // Export JSON Vault
  const handleExportJSON = () => {
    try {
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      const dateString = new Date().toISOString().split('T')[0];
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `paisaflow_backup_${dateString}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error('Failed to export JSON payload.', err);
    }
  };

  // Export Expenses Ledger to CSV
  const handleExportCSV = () => {
    try {
      const expensesList = data.expenses || [];
      if (expensesList.length === 0) {
        return;
      }
      const headers = ['ID', 'Date', 'Amount', 'Category', 'Description', 'Linked Account ID'];
      const rows = expensesList.map(exp => [
        exp.id || '',
        exp.date || '',
        exp.amount || 0,
        `"${(exp.category || '').replace(/"/g, '""')}"`,
        `"${(exp.description || '').replace(/"/g, '""')}"`,
        exp.accountId || ''
      ]);

      const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const downloadAnchor = document.createElement('a');
      const dateString = new Date().toISOString().split('T')[0];
      downloadAnchor.setAttribute('href', url);
      downloadAnchor.setAttribute('download', `paisaflow_expenses_${dateString}.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export CSV payload.', err);
    }
  };

  return (
    <div id="dashboard-root" className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <h1 id="dashboard-title" className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            📊 Monthly Financial Health Dashboard
          </h1>
          <p id="dashboard-subtitle" className="text-slate-400 text-xs mt-0.5 font-sans">
            Overview of June 2026 • Real-time tracking of budgets, credit limits, and custom targets
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-2.5 py-1 rounded-full border border-emerald-100/70 flex items-center gap-1.5 font-sans uppercase tracking-wider shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Auto-Subscriptions Tracked
          </span>
          <button 
            id="configure-threshold-btn"
            onClick={() => setCurrentTab('settings')}
            className="text-[10px] bg-white hover:bg-slate-50 text-slate-600 transition font-extrabold px-2.5 py-1 rounded-full border border-slate-200 flex items-center gap-1.5 cursor-pointer font-sans uppercase tracking-wider shadow-sm shrink-0"
          >
            <Settings className="w-3 h-3" />
            Limit: {formatCurrency(threshold, preferences)}
          </button>
          <button 
            onClick={handleExportJSON}
            className="text-[10px] bg-white dark:bg-slate-900 border border-indigo-150 dark:border-indigo-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1.5 cursor-pointer font-sans uppercase tracking-wider shadow-sm shrink-0"
            title="Download full capital ledger and settings backup in JSON format"
          >
            <Download className="w-3 h-3" />
            JSON Export
          </button>
          {expenses.length > 0 && (
            <button 
              onClick={handleExportCSV}
              className="text-[10px] bg-white dark:bg-slate-900 border border-emerald-150 dark:border-emerald-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1.5 cursor-pointer font-sans uppercase tracking-wider shadow-sm shrink-0"
              title="Download expenses ledger as standard Excel/CSV spreadsheet"
            >
              <FileSpreadsheet className="w-3 h-3" />
              CSV Ledger
            </button>
          )}
        </div>
      </div>

      {/* EMERGENCY RESERVE LOCK STATUS BANNER */}
      {allocatedEmergency > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-md font-sans transition-all duration-200 ${
            isReserveBreached 
              ? 'bg-rose-50 dark:bg-[#25121e] border-rose-250 dark:border-rose-500/40 text-rose-950 dark:text-rose-100' 
              : 'bg-indigo-50/80 dark:bg-[#131d36] border-indigo-150 dark:border-indigo-500/40 text-indigo-950 dark:text-indigo-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl shrink-0 ${
              isReserveBreached 
                ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300' 
                : 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300'
            }`}>
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md ${
                isReserveBreached 
                  ? 'bg-rose-100/90 dark:bg-rose-900/80 text-rose-850 dark:text-rose-200' 
                  : 'bg-indigo-100/90 dark:bg-indigo-900/80 text-indigo-850 dark:text-indigo-200'
              }`}>
                {isReserveBreached ? '⚠️ Core Shield Breached' : '🛡️ Emergency Fund Shield Secured'}
              </span>
              <p className="font-semibold mt-1">
                {isReserveBreached 
                  ? `Critical Notification: Added expenses have consumed checking assets. You are currently spending ${formatCurrency(allocatedEmergency - totalBankCash, preferences)} deep into your ${formatCurrency(allocatedEmergency, preferences)} emergency reserve allocation!`
                  : `Your emergency reserve of ${formatCurrency(allocatedEmergency, preferences)} is safely quarantined conceptually within your checking accounts. Safely spendable spending cash: ${formatCurrency(availableSpendingCash, preferences)}.`
                }
              </p>
            </div>
          </div>
          <button 
            onClick={() => setCurrentTab('emergency')}
            className={`px-3 py-1.5 rounded-lg font-bold text-[11px] border cursor-pointer hover:shadow-xs transition shrink-0 ${
              isReserveBreached 
                ? 'bg-rose-600 dark:bg-rose-600 border-rose-600 dark:border-rose-500/30 text-white hover:bg-rose-750 dark:hover:bg-rose-550' 
                : 'bg-white dark:bg-indigo-600 border-indigo-200 dark:border-indigo-500 text-indigo-700 dark:text-white hover:bg-indigo-50 dark:hover:bg-indigo-500'
            }`}
          >
            Adjust Shield Reserves &rarr;
          </button>
        </motion.div>
      )}

      {/* CORE FINANCIAL SCORECARDS - NEW HIGH-DENSITY, ULTRA-SLEEK COMPACT CARDS */}
      <div id="financial-kpi-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* KPI: TOTAL INFLOW */}
        <motion.div 
          whileHover={{ y: -2, scale: 1.01 }}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between transition-all duration-200 relative overflow-hidden group min-h-[142px]"
        >
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-wider font-sans">
              +{incomes.length} Sources
            </span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:scale-110 transition-transform duration-200 shrink-0">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Monthly Income</h3>
            <p className="text-lg md:text-xl lg:text-2xl font-black text-slate-900 mt-1 font-mono tracking-tight leading-none">{formatCurrency(totalIncome, preferences)}</p>
            <p className="text-[10px] text-slate-450 font-medium mt-1 truncate">Active cash inflow</p>
          </div>
        </motion.div>

        {/* KPI: TOTAL OUTFLOW */}
        <motion.div 
          whileHover={{ y: -2, scale: 1.01 }}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between transition-all duration-200 relative overflow-hidden group min-h-[142px]"
        >
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[9px] font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md uppercase tracking-wider font-sans">
              {recurringSpends.filter(r => r.isActive).length} Active Subs
            </span>
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg group-hover:scale-110 transition-transform duration-200 shrink-0">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Monthly Outflow</h3>
            <p className="text-lg md:text-xl lg:text-2xl font-black text-slate-900 mt-1 font-mono tracking-tight leading-none">{formatCurrency(totalOutflow, preferences)}</p>
            <p className="text-[10px] text-slate-450 font-medium mt-1 truncate">
              Ledger: <span className="text-slate-500 font-mono font-semibold">{formatCurrency(totalExpenses, preferences)}</span>
            </p>
          </div>
        </motion.div>

        {/* KPI: NET FINANCIAL HEALTH */}
        <motion.div 
          whileHover={{ y: -2, scale: 1.01 }}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between transition-all duration-200 relative overflow-hidden group min-h-[142px]"
        >
          <div className="flex items-center justify-between gap-1.5">
            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider font-sans ${
              netMonthlyFlow >= 50000 ? 'bg-teal-50 text-teal-700' : 
              netMonthlyFlow >= 10000 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {netMonthlyFlow > 0 ? 'Surplus' : 'Deficit'}
            </span>
            <div className={`p-1.5 rounded-lg group-hover:scale-110 transition-transform duration-200 shrink-0 ${netMonthlyFlow >= 0 ? 'bg-teal-50 text-teal-600' : 'bg-red-50 text-red-600'}`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider font-sans">Net Cash Flow</h3>
            <p className={`text-lg md:text-xl lg:text-2xl font-black mt-1 font-mono tracking-tight leading-none ${netMonthlyFlow >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
              {formatCurrency(netMonthlyFlow, preferences)}
            </p>
            <p className="text-[10px] text-slate-450 font-medium mt-1 truncate">
              {netMonthlyFlow >= 0 ? 'Runway is secured' : 'Spending exceeds pay!'}
            </p>
          </div>
        </motion.div>

        {/* KPI: SAVINGS GOAL RATE */}
        <motion.div 
          whileHover={{ y: -2, scale: 1.01 }}
          onClick={() => setCurrentTab('savings')}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between transition-all duration-200 relative overflow-hidden cursor-pointer group min-h-[142px]"
        >
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-wider font-sans">
              {savingGoals.length} Targets
            </span>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg group-hover:scale-110 transition-transform duration-200 shrink-0">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Goals Progress</h3>
            <p className="text-lg md:text-xl lg:text-2xl font-black text-slate-900 mt-1 font-mono tracking-tight leading-none">{averageGoalProgress.toFixed(1)}%</p>
            {/* Miniature progress line */}
            <div className="w-full bg-slate-100 rounded-full h-1 mt-2.5 overflow-hidden">
              <div 
                className="bg-indigo-600 h-1 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, averageGoalProgress)}%` }}
              ></div>
            </div>
          </div>
        </motion.div>

        {/* KPI: INVESTMENTS PORTFOLIO */}
        <motion.div 
          whileHover={{ y: -2, scale: 1.01 }}
          onClick={() => setCurrentTab('investments')}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between transition-all duration-200 relative overflow-hidden cursor-pointer group text-left min-h-[142px]"
        >
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[9px] font-extrabold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md uppercase tracking-wider font-sans">
              {investments.length} Assets
            </span>
            <div className="p-1.5 bg-violet-50 text-violet-600 rounded-lg group-hover:scale-110 transition-transform duration-200 shrink-0">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Asset Wealth</h3>
            <p className="text-lg md:text-xl lg:text-2xl font-black text-slate-900 mt-1 font-mono tracking-tight leading-none">{formatCurrency(totalInvestmentsValuation, preferences)}</p>
            <p className="text-[10px] text-slate-450 font-medium mt-1 truncate">
              SIP: <strong className="text-slate-500 font-mono font-bold">{formatCurrency(totalMonthlySIPCommitment, preferences)}</strong>
            </p>
          </div>
        </motion.div>

        {/* KPI: EMI BURDEN */}
        <motion.div 
          whileHover={{ y: -2, scale: 1.01 }}
          onClick={() => setCurrentTab('emis')}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between transition-all duration-200 relative overflow-hidden cursor-pointer group text-left min-h-[142px]"
        >
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-wider font-sans">
              {activeEmis.length + activeCcEmis.length} Active EMIs
            </span>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg group-hover:scale-110 transition-transform duration-205 shrink-0">
              <CalendarClock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">EMI Burden</h3>
            <p className="text-lg md:text-xl lg:text-2xl font-black text-slate-900 mt-1 font-mono tracking-tight leading-none">{formatCurrency(totalActiveEmiMonthlyBurden, preferences)}</p>
            <p className="text-[9.5px] text-slate-450 font-medium mt-1 truncate">
              O/S: <strong className="text-slate-500 font-mono font-bold">{formatCurrency(totalEmiFutureLiability, preferences)}</strong>
            </p>
            {totalActiveEmiMonthlyBurden > 0 ? (
              <p className="text-[8.5px] text-indigo-600 font-extrabold tracking-wide uppercase mt-1 leading-none">
                Ratio: {loanEmiRatio.toFixed(0)}% Loan • {ccEmiRatio.toFixed(0)}% CC
              </p>
            ) : (
              <p className="text-[8.5px] text-slate-400 font-bold uppercase mt-1 leading-none">
                No active schedules
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* DYNAMIC EXPENDITURE TREND CURVE VISUALIZER */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500 animate-pulse" />
              Dynamic Expenditure Trend Curve
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select any core segment parameter to visualize direct chronological cash flows.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Dimension Selection */}
            <div className="flex bg-slate-50/50 dark:bg-slate-950/20 p-1 rounded-lg border border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setTrendDimension('category');
                  setSelectedSubFilter('All');
                }}
                className={`text-[10px] font-bold px-2.5 py-1.5 rounded-md transition duration-200 ${trendDimension === 'category' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
              >
                Category
              </button>
              <button
                type="button"
                onClick={() => {
                  setTrendDimension('credit_card');
                  setSelectedSubFilter('All');
                }}
                className={`text-[10px] font-bold px-2.5 py-1.5 rounded-md transition duration-200 ${trendDimension === 'credit_card' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
              >
                Credit Card
              </button>
              <button
                type="button"
                onClick={() => {
                  setTrendDimension('bank');
                  setSelectedSubFilter('All');
                }}
                className={`text-[10px] font-bold px-2.5 py-1.5 rounded-md transition duration-200 ${trendDimension === 'bank' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
              >
                Bank Account
              </button>
            </div>

            {/* Sub Filter Selection */}
            <select
              value={selectedSubFilter}
              onChange={(e) => setSelectedSubFilter(e.target.value)}
              className="text-[10px] font-bold border border-slate-200 rounded-lg p-1.5 bg-slate-50 text-slate-600 focus:outline-none"
            >
              {trendDimension === 'category' && (
                <>
                  <option value="All">All Categories</option>
                  {budgets.map(b => (
                    <option key={b.category} value={b.category}>{b.category}</option>
                  ))}
                </>
              )}
              {trendDimension === 'credit_card' && (
                <>
                  <option value="All">All Credit Cards</option>
                  {accounts.filter(a => a.type === 'credit_card').map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </>
              )}
              {trendDimension === 'bank' && (
                <>
                  <option value="All">All Bank Accounts</option>
                  {accounts.filter(a => a.type === 'bank').map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </>
              )}
            </select>
          </div>
        </div>

        {/* Recharts Curve Rendering */}
        <div className="mt-6 w-full h-[320px]">
          {(() => {
            const uniqueDates = Array.from(new Set(expenses.map(e => e.date))).sort();
            const baseDates = uniqueDates.length > 0 ? uniqueDates : [
              '2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05', 
              '2026-06-06', '2026-06-07', '2026-06-08', '2026-06-09', '2026-06-10'
            ];

            const trendChartData = baseDates.map(dateStr => {
              const matchingExpenses = expenses.filter(e => {
                if (e.date !== dateStr) return false;

                if (trendDimension === 'category') {
                  if (selectedSubFilter === 'All') return true;
                  return e.category.toLowerCase() === selectedSubFilter.toLowerCase();
                } else if (trendDimension === 'credit_card') {
                  const card = accounts.find(a => a.id === e.accountId);
                  if (!card || card.type !== 'credit_card') return false;
                  if (selectedSubFilter === 'All') return true;
                  return card.id === selectedSubFilter;
                } else { // bank
                  const bank = accounts.find(a => a.id === e.accountId);
                  if (!bank || bank.type !== 'bank') return false;
                  if (selectedSubFilter === 'All') return true;
                  return bank.id === selectedSubFilter;
                }
              });

              const sum = matchingExpenses.reduce((total, exp) => total + exp.amount, 0);

              let dateLabel = dateStr;
              try {
                const parts = dateStr.split('-');
                if (parts.length === 3) {
                  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                  const monthIdx = parseInt(parts[1], 10) - 1;
                  const dayNum = parseInt(parts[2], 10);
                  if (monthIdx >= 0 && monthIdx < 12) {
                    dateLabel = `${monthNames[monthIdx]} ${dayNum}`;
                  }
                }
              } catch (err) {}

              return {
                rawDate: dateStr,
                label: dateLabel,
                amount: sum,
              };
            });

            const allZero = trendChartData.every(item => item.amount === 0);

            if (allZero && expenses.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center h-full border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/10 dark:bg-slate-900/10 p-6">
                  <TrendingUp className="w-8 h-8 text-slate-300 dark:text-slate-650 animate-pulse" />
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-semibold">No transactions detected yet for the selected filter.</p>
                </div>
              );
            }

            return (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="label" 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                    className="font-semibold font-sans"
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    width={50}
                    tickFormatter={(v) => formatCompactCurrency(v, preferences)}
                  />
                  <Tooltip 
                    content={({ active, payload, label }: any) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 border border-slate-800 text-white p-3 rounded-xl shadow-lg text-xs font-sans">
                            <p className="font-bold text-slate-400">{label}</p>
                            <p className="text-sm font-black text-indigo-400 mt-1">
                              Daily spend: {formatCurrency(payload[0].value, preferences)}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#6366f1" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#trendGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            );
          })()}
        </div>
      </div>

      {/* MID-GRID: CHARTS & SPENDING BREAKDOWN */}
      <div id="spend-analytics-row" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* DONUT SPEND CHART */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Visual Spend Breakdown</h2>
              <div className="flex bg-slate-50/50 dark:bg-slate-950/20 p-1 rounded-lg border border-slate-100 dark:border-slate-800/80">
                <button
                  onClick={() => setBreakdownType('category')}
                  className={`text-xs px-2.5 py-1 rounded-md transition font-medium ${breakdownType === 'category' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  By Category
                </button>
                <button
                  onClick={() => setBreakdownType('account')}
                  className={`text-xs px-2.5 py-1 rounded-md transition font-medium ${breakdownType === 'account' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  By Card / Account
                </button>
              </div>
            </div>

            {breakdownType === 'category' ? (
              <div className="block sm:grid sm:grid-cols-12 gap-4 items-center mt-6">
                {/* DONUT SVG CHART */}
                <div className="col-span-5 flex justify-center py-4 sm:py-0 relative">
                  {totalSpendForChart === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-full w-48 h-48">
                      <HelpCircle className="w-8 h-8 text-slate-300 dark:text-slate-650" />
                      <span className="text-xs text-slate-400 dark:text-slate-500 text-center mt-2 font-medium">No expenses logged</span>
                    </div>
                  ) : (
                    <div className="relative w-48 h-48 flex items-center justify-center">
                      <svg width="100%" height="100%" viewBox="0 0 42 42" className="transform -rotate-90">
                        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="4"></circle>
                        {donutData.map((slice, idx) => {
                          const strokeDash = `${slice.percentage} ${100 - slice.percentage}`;
                          const strokeOffset = 100 - slice.startPercent;
                          return (
                            <circle
                              key={slice.category}
                              cx="21"
                              cy="21"
                              r="15.915"
                              fill="transparent"
                              stroke={slice.color}
                              strokeWidth="4.2"
                              strokeDasharray={strokeDash}
                              strokeDashoffset={strokeOffset}
                              onMouseEnter={() => setHoveredCategory(slice.category)}
                              onMouseLeave={() => setHoveredCategory(null)}
                              className="transition-all duration-300 hover:stroke-[5] cursor-pointer"
                            ></circle>
                          );
                        })}
                      </svg>
                      {/* DONUT CENTER TEXT */}
                      <div className="absolute flex flex-col items-center bg-white rounded-full p-2 text-center pointer-events-none">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          {hoveredCategory ? hoveredCategory : 'Total Spends'}
                        </span>
                        <span className="text-base font-bold text-slate-800">
                          {hoveredCategory 
                            ? formatCurrency(donutData.find(d => d.category === hoveredCategory)?.amount || 0, preferences)
                            : formatCurrency(totalSpendForChart, preferences)
                          }
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* DETAILED LEGEND */}
                <div className="col-span-7 space-y-2.5">
                  {donutData.map((slice) => (
                    <div 
                      key={slice.category}
                      onMouseEnter={() => setHoveredCategory(slice.category)}
                      onMouseLeave={() => setHoveredCategory(null)}
                      className={`flex justify-between items-center py-1 px-2 rounded-lg transition-colors ${hoveredCategory === slice.category ? 'bg-slate-50' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: slice.color }}></span>
                        <span className="text-sm text-slate-600 font-medium">{slice.category}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-slate-800 block">{formatCurrency(slice.amount, preferences)}</span>
                        <span className="text-[10px] text-slate-400 block font-semibold">{slice.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* ACCOUNT / CREDIT CARD BREAKDOWN VIZ */
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {accountSpends.map(acc => {
                    const icon = acc.type === 'bank' ? <Building className="w-4 h-4 text-slate-500" /> : <CreditCard className="w-4 h-4 text-slate-500" />;
                    return (
                      <div key={acc.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-1.5 min-w-0">
                            <span className="mt-0.5 shrink-0">{icon}</span>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                                {acc.institution}
                              </span>
                              <span className="text-xs font-bold text-slate-700 leading-tight truncate w-full">
                                {acc.name.includes(' - ') ? acc.name.split(' - ').slice(1).join(' - ') : acc.name}
                              </span>
                            </div>
                          </div>
                          <span 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: acc.color }}
                          ></span>
                        </div>
                        <div className="mt-3">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Spend this Month</span>
                          <span className="text-base font-bold text-slate-800">{formatCurrency(acc.amount, preferences)}</span>
                        </div>
                        <div className="mt-2 text-[10px] text-slate-500 flex justify-between">
                          <span>{acc.institution}</span>
                          <span>{acc.type === 'bank' ? 'Savings Bal' : 'Outstanding Bal'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Horizontal simple visual comparison */}
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Card Utilization Spend balance vs. Direct Bank Spends</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 flex overflow-hidden">
                    {accountSpends.map((acc, index) => {
                      const totalAccSpends = accountSpends.reduce((sum, a) => sum + a.amount, 0);
                      const width = totalAccSpends > 0 ? (acc.amount / totalAccSpends) * 100 : 0;
                      return (
                        <div 
                          key={acc.id}
                          className="h-full transition-all duration-300"
                          style={{ 
                            width: `${width}%`, 
                            backgroundColor: acc.color,
                          }}
                          title={`${acc.name}: ${formatCurrency(acc.amount, preferences)}`}
                        ></div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between text-xs text-slate-400">
            <span>Hover slices for exact segment values</span>
            <button 
              onClick={() => setCurrentTab('budgets')}
              className="text-emerald-600 hover:underline font-semibold"
            >
              Configure Budgets &rarr;
            </button>
          </div>
        </div>

        {/* LARGE EXPENSES COMPONENT */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl text-slate-800 dark:text-white border border-slate-200/60 dark:border-slate-800 shadow-xs dark:shadow-xl lg:col-span-5 flex flex-col justify-between overflow-hidden relative min-h-[380px]">
          {/* Subtle design gradient circles in background */}
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-indigo-600 rounded-full opacity-[0.06] dark:opacity-20 pointer-events-none"></div>
          <div className="absolute -left-12 -top-12 w-32 h-32 bg-indigo-500 rounded-full opacity-[0.04] dark:opacity-10 pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-white/10">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                Large Expense Tracker
              </h2>
              <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950 border border-indigo-150 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-200 px-2.5 py-1 rounded-lg font-mono font-extrabold tracking-wider">
                &ge; {formatCurrency(threshold, preferences)}
              </span>
            </div>

            {/* Threshold ratio display */}
            <div className="my-5 bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 rounded-2xl">
              <div className="flex justify-between text-xs font-semibold text-slate-550 dark:text-slate-300 mb-1.5">
                <span>Large Spends ratio ({largeExpenses.length} items)</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-300">{totalOutflow > 0 ? ((totalLargeExpenses / totalOutflow) * 100).toFixed(0) : 0}% of flow</span>
              </div>
              <div className="w-full bg-slate-200/80 dark:bg-slate-800 rounded-full h-2 flex overflow-hidden">
                <div 
                  className="bg-amber-500 dark:bg-amber-400 h-2 rounded-l-full" 
                  style={{ width: `${totalOutflow > 0 ? (totalLargeExpenses / totalOutflow) * 100 : 0}%` }}
                ></div>
                <div 
                  className="bg-emerald-500 dark:bg-emerald-400 h-2 rounded-r-full" 
                  style={{ width: `${totalOutflow > 0 ? (totalStandardExpenses / totalOutflow) * 100 : 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-2.5 text-[10px] font-bold">
                <span className="text-amber-600 dark:text-amber-300">{formatCurrency(totalLargeExpenses, preferences)} Large</span>
                <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(totalStandardExpenses, preferences)} Everyday</span>
              </div>
              <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-500/90 italic leading-snug">
                This bar compares high-value "Large" transactions (Amber) against routine "Everyday" expenses (Emerald) as a share of your total spend outflow.
              </p>
            </div>

            {/* Highlighting list of large expenses */}
            <div className="space-y-2 mt-4 max-h-[160px] overflow-y-auto pr-1">
              {largeExpenses.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
                  <CheckCircle className="w-8 h-8 text-emerald-500 dark:text-emerald-400 mx-auto" />
                  <p className="text-xs text-slate-500 dark:text-slate-300 mt-2">Zero worries! No transactions cross the threshold.</p>
                </div>
              ) : (
                largeExpenses.map((exp, index) => {
                  const connectedAccName = accounts.find(a => a.id === exp.accountId)?.name || 'Direct Transfer';
                  return (
                    <div 
                      key={`${exp.id}_${index}`}
                      className="p-3 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex items-center justify-between transition-colors hover:bg-slate-100 dark:hover:bg-white/10"
                    >
                      <div className="truncate pr-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-white block truncate">{exp.description}</span>
                        <span className="text-[10px] text-slate-505 dark:text-slate-300/80 font-medium block mt-0.5">{exp.category} • Paid with {connectedAccName}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white block">{formatCurrency(exp.amount, preferences)}</span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-400 font-bold block mt-0.5">{exp.date}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs text-slate-400 relative z-10">
            <span className="text-slate-500 dark:text-slate-300">Outflow category analysis is fully offline.</span>
            <button 
              onClick={() => setCurrentTab('transactions')}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline font-bold"
            >
              Update Trigger Limit &rarr;
            </button>
          </div>
        </div>

      </div>

      {/* BOTTOM-GRID: SAVINGS GOALS HUB & QUICK CONTRIBUTE */}
      <div id="savings-and-accounts-row" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ACTIVE SAVINGS TARGETS Progress Detail */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm lg:col-span-8">
          <div className="flex justify-between items-center pb-3 border-b border-slate-50 mb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-500" />
              Targeted Savings Milestones
            </h2>
            <button 
              onClick={() => setCurrentTab('savings')}
              className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline font-extrabold flex items-center gap-1 cursor-pointer transition"
            >
              <Plus className="w-3.5 h-3.5" /> Manage Savings Goals
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {savingGoals.map(goal => {
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
                <div key={goal.id} className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors bg-white flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg truncate max-w-[120px]" title={goal.category}>
                          {goal.category}
                        </span>
                        <span className="text-[8px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-slate-100 self-start">
                          {isFixed ? 'Fixed Installment Plan' : goal.goalType === 'investment' ? 'Investment Goal' : 'Flexible Savings Goal'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">{daysLeft} Days left</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 mt-2 truncate" title={goal.name}>{goal.name}</h3>
                    
                    {/* Progress details */}
                    <div className="flex justify-between items-end mt-4">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold leading-3">Saved</span>
                        <span className="text-xs font-bold text-slate-800">{formatCurrency(savedAmt, preferences)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-semibold leading-3">
                          {isFixed ? 'Installment' : 'Target'}
                        </span>
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {isFixed 
                            ? `${formatCurrency(goal.installmentAmount || 0, preferences)}/mo` 
                            : formatCurrency(targetAmt, preferences)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, progressPct)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-50 flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 font-semibold font-sans">
                      {isFixed 
                        ? `Paid ${goal.paidInstallments} of ${goal.totalInstallments} (${progressPct.toFixed(0)}%)` 
                        : `${progressPct.toFixed(0)}% Completion`}
                    </span>
                    <span className="text-indigo-600 font-bold">
                      {isFixed
                        ? (remaining > 0 ? `${goal.totalInstallments! - goal.paidInstallments!} left` : 'Completed 🎯')
                        : (remaining > 0 ? `Need ${formatCurrency(remaining, preferences)}` : 'Completed 🎯')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* QUICK ALLOCATION PANEL (Fund Savings directly from Bank cash) */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm lg:col-span-4 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-50">
              <TrendingUp className="w-4 h-4 text-teal-500" />
              Quick Savings Allocator
            </h2>
            <p className="text-xs text-slate-400 mt-1">Move cash immediately from your bank checking accounts to fund targets.</p>

            <form onSubmit={handleQuickSave} className="space-y-3 mt-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Select Saving Target</label>
                <select
                  value={quickSaveGoalId}
                  onChange={(e) => setQuickSaveGoalId(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="">-- Choose Target Goal --</option>
                  {savingGoals.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.name} (Goal: {formatCurrency(g.targetAmount, preferences)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Source Account</label>
                <select
                  value={quickSaveAccId}
                  onChange={(e) => setQuickSaveAccId(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
                >
                  <option value="">-- Choose Account --</option>
                  <optgroup label="Bank Accounts" className="font-semibold text-slate-700">
                    {accounts.filter(a => a.type === 'bank').map(a => (
                      <option key={a.id} value={a.id} className="font-normal text-slate-600">
                        {a.name} (Bal: {formatCurrency(a.balance, preferences)})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Credit Cards" className="font-semibold text-slate-700">
                    {accounts.filter(a => a.type === 'credit_card').map(a => {
                      const availableLimit = (a.limit || 0) - a.balance;
                      return (
                        <option key={a.id} value={a.id} className="font-normal text-slate-600">
                          {a.name} (Avail: {formatCurrency(availableLimit, preferences)})
                        </option>
                      );
                    })}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Amount to Transfer</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-xs text-slate-400 font-bold">{preferences.currencySymbol}</span>
                  <input
                    type="number"
                    value={quickSaveAmount}
                    onChange={(e) => setQuickSaveAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg p-2 pl-6 bg-white dark:bg-[#111c44]/40 focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg shadow-sm transition hover:shadow-md flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Commit Savings Fund
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* SECTION: INVESTMENT HOLDINGS & DISTRIBUTION */}
      <div id="dashboard-investments-row" className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm transition-all duration-300">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-50 mb-6 gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Coins className="w-5 h-5 text-indigo-500" />
              Wealth Asset Holdings & Distribution
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-sans">Comprehensive real-time weights and allocation breakdown of accumulated wealth.</p>
          </div>
          <button 
            onClick={() => setCurrentTab('investments')}
            className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline font-extrabold flex items-center gap-1 cursor-pointer transition shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Adjust Portfolio &rarr;
          </button>
        </div>

        {investments.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* List of active investments */}
            <div className="lg:col-span-7 space-y-3">
              <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Asset Investment Index</h3>
              <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2.5">
                {investments.map(inv => {
                  const pct = totalInvestmentsValuation > 0 ? (inv.totalInvested / totalInvestmentsValuation) * 100 : 0;
                  return (
                    <div key={inv.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100/70 hover:border-slate-200 transition-colors flex items-center justify-between text-xs font-sans">
                      <div>
                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 block w-fit mb-1">
                          {getFriendlyTypeLabel(inv.type)}
                        </span>
                        <h4 className="font-extrabold text-slate-700">{inv.name}</h4>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-slate-800 block font-mono">{formatCurrency(inv.totalInvested, preferences)}</span>
                        <span className="text-[10px] text-slate-400 block font-semibold">{pct.toFixed(1)}% Weight</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Categorized Allocation Weights */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Asset Class Allocation</h3>
              <div className="space-y-3.5">
                {groupedInvestments.map(group => (
                  <div key={group.category} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-extrabold text-slate-600">{group.category}</span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-bold text-slate-800">{formatCurrency(group.amount, preferences)}</span>
                        <span className="text-slate-400 text-[10px] font-semibold">({group.pct.toFixed(0)}%)</span>
                      </div>
                    </div>
                    {/* Linear weight bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${group.pct}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-50/50 dark:bg-slate-900/10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6">
            <Coins className="w-10 h-10 text-slate-300 dark:text-slate-650 mx-auto stroke-1" />
            <h4 className="text-slate-700 dark:text-slate-300 font-bold text-sm mt-3">No active assets registered</h4>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1.5 leading-relaxed max-w-sm mx-auto">Configure your holding assets inside the Portfolio tab to unlock automatic allocation metrics.</p>
          </div>
        )}
      </div>

    </div>
  );
}
