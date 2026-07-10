/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useCreditCards } from '../features/creditCards/useCreditCards';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatCompactCurrency } from '../utils/formatters';
import { UtilizationBar } from './finance/UtilizationBar';
import { CcTransaction, CreditCardEmiMaster } from '../types';
import { Card } from './shared/Card';
import { DataTable } from './shared/DataTable';
import { MetricCard } from './shared/MetricCard';
import { EmptyState } from './shared/EmptyState';
import ColorPicker from './ColorPicker';
import {
  CreditCard,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  FileText,
  DollarSign,
  Gift,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  RefreshCw,
  Wallet,
  Coins,
  ChevronRight,
  Info,
  CheckCircle2,
  X,
  Upload,
  AlertTriangle,
  FileSpreadsheet,
  Copy,
  Check,
  IndianRupee,
  Euro,
  PoundSterling,
  JapaneseYen,
  Eye,
  EyeOff,
  TrendingUp
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ComposedChart
} from 'recharts';

interface CreditCardSectionProps {
  data: any;
  setFinanceData: any;
  setCurrentTab: any;
}

const getCurrencyIcon = (symbol: string) => {
  switch (symbol) {
    case '₹':
      return IndianRupee;
    case '€':
      return Euro;
    case '£':
      return PoundSterling;
    case '¥':
      return JapaneseYen;
    case '$':
    default:
      return DollarSign;
  }
};

const getOrganicSpend = (card: any, monthIndex: number, year: number) => {
  return 0;
};

const getCardColor = (card: any, isDark?: boolean) => {
  let color = card.color;
  if (!color) {
    if (card.id === 'cc-1') color = '#f97316'; // Vivid orange
    else if (card.id === 'cc-2') color = '#3b82f6'; // Premium royal blue
    else color = '#8b5cf6'; // Default violet
  }
  if (isDark && typeof color === 'string') {
    const cleanHex = color.replace('#', '').trim();
    if (cleanHex.length === 6) {
      const r = parseInt(cleanHex.substring(0, 2), 16);
      const g = parseInt(cleanHex.substring(2, 4), 16);
      const b = parseInt(cleanHex.substring(4, 6), 16);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        if (brightness < 90) {
          return '#6366f1'; // Beautiful bright indigo-500
        }
      }
    } else if (cleanHex.length === 3) {
      const r = parseInt(cleanHex.substring(0, 1).repeat(2), 16);
      const g = parseInt(cleanHex.substring(1, 2).repeat(2), 16);
      const b = parseInt(cleanHex.substring(2, 3).repeat(2), 16);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        if (brightness < 90) {
          return '#6366f1';
        }
      }
    }
  }
  return color;
};

const getEmiColor = (emiId: string, idx: number) => {
  const colors = ['#eab308', '#a855f7', '#6366f1', '#ef4444', '#ec4899', '#06b6d4', '#3b82f6', '#10b981'];
  return colors[idx % colors.length];
};

export default function CreditCardSection({ data, setFinanceData, setCurrentTab }: CreditCardSectionProps) {
  const { budgets = [], preferences } = data;
  const {
    creditCards,
    ccTransactions,
    bankAccounts,
    addCreditCard,
    deleteCreditCard,
    addTransaction,
    deleteTransaction,
    getCardMetrics,
    getOverallMetrics,
  } = useCreditCards();

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'transactions' | 'trends' | 'emi'>('overview');
  const [selectedCardId, setSelectedCardId] = useState<string>(creditCards[0]?.id || '');
  
  // Intelligence & Trends States
  const [timeframe, setTimeframe] = useState<'6m' | '12m' | 'all'>('6m');
  const [hiddenCardIds, setHiddenCardIds] = useState<Set<string>>(new Set());
  const [hiddenEmiIds, setHiddenEmiIds] = useState<Set<string>>(new Set());
  const [showTotalOutgo, setShowTotalOutgo] = useState(true);
  const [showTotalEmiLine, setShowTotalEmiLine] = useState(true);
  const [trendTab, setTrendTab] = useState<'spends' | 'distribution' | 'utilization' | 'emi'>('spends');

  const [activeColorPickerCardId, setActiveColorPickerCardId] = useState<string | null>(null);

  const updateCardColor = (cardId: string, color: string) => {
    const updatedAccounts = data.accounts.map(acc => {
      if (acc.id === cardId) {
        return { ...acc, color };
      }
      return acc;
    });
    setFinanceData({
      ...data,
      accounts: updatedAccounts
    });
  };

  // Helpers for Trends visualizers
  const getCardOutstandingAmount = (card: any) => {
    const realUtil = getCardMetrics(card)?.utilized || 0;
    return card.balance || realUtil || 0;
  };

  const getEmiInstallmentForMonth = (emi: any, year: number, month: number) => {
    const inst = emi.installments?.find((ins: any) => {
      const d = new Date(ins.dueDate);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    if (inst) return inst.totalInstallmentAmount;
    
    const start = new Date(emi.startDate);
    const monthsDiff = (year - start.getFullYear()) * 12 + (month - start.getMonth());
    if (monthsDiff >= 0 && monthsDiff < emi.tenure) {
      return emi.installments?.[0]?.totalInstallmentAmount || (emi.financedAmount / emi.tenure) * 1.1;
    }
    return 0;
  };
  
  // Modals / Form states
  const [showAddCard, setShowAddCard] = useState(false);
  const [showAddTx, setShowAddTx] = useState(false);
  const [showImportSimulator, setShowImportSimulator] = useState(false);

  // New Card Form
  const [newCardName, setNewCardName] = useState('');
  const [newCardInstitution, setNewCardInstitution] = useState('');
  const [newCardLimit, setNewCardLimit] = useState<number | ''>('');
  const [newCardColor, setNewCardColor] = useState('#2563eb');
  const [newCardBillingDay, setNewCardBillingDay] = useState<number>(15);
  const [newCardDueDay, setNewCardDueDay] = useState<number>(5);
  const [newCardInitialBalance, setNewCardInitialBalance] = useState<number>(0);
  const [newCardIsMain, setNewCardIsMain] = useState(false);
  const [newCardLinkedGroupId, setNewCardLinkedGroupId] = useState('');

  // Helper to calculate dynamic preview values inside the form render block
  const getFormPreviewMetrics = (dayVal: number) => {
    const clampedDay = Math.min(31, Math.max(1, dayVal || 15));
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let billDate = new Date(today.getFullYear(), today.getMonth(), clampedDay, 0, 0, 0, 0);
    if (today.getDate() > clampedDay) {
      billDate = new Date(today.getFullYear(), today.getMonth() + 1, clampedDay, 0, 0, 0, 0);
    }

    const dueDate = new Date(billDate.getTime());
    dueDate.setDate(billDate.getDate() + 20);

    const periodEndDate = new Date(billDate.getTime());
    const periodStartDate = new Date(billDate.getTime());
    periodStartDate.setMonth(billDate.getMonth() - 1);
    periodStartDate.setDate(periodStartDate.getDate() + 1);

    const formatDateString = (date: Date) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = date.getDate();
      const suffix = (day: number) => {
        if (day > 3 && day < 21) return 'th';
        switch (day % 10) {
          case 1:  return "st";
          case 2:  return "nd";
          case 3:  return "rd";
          default: return "th";
        }
      };
      return `${day}${suffix(day)} ${months[date.getMonth()]}`;
    };

    return {
      periodStr: `${formatDateString(periodStartDate)} to ${formatDateString(periodEndDate)}`,
      nextStatementStr: formatDateString(billDate),
      nextDueStr: formatDateString(dueDate),
      computedDueDay: dueDate.getDate(),
    };
  };

  const formPreview = getFormPreviewMetrics(newCardBillingDay);

  // Keep newCardDueDay in sync with newCardBillingDay
  React.useEffect(() => {
    setNewCardDueDay(formPreview.computedDueDay);
  }, [newCardBillingDay, formPreview.computedDueDay]);

  // New Transaction Form
  const [txType, setTxType] = useState<'purchase' | 'refund' | 'emi_conversion' | 'bill_payment'>('purchase');
  const [txCardId, setTxCardId] = useState(creditCards[0]?.id || '');
  const [txDesc, setTxDesc] = useState('');
  const [txAmount, setTxAmount] = useState<number | ''>('');
  const [txCategory, setTxCategory] = useState(budgets[0]?.category || 'Shopping');
  const [txDate, setTxDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [payFromBankId, setPayFromBankId] = useState(bankAccounts[0]?.id || '');

  React.useEffect(() => {
    if (budgets.length > 0 && !budgets.some(b => b.category === txCategory)) {
      setTxCategory(budgets[0].category);
    }
  }, [budgets, txCategory]);

  // Edit Mode tracking for Credit Cards
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  const overall = getOverallMetrics();
  const selectedCard = creditCards.find(c => c.id === (selectedCardId || creditCards[0]?.id));
  const selectedCardMetrics = selectedCard ? getCardMetrics(selectedCard) : null;

  const openAddCardModal = () => {
    setEditingCardId(null);
    setNewCardName('');
    setNewCardInstitution('');
    setNewCardLimit('');
    setNewCardColor('#2563eb');
    setNewCardBillingDay(15);
    setNewCardDueDay(5);
    setNewCardInitialBalance(0);
    setNewCardIsMain(false);
    setNewCardLinkedGroupId('');
    setShowAddCard(true);
  };

  // Handler for adding or editing a card
  const handleAddCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const isMain = newCardIsMain;
    const linkedId = newCardLinkedGroupId || '';
    const masterLimit = (!isMain && linkedId)
      ? (creditCards.find(c => c.id === linkedId)?.limit || 0)
      : Number(newCardLimit || 0);

    if (!newCardName || !newCardInstitution) return;
    if (!isMain && !linkedId && !masterLimit) {
      // If standalone, we require a credit limit
      return;
    }

    if (editingCardId) {
      setFinanceData((prev: any) => ({
        ...prev,
        accounts: prev.accounts.map((a: any) => 
          a.id === editingCardId 
            ? {
                ...a,
                name: newCardName,
                institution: newCardInstitution,
                limit: masterLimit,
                color: newCardColor,
                billingCycleStartDay: newCardBillingDay,
                paymentDueDay: newCardDueDay,
                balance: Number(newCardInitialBalance),
                isMainCard: isMain,
                linkedGroupId: isMain ? '' : linkedId,
              }
            : a
        )
      }));
      setEditingCardId(null);
    } else {
      addCreditCard({
        name: newCardName,
        institution: newCardInstitution,
        limit: masterLimit,
        color: newCardColor,
        billingCycleStartDay: newCardBillingDay,
        paymentDueDay: newCardDueDay,
        initialBalance: newCardInitialBalance,
        isMainCard: isMain,
        linkedGroupId: isMain ? '' : linkedId,
      });
    }

    // Reset fields
    setNewCardName('');
    setNewCardInstitution('');
    setNewCardLimit('');
    setNewCardBillingDay(15);
    setNewCardDueDay(5);
    setNewCardInitialBalance(0);
    setNewCardIsMain(false);
    setNewCardLinkedGroupId('');
    setShowAddCard(false);
  };

  // Handler for adding a transaction
  const handleAddTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txCardId || !txDesc || !txAmount) return;

    const amt = Number(txAmount);

    addTransaction({
      cardId: txCardId,
      type: txType,
      description: txDesc,
      amount: amt,
      date: txDate,
      category: txCategory,
    }, txType === 'bill_payment' ? payFromBankId : undefined);

    // Reset fields
    setTxDesc('');
    setTxAmount('');
    setShowAddTx(false);
  };

  return (
    <div className="space-y-6">
      
      {/* MODULE HEADER AND QUICK METRICS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Credit Card Console
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Manage physical credit lines, monitor credit utilization, log EMI schedules, and audit secure transactions.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={openAddCardModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/15 hover:shadow-indigo-600/25 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New Card
          </button>
          <button
            onClick={() => {
              setTxCardId(selectedCardId || (creditCards[0]?.id || ''));
              setTxType('purchase');
              setShowAddTx(true);
            }}
            disabled={creditCards.length === 0}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Log Transaction
          </button>
        </div>
      </div>

      {/* SUB-TAB NAVIGATOR */}
      <div className="flex border-b border-slate-100 dark:border-slate-850 gap-2 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`pb-3 px-4 font-black text-xs uppercase tracking-wider relative transition-colors cursor-pointer ${
            activeSubTab === 'overview'
              ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          Cards Overview
        </button>
        <button
          onClick={() => setActiveSubTab('transactions')}
          className={`pb-3 px-4 font-black text-xs uppercase tracking-wider relative transition-colors cursor-pointer ${
            activeSubTab === 'transactions'
              ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          Transaction Ledger ({ccTransactions.length})
        </button>
        <button
          onClick={() => setActiveSubTab('trends')}
          className={`pb-3 px-4 font-black text-xs uppercase tracking-wider relative transition-colors cursor-pointer ${
            activeSubTab === 'trends'
              ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          Intelligence & Trends
        </button>
        <button
          onClick={() => setActiveSubTab('emi')}
          className={`pb-3 px-4 font-black text-xs uppercase tracking-wider relative transition-colors cursor-pointer ${
            activeSubTab === 'emi'
              ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          Smart EMI Triggers
        </button>
      </div>

      {creditCards.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No Credit Cards Linked"
          description="You haven't declared any physical credit card accounts yet in your current financial model space."
          actionLabel="Add First Credit Card"
          onAction={openAddCardModal}
        />
      ) : (
        <>
          {/* OVERVIEW SUB-TAB */}
          {activeSubTab === 'overview' && (
            <div className="space-y-6">
              
              {/* DASHBOARD INTEGRATED GAUGES AND HUD */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="md:col-span-1 bg-white dark:bg-[#0b1329] border border-slate-100 dark:border-slate-800/80 p-5 rounded-3xl flex flex-col justify-between shadow-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest block mb-1">
                      Aggregated Credit Usage
                    </span>
                    <span className="text-xl md:text-2xl font-black font-mono text-slate-800 dark:text-slate-100">
                      {formatCurrency(overall.totalUtilized, data.preferences)}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-semibold mt-1">
                      out of {formatCurrency(overall.totalLimit, data.preferences)} Limit
                    </span>
                  </div>

                  <div className="mt-4">
                    <UtilizationBar
                      value={overall.totalUtilized}
                      limit={overall.totalLimit}
                      warningThreshold={30}
                      dangerThreshold={40}
                      showLabels={true}
                    />
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">Status:</span>
                      <div 
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider select-none cursor-help relative group transition-all border ${
                          overall.overallPercent > 40
                            ? 'bg-rose-50/80 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30'
                            : overall.overallPercent > 30
                            ? 'bg-amber-50/80 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30'
                            : 'bg-emerald-50/80 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
                        }`}
                        title={overall.overallPercent > 30 
                          ? "Higher than 30% utilization can impact credit score dynamics."
                          : "Healthy credit score utilization levels maintained."}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse ${
                          overall.overallPercent > 40
                            ? 'bg-rose-500'
                            : overall.overallPercent > 30
                            ? 'bg-amber-400'
                            : 'bg-emerald-500'
                        }`} />
                        {overall.overallPercent > 40 ? 'Critical' : overall.overallPercent > 30 ? 'Warning' : 'Healthy'}

                        {/* Hover Tooltip Overlay */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-slate-900/95 dark:bg-slate-950 text-white rounded-lg text-[9px] font-medium normal-case tracking-normal shadow-lg leading-snug border border-slate-800 dark:border-slate-700/50 z-55 text-center pointer-events-none transition-all">
                          {overall.overallPercent > 30 
                            ? "⚠️ Higher than 30% utilization can impact credit score dynamics."
                            : "👍 Healthy credit score utilization levels maintained."}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/95 dark:border-t-slate-950" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 md:col-span-3 gap-5">
                  <MetricCard
                    title="Total Credit Limit"
                    value={formatCurrency(overall.totalLimit, data.preferences, 0)}
                    icon={CreditCard}
                    subtext="Aggregated maximum credit allocation"
                    iconColorClassName="bg-indigo-50 border-indigo-150 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-900/40"
                  />
                  <MetricCard
                    title="Available Pool"
                    value={formatCurrency(overall.totalAvailable, data.preferences, 0)}
                    icon={Wallet}
                    subtext="Total idle limit minus all active card debt"
                    colorClassName="text-emerald-600 dark:text-emerald-450"
                    iconColorClassName="bg-emerald-50 border-emerald-150 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/40"
                  />
                  <MetricCard
                    title="Active Statement Dues"
                    value={formatCurrency(overall.totalStatementBalance, data.preferences, 0)}
                    icon={Coins}
                    subtext={`Unbilled EMIs: ${formatCurrency(overall.totalUnbilledEmiPrincipal, data.preferences, 0)} (Total ${creditCards.length} cards)`}
                    colorClassName="text-indigo-600 dark:text-indigo-400"
                    iconColorClassName="bg-amber-50 border-amber-150 text-amber-500 dark:bg-amber-950/20 dark:border-amber-900/40"
                  />
                </div>
              </div>

              {/* TWO PANEL INTERACTIVE SECTION */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* LEFT PANEL: SELECTABLE CARD STACK */}
                <div className="lg:col-span-5 space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest block">
                    Your Linked Credit Cards
                  </h3>

                  <div className="space-y-4">
                    {creditCards.map((card) => {
                      const metrics = getCardMetrics(card);
                      const isSelected = card.id === selectedCardId;
                      return (
                        <div
                          key={card.id}
                          onClick={() => setSelectedCardId(card.id)}
                          className={`relative p-5 rounded-3xl border transition duration-200 cursor-pointer overflow-hidden group select-none ${
                            isSelected
                              ? 'border-indigo-600 dark:border-indigo-400 bg-white dark:bg-[#0f1935] shadow-md ring-2 ring-indigo-500/10'
                              : 'border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#0b1329] hover:bg-slate-50/50 dark:hover:bg-[#0d162f]'
                          }`}
                        >
                          {/* Credit card design visual glow */}
                          <div
                            className="absolute -right-16 -top-16 w-32 h-32 rounded-full opacity-20 blur-2xl group-hover:scale-125 transition duration-500"
                            style={{ backgroundColor: card.color || '#4f46e5' }}
                          ></div>

                          <div className="flex items-start justify-between gap-4 relative z-10">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-slate-900/15"
                                style={{ backgroundColor: card.color || '#4f46e5' }}
                              >
                                {card.institution?.substring(0, 3).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 leading-tight">
                                  {card.name}
                                </h4>
                                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">
                                    {card.institution}
                                  </span>
                                  {card.isMainCard ? (
                                    <span className="text-[8px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-wider px-1.5 py-0.5 rounded">
                                      Master
                                    </span>
                                  ) : (card.linkedGroupId && card.linkedGroupId !== '') ? (
                                    <span className="text-[8px] bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-black uppercase tracking-wider px-1.5 py-0.5 rounded" title={`Shares limit with ${metrics.parentCardName}`}>
                                      Dependent
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Permanently drop ${card.name} credit card from your workspace pool? This will erase transactional logs.`)) {
                                  deleteCreditCard(card.id);
                                  setSelectedCardId('');
                                }
                              }}
                              className="p-1.5 text-slate-350 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition z-20"
                              title="Delete Card"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Limit display and Available Meter */}
                          <div className="mt-5 grid grid-cols-2 gap-4 relative z-10">
                            <div>
                              <span className="text-[8px] text-slate-400 uppercase font-black tracking-widest block leading-none mb-1">
                                Utilization
                              </span>
                              <span className="text-xs font-bold font-mono text-slate-700 dark:text-slate-200">
                                {formatCurrency(metrics.utilized, data.preferences)}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[8px] text-slate-400 uppercase font-black tracking-widest block leading-none mb-1">
                                Credit Limit
                              </span>
                              <span className="text-xs font-bold font-mono text-slate-700 dark:text-slate-200">
                                {formatCurrency(metrics.creditLimit, data.preferences)}
                              </span>
                            </div>
                          </div>

                          {/* Mini Progress Bar */}
                          <div className="mt-3 relative z-10">
                            <UtilizationBar
                              value={metrics.utilized}
                              limit={metrics.creditLimit}
                              warningThreshold={30}
                              dangerThreshold={75}
                              showLabels={false}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* RIGHT PANEL: SELECTED CARD DETAILED SPECS */}
                <div className="lg:col-span-7">
                  {selectedCard && selectedCardMetrics ? (
                    <Card
                      title={
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-black uppercase tracking-wider px-2 py-1 rounded-md">
                            Card Specs
                          </span>
                          <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                            {selectedCard.name}
                          </span>
                        </div>
                      }
                      subtitle={`${selectedCard.institution} credit facilities dossier`}
                      accent="violet"
                      extra={
                        <button
                          onClick={() => {
                            setEditingCardId(selectedCard.id);
                            setNewCardName(selectedCard.name);
                            setNewCardInstitution(selectedCard.institution || '');
                            setNewCardLimit(selectedCard.limit || 0);
                            setNewCardColor(selectedCard.color || '#2563eb');
                            setNewCardBillingDay(selectedCard.billingCycleStartDay || 15);
                            setNewCardDueDay(selectedCard.paymentDueDay || 5);
                            setNewCardInitialBalance(selectedCard.balance || 0);
                            setNewCardIsMain(!!selectedCard.isMainCard);
                            setNewCardLinkedGroupId(selectedCard.linkedGroupId || '');
                            setShowAddCard(true);
                          }}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
                        >
                          Edit Card Details
                        </button>
                      }
                    >
                      <div className="space-y-6">
                        {/* Physical styled card preview */}
                        <div
                          className="w-full p-6 sm:p-8 rounded-3xl text-white relative overflow-hidden shadow-xl shadow-slate-900/15 flex flex-col justify-between h-fit min-h-[220px] md:min-h-[240px] bg-gradient-to-br"
                          style={{
                            backgroundImage: `linear-gradient(135deg, ${selectedCard.color || '#4f46e5'} 0%, #1e1b4b 100%)`,
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-[10px] uppercase font-black tracking-widest text-white/60 leading-none">
                                Premium Credit Line
                              </p>
                              <h4 className="text-lg font-black tracking-tight mt-1">
                                {selectedCard.name}
                              </h4>
                            </div>
                            <div className="text-right">
                              <span className="text-base font-black italic opacity-80 tracking-widest font-mono block leading-none">
                                {selectedCard.institution?.toUpperCase()}
                              </span>
                              <span className="inline-block mt-1.5 px-2 py-0.5 bg-white/10 dark:bg-black/20 rounded text-[9px] font-black uppercase tracking-wider text-white/90">
                                Limit: {formatCurrency(selectedCardMetrics.creditLimit, data.preferences)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-end justify-between mt-4">
                            <div>
                              <p className="text-[8px] uppercase font-black tracking-wider text-white/50 leading-none mb-1">
                                Available Limit
                              </p>
                              <p className="text-xl md:text-2xl font-black font-mono">
                                {formatCurrency(selectedCardMetrics.available, data.preferences)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[8px] uppercase font-black tracking-wider text-white/50 leading-none mb-1">
                                Outstanding
                              </p>
                              <p className="text-base md:text-lg font-bold font-mono text-rose-300">
                                {formatCurrency(selectedCardMetrics.utilized, data.preferences)}
                              </p>
                            </div>
                          </div>

                          {/* Elegant billing details strip inside the card */}
                          <div className="mt-4 pt-3.5 border-t border-white/10 grid grid-cols-3 gap-2 text-[10px] text-white/80 font-medium">
                            <div>
                              <span className="text-[8px] text-white/50 uppercase font-black tracking-wider block leading-none mb-1">Billing Period</span>
                              <span className="font-mono text-[9px] truncate block leading-tight" title={selectedCardMetrics.billingCycle}>{selectedCardMetrics.billingCycle}</span>
                            </div>
                            <div className="text-center">
                              <span className="text-[8px] text-white/50 uppercase font-black tracking-wider block leading-none mb-1">Next Statement</span>
                              <span className="font-bold font-mono text-[10px] block leading-tight">{selectedCardMetrics.nextBillDateStr}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[8px] text-white/50 uppercase font-black tracking-wider block leading-none mb-1">Payment Due</span>
                              <span className="inline-block font-black text-amber-300 font-mono text-[10px] bg-white/10 px-1.5 py-0.5 rounded-sm leading-tight">
                                {selectedCardMetrics.nextDueDateStr}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* STATEMENT DUE VS UNBILLED EMI BREAKDOWN */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-3 bg-slate-50 dark:bg-slate-900/45 rounded-2xl border border-slate-100 dark:border-slate-800/80 text-center animate-fade-in">
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider block mb-1">Statement Due</span>
                            <span className="text-xs sm:text-sm font-extrabold text-indigo-600 dark:text-indigo-400 font-mono block">
                              {formatCurrency(selectedCardMetrics.statementBalance, data.preferences)}
                            </span>
                          </div>
                          <div className="p-3 bg-slate-50 dark:bg-slate-900/45 rounded-2xl border border-slate-100 dark:border-slate-800/80 text-center animate-fade-in">
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider block mb-1">Unbilled EMIs</span>
                            <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 font-mono block">
                              {formatCurrency(selectedCardMetrics.unbilledEmiPrincipal, data.preferences)}
                            </span>
                          </div>
                          <div className="p-3 bg-indigo-50/30 dark:bg-[#0f1935] rounded-2xl border border-indigo-100/55 dark:border-indigo-950/45 text-center animate-fade-in">
                            <span className="text-[9px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider block mb-1">Total Outstanding</span>
                            <span className="text-xs sm:text-sm font-black text-slate-850 dark:text-white font-mono block">
                              {formatCurrency(selectedCardMetrics.utilized, data.preferences)}
                            </span>
                          </div>
                        </div>

                        {/* Shared Limit Info Box */}
                        {selectedCardMetrics.isShared && (
                          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/65 border border-slate-100 dark:border-slate-800/80 text-slate-600 dark:text-slate-300 text-xs space-y-1.5 animate-fade-in">
                            <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-wider text-indigo-600 dark:text-indigo-400">
                              <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                              Shared Limit Network Active
                            </div>
                            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                              {selectedCardMetrics.isMainCard ? (
                                <>
                                  This is a <strong className="text-indigo-600 dark:text-indigo-400">Master Card</strong>. Its limit of <strong>{formatCurrency(selectedCardMetrics.creditLimit, data.preferences)}</strong> is shared across the linked dependent card network.
                                </>
                              ) : (
                                <>
                                  This is a <strong className="text-amber-600 dark:text-amber-400">Dependent Card</strong> sharing the credit limit pool of the Master Card <strong className="text-slate-700 dark:text-slate-200">{selectedCardMetrics.parentCardName}</strong>.
                                </>
                              )}
                            </p>
                            <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/40 grid grid-cols-2 gap-4 text-[11px]">
                              <div>
                                <span className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[9px] tracking-wider block">Network spending</span>
                                <span className="font-extrabold font-mono text-slate-700 dark:text-slate-300">
                                  {formatCurrency(selectedCardMetrics.groupUtilized, data.preferences)}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[9px] tracking-wider block">Network available</span>
                                <span className="font-black font-mono text-indigo-600 dark:text-indigo-400">
                                  {formatCurrency(selectedCardMetrics.groupAvailable, data.preferences)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Bill Payment Quick Action */}
                        {selectedCardMetrics.statementBalance > 0 ? (
                          <div className="p-4 rounded-2xl bg-indigo-600/5 dark:bg-indigo-400/5 border border-indigo-600/10 dark:border-indigo-400/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-indigo-600/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                                  Settle Current Statement Bill
                                </h4>
                                <p className="text-[10px] text-slate-450 dark:text-slate-400 font-bold mt-0.5">
                                  Your current statement billed balance of <strong>{formatCurrency(selectedCardMetrics.statementBalance, data.preferences)}</strong> is due. (Remaining unbilled EMI principal is {formatCurrency(selectedCardMetrics.unbilledEmiPrincipal, data.preferences)})
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setTxType('bill_payment');
                                setTxCardId(selectedCard.id);
                                setTxAmount(selectedCardMetrics.statementBalance);
                                setTxDesc(`Repayment of ${selectedCard.name} statement dues`);
                                if (bankAccounts.length > 0) {
                                  setPayFromBankId(bankAccounts[0].id);
                                }
                                setShowAddTx(true);
                              }}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm transition cursor-pointer flex items-center gap-1.5 shrink-0"
                            >
                              {React.createElement(getCurrencyIcon(data.preferences?.currencySymbol || '₹'), { className: "w-3.5 h-3.5" })}
                              Pay Statement Bill
                            </button>
                          </div>
                        ) : selectedCardMetrics.utilized > 0 ? (
                          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-550 flex items-center justify-center shrink-0">
                                <Info className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                  Statement Bill Settled
                                </h4>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">
                                  No current statement billing dues. Remaining card limit block of <strong>{formatCurrency(selectedCardMetrics.unbilledEmiPrincipal, data.preferences)}</strong> is deferred as future active EMIs.
                                </p>
                              </div>
                            </div>
                            <button
                              disabled
                              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-550 rounded-xl text-[10px] font-black uppercase tracking-wider border border-slate-250/50 dark:border-slate-700 select-none cursor-not-allowed shrink-0"
                            >
                              Dues Cleared
                            </button>
                          </div>
                        ) : null}

                        {/* Recent Transactions filter block */}
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                              Recent Transactions on Card
                            </h4>
                            <button
                              onClick={() => setActiveSubTab('transactions')}
                              className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                            >
                              View full ledger
                            </button>
                          </div>
                          
                          {ccTransactions.filter(t => t.cardId === selectedCard.id).length === 0 ? (
                            <p className="text-xs text-slate-400 py-3 text-center bg-slate-50 dark:bg-slate-900/20 rounded-xl border border-dashed border-slate-200/50">
                              No transactions recorded yet on this card.
                            </p>
                          ) : (
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                              {ccTransactions
                                .filter(t => t.cardId === selectedCard.id)
                                .slice(-3)
                                .reverse()
                                .map((t) => (
                                  <div
                                    key={t.id}
                                    className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-[#0c152d] flex justify-between items-center gap-3"
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${
                                        t.type === 'purchase'
                                          ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-500'
                                          : t.type === 'refund'
                                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500'
                                          : 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500'
                                      }`}>
                                        {t.type === 'purchase' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                      </div>
                                      <div>
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                          {t.description}
                                        </p>
                                        <p className="text-[9px] text-slate-400 font-bold">
                                          {t.date} • {t.type.replace('_', ' ').toUpperCase()}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <span className={`text-xs font-black font-mono block ${
                                        t.type === 'purchase' ? 'text-slate-800 dark:text-slate-100' : 'text-emerald-600 dark:text-emerald-400'
                                      }`}>
                                        {t.type === 'purchase' ? '' : '-'}{formatCurrency(t.amount, data.preferences)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>

                      </div>
                    </Card>
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      Select a credit card from the list to view specifications.
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* TRANSACTION LEDGER SUB-TAB */}
          {activeSubTab === 'transactions' && (
            <Card
              title="Global Credit Card Ledger"
              subtitle="Audited record of purchases, refunds, repayments, and conversions"
              extra={
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setTxCardId(selectedCardId || (creditCards[0]?.id || ''));
                      setTxType('purchase');
                      setShowAddTx(true);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md shadow-indigo-600/10 transition cursor-pointer"
                  >
                    Log transaction
                  </button>
                </div>
              }
            >
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter by card:</span>
                    <select
                      value={selectedCardId}
                      onChange={(e) => setSelectedCardId(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer text-slate-700 dark:text-slate-300"
                    >
                      <option value="">-- All Linked Cards -- ({ccTransactions.length})</option>
                      {creditCards.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({ccTransactions.filter(t => t.cardId === c.id).length})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                        <DataTable<CcTransaction>
                  columns={[
                    {
                      header: 'Date',
                      accessor: (item) => <span className="font-mono text-[10px] font-bold text-slate-500">{item.date}</span>,
                      sortValue: (item) => item.date,
                    },
                    {
                      header: 'Card Account',
                      accessor: (item) => {
                        const card = creditCards.find(c => c.id === item.cardId);
                        return (
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-md shrink-0 shadow-xs"
                              style={{ backgroundColor: card?.color || '#2563eb' }}
                            ></span>
                            <span className="font-bold text-slate-700 dark:text-slate-200 truncate max-w-xs block" title={card?.name || 'Unknown Card'}>
                              {card?.name || 'Unknown Card'}
                            </span>
                          </div>
                        );
                      }
                    },
                    {
                      header: 'Transaction Spec',
                      accessor: (item) => (
                        <div>
                          <span className="font-extrabold text-slate-800 dark:text-slate-100">{item.description}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`text-[8px] font-black px-1 rounded uppercase ${
                              item.type === 'purchase'
                                ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-500'
                                : item.type === 'refund'
                                ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500'
                                : item.type === 'bill_payment'
                                ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500'
                                : 'bg-amber-50 dark:bg-amber-950/20 text-amber-500'
                            }`}>
                              {item.type.replace('_', ' ')}
                            </span>
                            {item.category && (
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold">
                                • {item.category}
                              </span>
                            )}
                          </div>
                        </div>
                      ),
                    },

                    {
                      header: 'Amount',
                      accessor: (item) => (
                        <span className={`font-mono text-xs font-extrabold text-right block ${
                          item.type === 'purchase' ? 'text-slate-850 dark:text-slate-100' : 'text-emerald-600 dark:text-emerald-450'
                        }`}>
                          {item.type === 'purchase' ? '' : '-'}{formatCurrency(item.amount, data.preferences)}
                        </span>
                      ),
                      className: 'text-right',
                      sortValue: (item) => item.amount,
                    },
                    {
                      header: 'Audit Action',
                      accessor: (item) => (
                        <button
                          onClick={() => {
                            if (confirm('Permanently undo and delete this credit transaction? Card balances will auto-adjust.')) {
                              deleteTransaction(item.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition cursor-pointer"
                          title="Void Transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ),
                      className: 'text-center w-10'
                    }
                  ]}
                  data={ccTransactions.filter(t => !selectedCardId || t.cardId === selectedCardId)}
                  keyExtractor={(item, index) => `${item.id}_${index}`}
                  emptyComponent={
                    <EmptyState
                      icon={FileText}
                      title="No transactions logged"
                      description="No credit transactions correspond to the active filter set."
                      actionLabel="Log Credit Spend"
                      onAction={() => {
                        setTxCardId(selectedCardId || (creditCards[0]?.id || ''));
                        setTxType('purchase');
                        setShowAddTx(true);
                      }}
                    />
                  }
                />
              </div>
            </Card>
          )}

          {/* INTELLIGENCE & TRENDS SUB-TAB */}
          {activeSubTab === 'trends' && (
            <div className="space-y-6">
              
              {/* TOP HEADER BLOCK - MATCHING SCREENSHOT */}
              <div className="p-6 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/30 shadow-xs">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Financial Intelligence & Trends
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Analyze spending habits, limits utilization, and payoffs over time.
                    </p>
                  </div>
                </div>

                {/* Sub-Tabs Selector inside the container */}
                <div className="flex flex-wrap gap-1 bg-slate-100/80 dark:bg-slate-900/60 p-1 rounded-2xl border border-slate-200/40 dark:border-slate-800/60 shrink-0 self-start md:self-auto">
                  <button
                    onClick={() => setTrendTab('spends')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer ${
                      trendTab === 'spends'
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/10'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Monthly Spends
                  </button>
                  <button
                    onClick={() => setTrendTab('distribution')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer ${
                      trendTab === 'distribution'
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/10'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Card Distribution
                  </button>
                  <button
                    onClick={() => setTrendTab('utilization')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer ${
                      trendTab === 'utilization'
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/10'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Card Utilization
                  </button>
                  <button
                    onClick={() => setTrendTab('emi')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer ${
                      trendTab === 'emi'
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/10'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    EMI Payoffs
                  </button>
                </div>
              </div>

              {/* MAIN CONTENT GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                
                {/* LINE/AREA/BAR CHART CONTAINER CARD */}
                <div className="lg:col-span-3 bg-white dark:bg-[#0b1329] border border-slate-150 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between text-left">
                  
                  {/* TAB 1: MONTHLY SPENDS CHART */}
                  {trendTab === 'spends' && (
                    <div className="flex flex-col h-full justify-between">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                        <div>
                          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                            Trend Profile: Spends & Billed Outgo
                          </h3>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                            Tracks monthly aggregate credit line depletion (purchases + EMIs - refunds)
                          </p>
                        </div>

                        {/* Timeframe selector pill buttons */}
                        <div className="flex bg-slate-50 dark:bg-[#070c19] p-1 rounded-xl border border-slate-150 dark:border-slate-850 shrink-0">
                          {(['6m', '12m', 'all'] as const).map((t) => (
                            <button
                              key={t}
                              onClick={() => setTimeframe(t)}
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-black tracking-wide transition-all cursor-pointer ${
                                timeframe === t
                                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                              }`}
                            >
                              {t === '6m' ? '6 Months' : t === '12m' ? '12 Months' : 'All Time'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* RECHARTS COMPONENT STAGE */}
                      <div className="h-[380px] w-full text-slate-700 dark:text-slate-300">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={(() => {
                              const monthsCount = timeframe === '6m' ? 6 : timeframe === '12m' ? 12 : 24;
                              const list = [];
                              const today = new Date();
                              
                              for (let i = monthsCount - 1; i >= 0; i--) {
                                const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                                list.push({
                                  year: d.getFullYear(),
                                  month: d.getMonth(),
                                  label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }).replace(' ', "'"),
                                  key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
                                });
                              }

                              return list.map(m => {
                                const point: any = {
                                  month: m.label,
                                  rawMonth: m.key
                                };
                                
                                let totalOutgo = 0;
                                
                                creditCards.forEach(card => {
                                  // Get actual transactions in this month
                                  const txsInMonth = ccTransactions.filter(tx => {
                                    if (tx.cardId !== card.id) return false;
                                    const txDate = new Date(tx.date);
                                    return txDate.getFullYear() === m.year && txDate.getMonth() === m.month;
                                  });
                                  
                                  let spend = 0;
                                  if (txsInMonth.length > 0) {
                                    const actualSpends = txsInMonth
                                      .filter(t => t.type === 'purchase' || t.type === 'emi_conversion')
                                      .reduce((sum, t) => sum + t.amount, 0);
                                    const actualRefunds = txsInMonth
                                      .filter(t => t.type === 'refund')
                                      .reduce((sum, t) => sum + t.amount, 0);
                                    spend = Math.max(0, actualSpends - actualRefunds);
                                  } else {
                                    spend = getOrganicSpend(card, m.month, m.year);
                                  }
                                  
                                  point[card.id] = spend;
                                  
                                  if (!hiddenCardIds.has(card.id)) {
                                    totalOutgo += spend;
                                  }
                                });
                                
                                point['Total Monthly Outgo'] = totalOutgo;
                                return point;
                              });
                            })()}
                            margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
                          >
                            <defs>
                              {/* Total Monthly Outgo Gradient - Teal theme */}
                              <linearGradient id="totalOutgoGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                              </linearGradient>
                              
                              {/* Card Gradients */}
                              {creditCards.map(card => {
                                const color = getCardColor(card, data.preferences.theme === 'dark');
                                return (
                                  <linearGradient key={`grad-${card.id}`} id={`grad-${card.id}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={color} stopOpacity={0.18} />
                                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                                  </linearGradient>
                                );
                              })}
                            </defs>

                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={data.preferences.theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                            <XAxis 
                              dataKey="month" 
                              tick={{ fontSize: 9, fontWeight: 'bold', fill: data.preferences.theme === 'dark' ? '#64748b' : '#94a3b8' }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis 
                              tick={{ fontSize: 9, fontWeight: 'bold', fill: data.preferences.theme === 'dark' ? '#64748b' : '#94a3b8' }}
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(v) => formatCompactCurrency(v, preferences)}
                            />
                            <RechartsTooltip 
                              content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-slate-900 border border-slate-800 text-white p-4 rounded-2xl shadow-xl text-[11px] font-sans min-w-[210px] space-y-2 text-left">
                                      <p className="font-extrabold text-slate-400 border-b border-slate-800 pb-1.5 mb-1.5">{label}</p>
                                      <div className="space-y-1.5 font-mono">
                                        {payload.map((p: any, idx: number) => {
                                          if (p.value === undefined || p.value === null) return null;
                                          const isTotal = p.name === 'Total Monthly Outgo';
                                          return (
                                            <div key={idx} className="flex items-center justify-between gap-4">
                                              <div className="flex items-center gap-1.5">
                                                <span 
                                                  className="w-2.5 h-2.5 rounded-full shrink-0" 
                                                  style={{ backgroundColor: p.stroke || p.color }} 
                                                />
                                                <span className={`text-[10px] ${isTotal ? 'font-bold text-slate-100' : 'text-slate-350'}`}>
                                                  {p.name}
                                                </span>
                                              </div>
                                              <span className={`font-black text-[10px] ${isTotal ? 'text-teal-400' : 'text-white'}`}>
                                                {formatCurrency(p.value, data.preferences)}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            
                            {/* Outgo aggregate area */}
                            {showTotalOutgo && (
                              <Area
                                type="monotone"
                                dataKey="Total Monthly Outgo"
                                name="Total Monthly Outgo"
                                stroke="#14b8a6"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#totalOutgoGrad)"
                                dot={false}
                                activeDot={{ r: 6, strokeWidth: 1 }}
                              />
                            )}

                            {/* Individual Card areas */}
                            {creditCards.map(card => {
                              if (hiddenCardIds.has(card.id)) return null;
                              const color = getCardColor(card, data.preferences.theme === 'dark');
                              return (
                                <Area
                                  key={card.id}
                                  type="monotone"
                                  dataKey={card.id}
                                  name={card.name}
                                  stroke={color}
                                  strokeWidth={2}
                                  fillOpacity={1}
                                  fill={`url(#grad-${card.id})`}
                                  dot={false}
                                  activeDot={{ r: 5, strokeWidth: 1 }}
                                />
                              );
                            })}
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: CARD DISTRIBUTION DONUT CHART */}
                  {trendTab === 'distribution' && (
                    <div className="flex flex-col h-full justify-between">
                      <div className="mb-6">
                        <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                          Share Distribution Profile
                        </h3>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                          Displays proportional allocation of total active credit card outstanding liability
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center flex-1">
                        {/* Donut Chart Block */}
                        <div className="md:col-span-5 flex items-center justify-center relative min-h-[280px]">
                          <div className="absolute text-center flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[9px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">
                              TOTAL SHARE
                            </span>
                            <span className="text-xl md:text-2xl font-black font-mono text-slate-850 dark:text-white mt-1">
                              {(() => {
                                const total = creditCards
                                  .filter(c => !hiddenCardIds.has(c.id))
                                  .reduce((sum, c) => sum + getCardOutstandingAmount(c), 0);
                                return formatCurrency(total, data.preferences);
                              })()}
                            </span>
                          </div>

                          <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                              <Pie
                                data={(() => {
                                  const list = creditCards
                                    .filter(c => !hiddenCardIds.has(c.id))
                                    .map(c => ({
                                      id: c.id,
                                      name: c.name,
                                      value: getCardOutstandingAmount(c),
                                      color: getCardColor(c, data.preferences.theme === 'dark')
                                    }))
                                    .filter(item => item.value > 0);
                                  
                                  if (list.length === 0) {
                                    return [{ name: 'No outstanding dues', value: 1, color: '#475569' }];
                                  }
                                  return list;
                                })()}
                                cx="50%"
                                cy="50%"
                                innerRadius={75}
                                outerRadius={105}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {creditCards
                                  .filter(c => !hiddenCardIds.has(c.id))
                                  .map((c, idx) => {
                                    const val = getCardOutstandingAmount(c);
                                    if (val <= 0) return null;
                                    return <Cell key={`cell-${idx}`} fill={getCardColor(c, data.preferences.theme === 'dark')} />;
                                  })}
                              </Pie>
                              <RechartsTooltip
                                formatter={(val: any) => formatCurrency(val, data.preferences)}
                                contentStyle={{
                                  backgroundColor: '#0f172a',
                                  border: '1px solid #1e293b',
                                  borderRadius: '12px',
                                  color: '#fff',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        {/* List of Cards and shares */}
                        <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                          {(() => {
                            const visibleCards = creditCards.filter(c => !hiddenCardIds.has(c.id));
                            const totalVal = visibleCards.reduce((sum, c) => sum + getCardOutstandingAmount(c), 0);

                            return creditCards.map(card => {
                              const isVisible = !hiddenCardIds.has(card.id);
                              const val = getCardOutstandingAmount(card);
                              const pct = totalVal > 0 && isVisible ? ((val / totalVal) * 100).toFixed(1) : '0.0';
                              const color = getCardColor(card, data.preferences.theme === 'dark');

                              return (
                                <div
                                  key={card.id}
                                  className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between text-left ${
                                    isVisible
                                      ? 'bg-slate-50/50 dark:bg-[#070c19]/30 border-slate-100 dark:border-slate-850 shadow-xs'
                                      : 'border-transparent opacity-30 bg-transparent'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <span
                                      className="w-2.5 h-2.5 rounded-full shrink-0"
                                      style={{ backgroundColor: color }}
                                    />
                                    <h5 className="text-[11px] font-black text-slate-800 dark:text-slate-150 truncate max-w-[140px]">
                                      {card.name}
                                    </h5>
                                  </div>
                                  <div className="flex items-baseline justify-between gap-2">
                                    <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500">
                                      {pct}%
                                    </span>
                                    <span className="text-xs font-black font-mono text-slate-750 dark:text-white leading-none">
                                      {formatCurrency(val, data.preferences)}
                                    </span>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: CARD UTILIZATION GROUPED BAR CHART */}
                  {trendTab === 'utilization' && (
                    <div className="flex flex-col h-full justify-between">
                      <div className="mb-6">
                        <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                          Credit Limit vs Utilization
                        </h3>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                          Cross-compares actual outstanding balances and monthly peaks against total available credit limits
                        </p>
                      </div>

                      {/* Custom Legend */}
                      <div className="flex flex-wrap items-center justify-start gap-5 mb-6">
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full border border-slate-400 dark:border-slate-650 bg-transparent shrink-0" />
                          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Credit Limit</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-violet-500 shrink-0" />
                          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Current Spend</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-teal-500 shrink-0" />
                          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Max Monthly Spend</span>
                        </div>
                      </div>

                      {/* Recharts Bar Chart Container */}
                      <div className="h-[320px] w-full text-slate-700 dark:text-slate-300">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={creditCards
                              .filter(c => !hiddenCardIds.has(c.id))
                              .map(c => {
                                const metrics = getCardMetrics(c);
                                const limit = metrics.creditLimit || c.limit || 100000;
                                const current = getCardOutstandingAmount(c);
                                
                                const txs = ccTransactions.filter(t => t.cardId === c.id);
                                const monthlyTotals: Record<string, number> = {};
                                txs.forEach(t => {
                                  const d = new Date(t.date);
                                  const key = `${d.getFullYear()}-${d.getMonth()}`;
                                  monthlyTotals[key] = (monthlyTotals[key] || 0) + (t.type === 'purchase' || t.type === 'emi_conversion' ? t.amount : 0) - (t.type === 'refund' ? t.amount : 0);
                                });
                                const realMax = Object.values(monthlyTotals).length > 0 ? Math.max(...Object.values(monthlyTotals)) : 0;
                                
                                let maxSpend = realMax;

                                const cleanName = (c.name || '')
                                  .replace(/axis/gi, '')
                                  .replace(/icici/gi, '')
                                  .replace(/hdfc/gi, '')
                                  .replace(/sbi/gi, '')
                                  .replace(/bank/gi, '')
                                  .replace(/credit/gi, '')
                                  .replace(/card/gi, '')
                                  .trim();
                                const shortName = (cleanName || c.name || 'Card').toUpperCase();

                                return {
                                  name: shortName,
                                  limit,
                                  current,
                                  maxSpend
                                };
                              })}
                            margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={data.preferences.theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 9, fontWeight: 'bold', fill: data.preferences.theme === 'dark' ? '#64748b' : '#94a3b8' }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{ fontSize: 9, fontWeight: 'bold', fill: data.preferences.theme === 'dark' ? '#64748b' : '#94a3b8' }}
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(v) => formatCompactCurrency(v, preferences)}
                            />
                            <RechartsTooltip
                              cursor={{ fill: data.preferences.theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)' }}
                              formatter={(v: any, name: string) => [formatCurrency(v, data.preferences), name]}
                              contentStyle={{
                                backgroundColor: '#0f172a',
                                border: '1px solid #1e293b',
                                borderRadius: '12px',
                                color: '#fff',
                                fontSize: '11px',
                                fontWeight: 'bold',
                              }}
                            />
                            <Bar
                              dataKey="limit"
                              name="Credit Limit"
                              fill="transparent"
                              stroke={data.preferences.theme === 'dark' ? '#334155' : '#cbd5e1'}
                              strokeWidth={1.5}
                              radius={[6, 6, 0, 0]}
                              maxBarSize={32}
                            />
                            <Bar
                              dataKey="current"
                              name="Current Spend"
                              fill="#8b5cf6"
                              radius={[4, 4, 0, 0]}
                              maxBarSize={20}
                            />
                            <Bar
                              dataKey="maxSpend"
                              name="Max Monthly Spend"
                              fill="#10b981"
                              radius={[4, 4, 0, 0]}
                              maxBarSize={20}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: EMI PAYOFFS STACKED COMPOSITE CHART */}
                  {trendTab === 'emi' && (
                    <div className="flex flex-col h-full justify-between">
                      <div className="mb-6">
                        <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                          EMI Payoffs Timeline Forecast
                        </h3>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                          Simulated EMI forecast showing liabilities winding down (from active EMIs starting Jun'26):
                        </p>
                      </div>

                      {/* Interactive Legend for EMIs */}
                      <div className="flex flex-wrap items-center justify-start gap-4 mb-5 max-h-[75px] overflow-y-auto pr-2 custom-scrollbar">
                        {(() => {
                          const realActiveEmis = (data.ccEmis || [])
                            .filter((e: any) => e.status === 'active')
                            .map((e: any, idx: number) => {
                              return {
                                id: e.id,
                                name: e.expenseName,
                                color: getEmiColor(e.id, idx),
                                emiRef: e
                              };
                            });

                          return (
                            <>
                              {realActiveEmis.map(emi => {
                                const isVisible = !hiddenEmiIds.has(emi.id);
                                return (
                                  <div 
                                    key={emi.id} 
                                    onClick={() => {
                                      setHiddenEmiIds(prev => {
                                        const next = new Set(prev);
                                        if (next.has(emi.id)) {
                                          next.delete(emi.id);
                                        } else {
                                          next.add(emi.id);
                                        }
                                        return next;
                                      });
                                    }}
                                    className={`flex items-center gap-1.5 cursor-pointer select-none transition-all duration-150 ${
                                      isVisible ? 'opacity-100 hover:scale-102' : 'opacity-35 hover:opacity-50 line-through'
                                    }`}
                                  >
                                    <span className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: emi.color }} />
                                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate max-w-[140px]">{emi.name}</span>
                                  </div>
                                );
                              })}
                              {realActiveEmis.length > 0 && showTotalEmiLine && (
                                <div className="flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-rose-500 border border-white" />
                                  <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider">Total Liability</span>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>

                      {/* Composed Chart Stage */}
                      <div className="h-[320px] w-full text-slate-700 dark:text-slate-300 relative flex items-center justify-center">
                        {(() => {
                          const realActiveEmis = (data.ccEmis || [])
                            .filter((e: any) => e.status === 'active')
                            .map((e: any, idx: number) => {
                              return {
                                id: e.id,
                                name: e.expenseName,
                                color: getEmiColor(e.id, idx),
                                emiRef: e
                              };
                            });

                          if (realActiveEmis.length === 0) {
                            return (
                              <div className="text-center p-6 bg-slate-50/50 dark:bg-[#070c19]/30 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl max-w-md">
                                <span className="text-2xl mb-2 block">📊</span>
                                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                                  No Active Forecasts
                                </h4>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1 leading-relaxed">
                                  You have not entered any active EMIs. Set up credit card EMI installments in the sub-tabs below to project your future liability payments!
                                </p>
                              </div>
                            );
                          }

                          return (
                            <ResponsiveContainer width="100%" height="100%">
                              <ComposedChart
                                data={(() => {
                                  const emiTimelineMonths = [];
                                  const baseYear = 2026;
                                  const baseMonth = 5; // June (5 is June)
                                  for (let i = 0; i < 6; i++) {
                                    const d = new Date(baseYear, baseMonth + i, 1);
                                    emiTimelineMonths.push({
                                      year: d.getFullYear(),
                                      month: d.getMonth(),
                                      label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }).replace(' ', "'"),
                                      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
                                    });
                                  }

                                  return emiTimelineMonths.map((m, monthIdx) => {
                                    const label = m.label === "Sep'26" ? "Sept'26" : m.label;
                                    const item: any = { month: label };
                                    let totalLiability = 0;
                                    
                                    realActiveEmis.forEach(emi => {
                                      const isVisible = !hiddenEmiIds.has(emi.id);
                                      const amt = isVisible ? getEmiInstallmentForMonth(emi.emiRef, m.year, m.month) : 0;
                                      item[emi.id] = amt;
                                      totalLiability += amt;
                                    });
                                    
                                    item['Total Liability'] = totalLiability;
                                    return item;
                                  });
                                })()}
                                margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={data.preferences.theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                                <XAxis
                                  dataKey="month"
                                  tick={{ fontSize: 9, fontWeight: 'bold', fill: data.preferences.theme === 'dark' ? '#64748b' : '#94a3b8' }}
                                  axisLine={false}
                                  tickLine={false}
                                />
                                <YAxis
                                  tick={{ fontSize: 9, fontWeight: 'bold', fill: data.preferences.theme === 'dark' ? '#64748b' : '#94a3b8' }}
                                  axisLine={false}
                                  tickLine={false}
                                  tickFormatter={(v) => formatCompactCurrency(v, preferences)}
                                />
                                <RechartsTooltip
                                  cursor={{ fill: data.preferences.theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)' }}
                                  formatter={(v: any, name: string) => [formatCurrency(v, data.preferences), name]}
                                  contentStyle={{
                                    backgroundColor: '#0f172a',
                                    border: '1px solid #1e293b',
                                    borderRadius: '12px',
                                    color: '#fff',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                  }}
                                />
                                {realActiveEmis.map(emi => {
                                  if (hiddenEmiIds.has(emi.id)) return null;
                                  return (
                                    <Bar
                                      key={emi.id}
                                      dataKey={emi.id}
                                      name={emi.name}
                                      stackId="emiStack"
                                      fill={emi.color}
                                      maxBarSize={45}
                                    />
                                  );
                                })}
                                {showTotalEmiLine && (
                                  <Line
                                    type="monotone"
                                    dataKey="Total Liability"
                                    name="Total Liability"
                                    stroke="#f43f5e"
                                    strokeWidth={2.5}
                                    dot={{ r: 5, strokeWidth: 2, fill: '#f43f5e', stroke: '#fff' }}
                                    activeDot={{ r: 7, strokeWidth: 1 }}
                                  />
                                )}
                              </ComposedChart>
                            </ResponsiveContainer>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                </div>

                {/* VISIBLE DATA FILTERS COLUMN */}
                <div className="bg-slate-55/60 dark:bg-[#070c19]/50 border border-slate-150/80 dark:border-slate-800 p-5 rounded-3xl flex flex-col justify-between shadow-xs text-left">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
                      Visible Data Filters
                    </h4>
                    
                    {trendTab === 'emi' ? (
                      <div className="space-y-3">
                        {/* Toggle: Total Liability Trend */}
                        <div 
                          onClick={() => setShowTotalEmiLine(!showTotalEmiLine)}
                          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                            showTotalEmiLine 
                              ? 'bg-white dark:bg-[#0a0f24] border-rose-500/20 dark:border-rose-900/30 shadow-xs' 
                              : 'bg-slate-100/40 dark:bg-[#0b1329]/10 border-transparent opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
                            <div className="text-left">
                              <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                                Total Liability Line
                              </p>
                              <p className="text-[9px] font-medium text-slate-450 dark:text-slate-500">
                                Trend of overall EMI payoff
                              </p>
                            </div>
                          </div>
                          <button className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-350 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-slate-700 shadow-xs transition cursor-pointer shrink-0">
                            {showTotalEmiLine ? <Eye className="w-4 h-4 text-rose-500 dark:text-rose-400" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Scroll container for EMI list */}
                        <div className="max-h-[290px] overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
                          {(() => {
                            const activeEmis = (data.ccEmis || [])
                              .filter((e: any) => e.status === 'active');
                            
                            if (activeEmis.length === 0) {
                              return (
                                <p className="text-[10px] text-center py-4 text-slate-400 dark:text-slate-500 font-semibold">
                                  No Active EMIs found to filter
                                </p>
                              );
                            }

                            return activeEmis.map((emi: any, idx: number) => {
                              const isVisible = !hiddenEmiIds.has(emi.id);
                              const color = getEmiColor(emi.id, idx);
                              return (
                                <div 
                                  key={emi.id}
                                  onClick={() => {
                                    setHiddenEmiIds(prev => {
                                      const next = new Set(prev);
                                      if (next.has(emi.id)) {
                                        next.delete(emi.id);
                                      } else {
                                        next.add(emi.id);
                                      }
                                      return next;
                                    });
                                  }}
                                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                                    isVisible 
                                      ? 'bg-white dark:bg-[#0a0f24] border-slate-150/80 dark:border-slate-800 shadow-xs' 
                                      : 'bg-slate-100/40 dark:bg-[#0b1329]/10 border-transparent opacity-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span 
                                      className="w-3.5 h-3.5 rounded-full shrink-0 border border-slate-200/80 dark:border-slate-700 hover:scale-110 transition cursor-pointer"
                                      style={{ backgroundColor: color }}
                                    />
                                    <div className="text-left">
                                      <p className="text-xs font-black text-slate-850 dark:text-slate-200 line-clamp-1 max-w-[120px]">
                                        {emi.expenseName}
                                      </p>
                                      <p className="text-[9px] font-medium text-slate-450 dark:text-slate-500">
                                        Tenure: {emi.tenure}m | Financed: {formatCurrency(emi.financedAmount || 0, data.preferences)}
                                      </p>
                                    </div>
                                  </div>
                                  <button className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-350 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-700 shadow-xs transition cursor-pointer shrink-0">
                                    {isVisible ? <Eye className="w-4 h-4" style={{ color: color }} /> : <EyeOff className="w-4 h-4" />}
                                  </button>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        
                        {/* Toggle: Total Outgo */}
                        <div 
                          onClick={() => setShowTotalOutgo(!showTotalOutgo)}
                          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                            showTotalOutgo 
                              ? 'bg-white dark:bg-[#0a0f24] border-teal-500/20 dark:border-teal-900/30 shadow-xs' 
                              : 'bg-slate-100/40 dark:bg-[#0b1329]/10 border-transparent opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-3 h-3 rounded-full bg-teal-500 shrink-0" />
                            <div className="text-left">
                              <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                                Total Monthly Outgo
                              </p>
                              <p className="text-[9px] font-medium text-slate-450 dark:text-slate-500">
                                Aggregated active spends
                              </p>
                            </div>
                          </div>
                          <button className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-350 hover:text-teal-500 dark:hover:text-teal-400 hover:bg-slate-200 dark:hover:bg-slate-700 shadow-xs transition cursor-pointer shrink-0">
                            {showTotalOutgo ? <Eye className="w-4 h-4 text-teal-500 dark:text-teal-400" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Scroll container for card list */}
                        <div className="max-h-[290px] overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
                          {/* Toggle: Individual Cards */}
                          {creditCards.map(card => {
                            const isVisible = !hiddenCardIds.has(card.id);
                            const color = getCardColor(card, data.preferences.theme === 'dark');
                            return (
                              <div 
                                key={card.id}
                                onClick={() => {
                                  setHiddenCardIds(prev => {
                                    const next = new Set(prev);
                                    if (next.has(card.id)) {
                                      next.delete(card.id);
                                    } else {
                                      next.add(card.id);
                                    }
                                    return next;
                                  });
                                }}
                                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                                  isVisible 
                                    ? 'bg-white dark:bg-[#0a0f24] border-slate-150/80 dark:border-slate-800 shadow-xs' 
                                    : 'bg-slate-100/40 dark:bg-[#0b1329]/10 border-transparent opacity-50'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  {/* Color Dot with Color Picker Popover */}
                                  <div className="relative">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation(); // Prevent toggling card visibility
                                        setActiveColorPickerCardId(activeColorPickerCardId === card.id ? null : card.id);
                                      }}
                                      className="w-3.5 h-3.5 rounded-full shrink-0 border border-slate-200/80 dark:border-slate-700 hover:scale-110 transition cursor-pointer flex items-center justify-center relative group"
                                      style={{ backgroundColor: color }}
                                      title="Choose color"
                                    >
                                      <span className="sr-only">Choose color</span>
                                    </button>

                                    {activeColorPickerCardId === card.id && (
                                      <>
                                        {/* Click-away backdrop */}
                                        <div 
                                          className="fixed inset-0 z-40" 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveColorPickerCardId(null);
                                          }}
                                        />
                                        {/* Popover */}
                                        <div 
                                          className="absolute left-0 bottom-full mb-2 bg-slate-900 dark:bg-slate-950 border border-slate-800 p-2 rounded-xl shadow-2xl flex gap-1.5 z-55 animate-in fade-in slide-in-from-bottom-2 duration-150"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          {['#ef4444', '#f97316', '#f59e0b', '#10b981', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899'].map(c => (
                                            <button
                                              key={c}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                updateCardColor(card.id, c);
                                                setActiveColorPickerCardId(null);
                                              }}
                                              className={`w-4 h-4 rounded-full border border-white/20 transition hover:scale-125 cursor-pointer ${
                                                color === c ? 'ring-2 ring-indigo-500 ring-offset-1 ring-offset-slate-900' : ''
                                              }`}
                                              style={{ backgroundColor: c }}
                                            />
                                          ))}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                  <div className="text-left">
                                    <p className="text-xs font-black text-slate-850 dark:text-slate-200 line-clamp-1 max-w-[120px]">
                                      {card.name}
                                    </p>
                                    <p className="text-[9px] font-medium text-slate-450 dark:text-slate-500">
                                      Limit: {formatCurrency(card.limit || 0, data.preferences)}
                                    </p>
                                  </div>
                                </div>
                                <button className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-350 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-700 shadow-xs transition cursor-pointer shrink-0">
                                  {isVisible ? <Eye className="w-4 h-4" style={{ color: color }} /> : <EyeOff className="w-4 h-4" />}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-slate-150 dark:border-slate-800/50">
                    {trendTab === 'emi' ? (
                      (() => {
                        const activeEmis = (data.ccEmis || []).filter((e: any) => e.status === 'active');
                        const visibleCount = activeEmis.length - hiddenEmiIds.size;
                        return (
                          <>
                            <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-extrabold mb-1 uppercase tracking-wider">
                              <span>Forecast Scope</span>
                              <span>{visibleCount} / {activeEmis.length} Active</span>
                            </div>
                            <p className="text-[9px] font-medium text-slate-450 dark:text-slate-500 leading-relaxed">
                              Toggling visibility excludes individual EMIs from the monthly forecast stack, allowing you to instantly assess the financial impact of foreclosure.
                            </p>
                          </>
                        );
                      })()
                    ) : (
                      <>
                        <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-extrabold mb-1 uppercase tracking-wider">
                          <span>Console Scope</span>
                          <span>{creditCards.length - hiddenCardIds.size} / {creditCards.length} Visible</span>
                        </div>
                        <p className="text-[9px] font-medium text-slate-450 dark:text-slate-500 leading-relaxed">
                          Toggling visibility filters cards dynamically, auto-recalculating both individual profiles and the global outgo trendline.
                        </p>
                      </>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* SMART EMI TRIGGERS TAB */}
          {activeSubTab === 'emi' && (
            <div className="space-y-6">
              
              <div className="p-5 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 rounded-3xl">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/30">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Integrated EMI Facilities Panel
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold mt-1">
                      Manage low-interest or No-Cost EMI conversions directly from your active statement credit balances.
                      Converting large spends into systematic installments helps sustain your liquidity reserve levels.
                    </p>
                    <button
                      onClick={() => setCurrentTab('emis')}
                      className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      Navigate to full EMI schedules module
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Display existing CC EMIs */}
              <Card
                title="Active Credit Card EMIs"
                subtitle="Financed installment masters associated with linked cards"
              >
                <DataTable<CreditCardEmiMaster>
                  columns={[
                    {
                      header: 'Expense Item',
                      accessor: (item) => (
                        <div>
                          <span className="font-extrabold text-slate-800 dark:text-slate-100">{item.expenseName}</span>
                          <span className="text-[8px] bg-slate-100 dark:bg-slate-900 text-slate-500 font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm block w-max mt-1">
                            {item.emiType === 'no_cost' ? 'No-Cost EMI' : `Regular (${item.interestRate}% Int)`}
                          </span>
                        </div>
                      )
                    },
                    {
                      header: 'Card',
                      accessor: (item) => {
                        const card = creditCards.find(c => c.id === item.cardId);
                        return <span className="font-bold text-slate-700 dark:text-slate-300">{card?.name || 'Unknown card'}</span>;
                      }
                    },
                    {
                      header: 'Tenure Status',
                      accessor: (item) => (
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-slate-600 dark:text-slate-400">
                            {item.tenure} Months Tenure
                          </span>
                          <div className="w-24 bg-slate-100 dark:bg-slate-900 rounded-full h-1">
                            <div
                              className="bg-indigo-600 h-full rounded-full"
                              style={{ width: `${(item.installments?.filter((inst: any) => inst.paidStatus === 'paid').length / item.tenure) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )
                    },
                    {
                      header: 'Outstanding Principal',
                      accessor: (item) => <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">{formatCurrency(item.outstandingPrincipal, data.preferences)}</span>,
                      sortValue: (item) => item.outstandingPrincipal,
                    },
                    {
                      header: 'Next EMI Due',
                      accessor: (item) => {
                        const nextUnpaid = item.installments?.find((i: any) => i.paidStatus === 'unpaid');
                        return (
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">
                              {nextUnpaid ? formatCurrency(nextUnpaid.totalInstallmentAmount, data.preferences) : 'Fully Closed'}
                            </span>
                            {nextUnpaid && (
                              <span className="text-[9px] text-slate-405 block font-bold text-rose-500">
                                Due: {nextUnpaid.dueDate}
                              </span>
                            )}
                          </div>
                        );
                      },
                      sortValue: (item) => item.installments?.find((i: any) => i.paidStatus === 'unpaid')?.dueDate || '9999-12-31',
                    }
                  ]}
                  data={data.ccEmis || []}
                  keyExtractor={(item, index) => `${item.id}_${index}`}
                  emptyComponent={
                    <EmptyState
                      icon={Calendar}
                      title="No Credit Card EMIs Registered"
                      description="You don't have active credit card installments registered currently. You can convert purchases to EMI on the EMI panel."
                      actionLabel="Manage EMI Schedules"
                      onAction={() => setCurrentTab('emis')}
                    />
                  }
                />
              </Card>

            </div>
          )}
        </>
      )}

      {/* MODAL: ADD CREDIT CARD FORM */}
      {showAddCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0b1329] rounded-3xl max-w-md w-full border border-slate-100 dark:border-slate-800 shadow-2xl overflow-visible animate-fade-in">
            <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800/40 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                Add Credit Card Facility
              </h3>
              <button
                onClick={() => setShowAddCard(false)}
                className="p-1 text-slate-400 hover:text-slate-650 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddCardSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Card Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amazon Pay Visa"
                    value={newCardName}
                    onChange={(e) => setNewCardName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Institution / Bank
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ICICI Bank"
                    value={newCardInstitution}
                    onChange={(e) => setNewCardInstitution(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Credit Limit
                  </label>
                  <input
                    type="number"
                    required={!(!newCardIsMain && newCardLinkedGroupId)}
                    disabled={!newCardIsMain && !!newCardLinkedGroupId}
                    placeholder="e.g. 150000"
                    value={
                      !newCardIsMain && newCardLinkedGroupId
                        ? (creditCards.find(c => c.id === newCardLinkedGroupId)?.limit || '')
                        : newCardLimit
                    }
                    onChange={(e) => setNewCardLimit(e.target.value === '' ? '' : Number(e.target.value))}
                    className={`w-full border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                      !newCardIsMain && newCardLinkedGroupId
                        ? 'bg-slate-100 dark:bg-slate-800/60 border-slate-150 dark:border-slate-800 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-150 dark:border-slate-800 text-slate-705 dark:text-slate-300'
                    }`}
                  />
                  {!newCardIsMain && newCardLinkedGroupId ? (
                    <p className="text-[9px] text-indigo-500/80 mt-1 font-medium leading-normal">
                      Auto-synced with Master Card's shared limit
                    </p>
                  ) : (
                    <p className="text-[9px] text-slate-400 mt-1 font-medium leading-normal">
                      Total limit for standalone credit line
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Outstanding Balance
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 0"
                    value={newCardInitialBalance}
                    onChange={(e) => setNewCardInitialBalance(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Statement Date (Day of Month)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={newCardBillingDay}
                    onChange={(e) => {
                      const val = Math.min(31, Math.max(1, Number(e.target.value) || 1));
                      setNewCardBillingDay(val);
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <p className="text-[9px] text-slate-400 mt-0.5">e.g., 25 for 25th May</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Payment Due Day (Auto)
                  </label>
                  <input
                    type="number"
                    disabled
                    value={newCardDueDay}
                    className="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-150 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-400 focus:outline-none cursor-not-allowed"
                  />
                  <p className="text-[9px] text-indigo-500/80 mt-0.5">Auto-computed as 20 days later</p>
                </div>

                {/* LIVE PREVIEW OF STATEMENT & DUE DATE LOGIC */}
                <div className="col-span-2 p-3.5 bg-indigo-50/20 dark:bg-indigo-950/20 border border-indigo-100/70 dark:border-indigo-900/30 rounded-xl space-y-1.5 text-slate-600 dark:text-slate-300 text-[11px] leading-normal font-medium">
                  <div className="flex justify-between">
                    <span className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[9px] tracking-wider">Billing Period</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">{formPreview.periodStr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[9px] tracking-wider">Statement Date</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">{formPreview.nextStatementStr}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1.5 border-t border-indigo-100/50 dark:border-indigo-900/20">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold uppercase text-[9px] tracking-wider">Next Due Date</span>
                    <span className="font-black text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                      {formPreview.nextDueStr}
                      <span className="font-medium text-[9px] text-slate-400 normal-case">(20 days after statement)</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* CARD RELATIONSHIP SELECTION */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-3">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Card Facility Relationship (Shared Limit Pool)
                </label>
                
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewCardIsMain(false);
                      setNewCardLinkedGroupId('');
                    }}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      !newCardIsMain && !newCardLinkedGroupId
                        ? 'bg-indigo-600 border-indigo-600 text-white font-extrabold shadow-sm'
                        : 'bg-white dark:bg-[#070c19] border-slate-150 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold'
                    }`}
                  >
                    <span className="text-[10px]">Standalone</span>
                    <span className={`text-[8px] leading-none ${!newCardIsMain && !newCardLinkedGroupId ? 'text-white/80' : 'text-slate-400'}`}>Own Limit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewCardIsMain(true);
                      setNewCardLinkedGroupId('');
                    }}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      newCardIsMain
                        ? 'bg-indigo-600 border-indigo-600 text-white font-extrabold shadow-sm'
                        : 'bg-white dark:bg-[#070c19] border-slate-150 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold'
                    }`}
                  >
                    <span className="text-[10px]">Main Card</span>
                    <span className={`text-[8px] leading-none ${newCardIsMain ? 'text-white/80' : 'text-slate-400'}`}>Limit Source</span>
                  </button>

                  <button
                    type="button"
                    disabled={creditCards.filter(c => c.isMainCard && c.id !== editingCardId).length === 0}
                    onClick={() => {
                      setNewCardIsMain(false);
                      const availableMain = creditCards.find(c => c.isMainCard && c.id !== editingCardId);
                      setNewCardLinkedGroupId(availableMain ? availableMain.id : '');
                    }}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed ${
                      !newCardIsMain && newCardLinkedGroupId
                        ? 'bg-indigo-600 border-indigo-600 text-white font-extrabold shadow-sm'
                        : 'bg-white dark:bg-[#070c19] border-slate-150 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold'
                    }`}
                  >
                    <span className="text-[10px]">Dependent</span>
                    <span className={`text-[8px] leading-none ${!newCardIsMain && newCardLinkedGroupId ? 'text-white/80' : 'text-slate-400'}`}>Shared Pool</span>
                  </button>
                </div>

                {/* If Dependent, show dropdown of available Main Cards */}
                {!newCardIsMain && newCardLinkedGroupId !== '' && (
                  <div className="space-y-1 animate-fade-in">
                    <label className="block text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      Select Master Card limit source
                    </label>
                    <select
                      value={newCardLinkedGroupId}
                      onChange={(e) => setNewCardLinkedGroupId(e.target.value)}
                      className="w-full bg-white dark:bg-[#070c19] border border-slate-150 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-705 dark:text-slate-300"
                    >
                      {creditCards
                        .filter(c => c.isMainCard && c.id !== editingCardId)
                        .map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.institution})
                          </option>
                        ))}
                    </select>
                    <p className="text-[9px] text-slate-400 mt-0.5 leading-snug">
                      This card will share the credit limit pool of the selected Master Card. Its spending and outstanding balance will deplete the shared available limit.
                    </p>
                  </div>
                )}

                {/* Warning/Helper if no Master Cards exist */}
                {!newCardIsMain && !newCardLinkedGroupId && creditCards.filter(c => c.isMainCard && c.id !== editingCardId).length === 0 && (
                  <p className="text-[9px] text-slate-400 italic text-center">
                    To connect a dependent card with a shared limit pool, declare at least one other card as a "Main Card" first.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Card Color Code
                </label>
                <ColorPicker color={newCardColor} onChange={setNewCardColor} position="top" />
              </div>

              <div className="pt-3 border-t border-slate-50 dark:border-slate-800/60 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddCard(false)}
                  className="px-4 py-2 border border-slate-150 dark:border-slate-800 hover:bg-slate-55/60 dark:hover:bg-slate-800/40 text-slate-500 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/15 transition cursor-pointer"
                >
                  Confirm Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LOG TRANSACTION FORM */}
      {showAddTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0b1329] rounded-3xl max-w-md w-full border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800/40 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Log Credit Card Transaction
              </h3>
              <button
                onClick={() => setShowAddTx(false)}
                className="p-1 text-slate-400 hover:text-slate-650 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddTxSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Card Account
                </label>
                <select
                  required
                  value={txCardId}
                  onChange={(e) => setTxCardId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-705 dark:text-slate-300"
                >
                  {creditCards.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Transaction Type
                  </label>
                  <select
                    value={txType}
                    onChange={(e) => setTxType(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-705 dark:text-slate-300"
                  >
                    <option value="purchase">Purchase (Spend)</option>
                    <option value="refund">Refund (Credit)</option>
                    <option value="bill_payment">Bill Payment (Repayment)</option>
                    <option value="emi_conversion">EMI Conversion (Loan)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Transaction Amount
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 3500"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Description / Merchant name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zomato Food Delivery"
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {txType === 'bill_payment' && (
                <div className="p-3 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 space-y-2">
                  <label className="block text-[9px] font-bold text-indigo-500 uppercase tracking-wider">
                    Settle Payment From Bank Account:
                  </label>
                  <select
                    value={payFromBankId}
                    onChange={(e) => setPayFromBankId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-705 dark:text-slate-300 cursor-pointer"
                  >
                    <option value="">Do not log from bank account (Only credit card)</option>
                    {bankAccounts.map(b => (
                      <option key={b.id} value={b.id}>{b.name} (Bal: {formatCurrency(b.balance, data.preferences)})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-705 dark:text-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Category Tag
                  </label>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-705 dark:text-slate-300"
                  >
                    {budgets.map(b => (
                      <option key={b.category} value={b.category}>{b.category}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-50 dark:border-slate-800/60 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddTx(false)}
                  className="px-4 py-2 border border-slate-150 dark:border-slate-800 hover:bg-slate-55/60 dark:hover:bg-slate-800/40 text-slate-500 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/15 transition cursor-pointer"
                >
                  Log Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
