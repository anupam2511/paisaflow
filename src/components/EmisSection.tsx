/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FinanceData, EmiItem, FinancialAccount, CreditCardEmiMaster } from '../types';
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
  Gauge,
  CalendarClock,
  ArrowRight,
  Info
} from 'lucide-react';
import CcEmiForm from './CcEmiForm';
import CcEmiDetailsModal from './CcEmiDetailsModal';
import { analyzeEmiCost } from '../utils/emiCalculations';

interface EmisSectionProps {
  data: FinanceData;
  setFinanceData: React.Dispatch<React.SetStateAction<FinanceData>>;
}

export default function EmisSection({ data, setFinanceData }: EmisSectionProps) {
  const { emis = [], ccEmis = [], accounts, budgets, preferences } = data;

  const [activeTab, setActiveTab] = useState<'loans' | 'credit_cards'>('credit_cards');

  // --- LOANS & STANDARD EMIS STATE & FORM (EXISTING LOGIC PRESERVED) ---
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

  const [editingEmiId, setEditingEmiId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [emiToDelete, setEmiToDelete] = useState<{ id: string; name: string } | null>(null);

  const [selectedCardFilter, setSelectedCardFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // --- CREDIT CARD EMIS STATE ---
  const [showCcForm, setShowCcForm] = useState(false);
  const [editingCcEmiId, setEditingCcEmiId] = useState<string | null>(null);
  const [selectedCcEmiForDetails, setSelectedCcEmiForDetails] = useState<CreditCardEmiMaster | null>(null);
  const [ccEmiToDelete, setCcEmiToDelete] = useState<{ id: string; name: string } | null>(null);
  const [prefilledExpense, setPrefilledExpense] = useState<any | null>(null);

  // --- CORE KPI CALCULATIONS FOR STANDARD EMIS ---
  const activeEmis = emis.filter(e => e.isActive);
  const averageEmiPerMonth = activeEmis.reduce((sum, e) => sum + e.amount, 0);
  const totalRemainingInstallmentsValue = activeEmis.reduce((sum, e) => {
    const remaining = Math.max(0, e.totalTenure - e.installmentsPaid);
    return sum + (e.amount * remaining);
  }, 0);
  const completedEmisValue = emis.reduce((sum, e) => sum + (e.amount * e.installmentsPaid), 0);
  const completedEmisCount = emis.filter(e => e.installmentsPaid >= e.totalTenure).length;

  const cardBreakdown = accounts.map(acc => {
    const matchedEmis = activeEmis.filter(e => e.accountId === acc.id);
    const amountSum = matchedEmis.reduce((sum, e) => sum + e.amount, 0);
    return { account: acc, amountSum, count: matchedEmis.length };
  }).filter(item => item.count > 0);

  const categoryBreakdown = budgets.map(b => {
    const matchedEmis = activeEmis.filter(e => e.category === b.category);
    const amountSum = matchedEmis.reduce((sum, e) => sum + e.amount, 0);
    return { category: b.category, amountSum, count: matchedEmis.length };
  }).filter(item => item.count > 0);

  // --- CORE KPI CALCULATIONS FOR CREDIT CARD EMIS ---
  const activeCcEmis = ccEmis.filter(e => e.status === 'active');
  const ccActiveCount = activeCcEmis.length;

  const totalCcOutstandingPrincipal = activeCcEmis.reduce((sum, e) => sum + e.outstandingPrincipal, 0);
  
  const totalCcMonthlyBurden = activeCcEmis.reduce((sum, e) => {
    const nextUnpaid = e.installments.find(inst => inst.paidStatus === 'unpaid');
    return sum + (nextUnpaid ? nextUnpaid.totalInstallmentAmount : 0);
  }, 0);

  const totalCcMerchantDiscountSaved = ccEmis.reduce((sum, e) => sum + (e.merchantDiscount || 0), 0);
  const closedCcCount = ccEmis.filter(e => e.status === 'closed' || e.status === 'pre_closed').length;

  // --- ELIGIBLE CARD TRANSACTIONS FOR EMI CONVERSION ---
  // Large transaction cards checkout (> ₹4,000) that aren't already mapped as active EMIs
  const eligibleExpenses = data.expenses.filter(exp => {
    const isCc = accounts.find(a => a.id === exp.accountId)?.type === 'credit_card';
    const isLarge = exp.amount >= 4000;
    // Ensure it hasn't already been mapped as an active CC EMI
    const isAlreadyConverted = ccEmis.some(e => 
      e.originalAmount === exp.amount && 
      e.cardId === exp.accountId &&
      (e.expenseName.toLowerCase().includes(exp.description.toLowerCase()) || exp.description.toLowerCase().includes(e.expenseName.toLowerCase()))
    );
    return isCc && isLarge && !isAlreadyConverted;
  });

  // --- ACTIONS FOR STANDARD EMIS ---
  const handleQuickPayIncrement = (emiId: string) => {
    let affectedEmiName = '';
    let affectedAmount = 0;
    let affectedAccountName = '';

    setFinanceData(prev => {
      const targetEmi = (prev.emis || []).find(e => e.id === emiId);
      if (!targetEmi) return prev;

      const nextPaidCount = Math.min(targetEmi.totalTenure, targetEmi.installmentsPaid + 1);
      if (nextPaidCount === targetEmi.installmentsPaid) return prev;

      affectedEmiName = targetEmi.name;
      affectedAmount = targetEmi.amount;

      const matchedAcc = prev.accounts.find(a => a.id === targetEmi.accountId);
      affectedAccountName = matchedAcc ? matchedAcc.name : 'Selected Account';

      const updatedAccounts = prev.accounts.map(a => {
        if (a.id === targetEmi.accountId) {
          if (a.type === 'bank') {
            return { ...a, balance: a.balance - targetEmi.amount };
          } else {
            return { ...a, balance: a.balance + targetEmi.amount };
          }
        }
        return a;
      });

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

    setOk(`Logged +1 Paid for "${affectedEmiName}" & created ${formatCurrency(affectedAmount, preferences)} expense against "${affectedAccountName}".`);
    setTimeout(() => setOk(''), 5000);
  };

  const handleSelectToEdit = (emi: EmiItem) => {
    setEditingEmiId(emi.id);
    setName(emi.name);
    setAmount(emi.amount.toString());
    setCategory(emi.category);
    setAccountId(emi.accountId);
    setTotalTenure(emi.totalTenure.toString());
    setInstallmentsPaid(emi.installmentsPaid.toString());
    
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

    setTimeout(() => {
      document.getElementById('emi-form-container')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  };

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

  const handleSaveEmi = (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');

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
      return { ...prev, emis: finalEmis };
    });

    setOk(editingEmiId ? 'EMI schedule updated successfully!' : 'New EMI schedule activated successfully!');
    handleResetForm();
    setTimeout(() => setOk(''), 3000);
  };

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

  // --- ACTIONS FOR CREDIT CARD EMIS ---
  const handleToggleCcInstallment = (emiId: string, installmentNum: number, currentStatus: 'paid' | 'unpaid') => {
    let outputText = '';
    
    setFinanceData(prev => {
      const baseCcEmis = prev.ccEmis || [];
      const emiIndex = baseCcEmis.findIndex(e => e.id === emiId);
      if (emiIndex === -1) return prev;

      const emi = baseCcEmis[emiIndex];
      const nextStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';

      // Update installments list
      const updatedInstallments = emi.installments.map(inst => {
        if (inst.installmentNumber === installmentNum) {
          return { ...inst, paidStatus: nextStatus };
        }
        return inst;
      });

      // Calculate new outstanding principal
      const unpaidInstallments = updatedInstallments.filter(inst => inst.paidStatus === 'unpaid');
      const newOutstanding = unpaidInstallments.reduce((sum, inst) => sum + inst.principalComponent, 0);

      // Check if all are now paid
      const allPaid = updatedInstallments.every(inst => inst.paidStatus === 'paid');
      const nextStatusMaster = allPaid ? 'closed' : emi.status;

      const updatedEmi: CreditCardEmiMaster = {
        ...emi,
        status: nextStatusMaster,
        outstandingPrincipal: Math.round(newOutstanding * 100) / 100,
        installments: updatedInstallments,
      };

      // Set details viewer modal state so it updates live
      setTimeout(() => {
        setSelectedCcEmiForDetails(updatedEmi);
      }, 0);

      const updatedCcEmis = baseCcEmis.map(e => e.id === emiId ? updatedEmi : e);

      let nextExpenses = [...prev.expenses];
      let nextAccounts = [...prev.accounts];

      const targetInstallment = emi.installments.find(inst => inst.installmentNumber === installmentNum);
      const installmentAmt = targetInstallment ? targetInstallment.totalInstallmentAmount : 0;

      if (nextStatus === 'paid') {
        const todayString = new Date().toISOString().split('T')[0];
        const newExpense = {
          id: `exp-ccemi-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          description: `EMI Payment: ${emi.expenseName} (Installment ${installmentNum}/${emi.tenure})`,
          amount: installmentAmt,
          category: emi.category || 'Shopping',
          date: todayString,
          accountId: emi.cardId,
          isRecurring: false
        };
        nextExpenses = [newExpense, ...nextExpenses];

        nextAccounts = prev.accounts.map(a => {
          if (a.id === emi.cardId) {
            return { ...a, balance: Math.round((a.balance + installmentAmt) * 100) / 100 };
          }
          return a;
        });
        outputText = `Marked Installment #${installmentNum} as Paid! Logged card bill outstanding of ${formatCurrency(installmentAmt, preferences)}.`;
      } else {
        nextExpenses = prev.expenses.filter(
          e => !e.description.includes(`EMI Payment: ${emi.expenseName} (Installment ${installmentNum}/`)
        );

        nextAccounts = prev.accounts.map(a => {
          if (a.id === emi.cardId) {
            return { ...a, balance: Math.max(0, Math.round((a.balance - installmentAmt) * 100) / 100) };
          }
          return a;
        });
        outputText = `Reverted Installment #${installmentNum} to Unpaid. Outstanding bill updated.`;
      }

      return {
        ...prev,
        ccEmis: updatedCcEmis,
        expenses: nextExpenses,
        accounts: nextAccounts,
      };
    });

    if (outputText) {
      setOk(outputText);
      setTimeout(() => setOk(''), 5000);
    }
  };

  const handleQuickMarkNextPaid = (emi: CreditCardEmiMaster) => {
    const nextUnpaid = emi.installments.find(inst => inst.paidStatus === 'unpaid');
    if (nextUnpaid) {
      handleToggleCcInstallment(emi.id, nextUnpaid.installmentNumber, 'unpaid');
    }
  };

  const handlePreCloseCcEmi = (emiId: string) => {
    setFinanceData(prev => {
      const baseCcEmis = prev.ccEmis || [];
      const emiIndex = baseCcEmis.findIndex(e => e.id === emiId);
      if (emiIndex === -1) return prev;

      const emi = baseCcEmis[emiIndex];
      let nextExpenses = [...prev.expenses];
      let balanceToCharge = 0;

      const updatedInstallments = emi.installments.map(inst => {
        if (inst.paidStatus === 'unpaid') {
          const todayString = new Date().toISOString().split('T')[0];
          const newExpense = {
            id: `exp-ccemi-prep-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            description: `EMI Settle Early: ${emi.expenseName} (Installment ${inst.installmentNumber}/${emi.tenure})`,
            amount: inst.totalInstallmentAmount,
            category: emi.category || 'Shopping',
            date: todayString,
            accountId: emi.cardId,
            isRecurring: false
          };
          nextExpenses = [newExpense, ...nextExpenses];
          balanceToCharge += inst.totalInstallmentAmount;

          return { ...inst, paidStatus: 'paid' as const };
        }
        return inst;
      });

      const updatedEmi: CreditCardEmiMaster = {
        ...emi,
        status: 'pre_closed',
        outstandingPrincipal: 0,
        installments: updatedInstallments,
      };

      const updatedCcEmis = baseCcEmis.map(e => e.id === emiId ? updatedEmi : e);

      const updatedAccounts = prev.accounts.map(a => {
        if (a.id === emi.cardId) {
          return { ...a, balance: Math.round((a.balance + balanceToCharge) * 100) / 100 };
        }
        return a;
      });

      setTimeout(() => {
        setSelectedCcEmiForDetails(null);
      }, 0);

      return {
        ...prev,
        ccEmis: updatedCcEmis,
        expenses: nextExpenses,
        accounts: updatedAccounts,
      };
    });

    setOk(`Successfully pre-closed CC EMI for "${ccEmis.find(e => e.id===emiId)?.expenseName}". Remaining liabilities settled and loaded on credit card spent dues.`);
    setTimeout(() => setOk(''), 5000);
  };

  const handleDeleteCcEmi = () => {
    if (!ccEmiToDelete) return;

    setFinanceData(prev => ({
      ...prev,
      ccEmis: (prev.ccEmis || []).filter(e => e.id !== ccEmiToDelete.id)
    }));

    setOk(`Removed Credit Card EMI entry: "${ccEmiToDelete.name}"`);
    setCcEmiToDelete(null);
    setTimeout(() => setOk(''), 3000);
  };

  // Filter lists
  const filteredEmis = emis.filter(emi => {
    const cardMatch = selectedCardFilter === 'all' || emi.accountId === selectedCardFilter;
    const catMatch = selectedCategoryFilter === 'all' || emi.category === selectedCategoryFilter;
    return cardMatch && catMatch;
  });

  const filteredCcEmis = ccEmis.filter(emi => {
    const cardMatch = selectedCardFilter === 'all' || emi.cardId === selectedCardFilter;
    const catMatch = selectedCategoryFilter === 'all' || emi.category === selectedCategoryFilter;
    return cardMatch && catMatch;
  });

  return (
    <div id="emi-section-wrapper" className="space-y-6 text-left">
      
      {/* SECTION HEADER & TABS BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500 shrink-0" />
            Installments & EMIs Ledger
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Settle, audit, and forecast all outstanding personal loan plans and credit card transaction EMIs.
          </p>
        </div>

        {/* Dynamic top tab toggles */}
        <div className="flex bg-slate-100 p-1 rounded-xl self-start md:self-center border border-slate-200/50">
          <button
            onClick={() => {
              setActiveTab('credit_cards');
              handleResetForm();
            }}
            className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-lg transition-all duration-200 cursor-pointer ${
              activeTab === 'credit_cards' 
                ? 'bg-white text-indigo-700 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            Credit Card EMIs
            {ccActiveCount > 0 && (
              <span className="bg-indigo-550/10 text-indigo-600 font-black rounded-full px-1.5 py-0.5 text-[8.5px] font-sans">
                {ccActiveCount}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab('loans');
              setShowCcForm(false);
            }}
            className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-lg transition-all duration-200 cursor-pointer ${
              activeTab === 'loans' 
                ? 'bg-white text-indigo-700 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            Personal & Loan EMIs
            {activeEmis.length > 0 && (
              <span className="bg-indigo-550/10 text-indigo-600 font-black rounded-full px-1.5 py-0.5 text-[8.5px] font-sans">
                {activeEmis.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {ok && (
        <div className="bg-emerald-50 text-emerald-700 text-xs font-bold p-4 rounded-xl border border-emerald-100 flex items-center gap-2.5 shadow-xs animate-fade-in">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{ok}</span>
        </div>
      )}

      {/* --- CREDIT CARD TAB HUB --- */}
      {activeTab === 'credit_cards' && (
        <div className="space-y-6">
          
          {/* ELIGIBLE EXPENSES CONVERSION CONSOLE */}
          {eligibleExpenses.length > 0 && !showCcForm && (
            <div className="bg-indigo-50/20 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100/70 dark:border-indigo-900/40 p-4.5 space-y-3.5 animate-fade-in">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-indigo-800 dark:text-indigo-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-650 dark:text-indigo-400 animate-pulse" />
                    Eligible Transactions for EMI Conversion
                  </h4>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-0.5">
                    Banks allow cardholders to convert large swipe transactions (exceeding ₹4,000) into low-interest, reducing balance monthly credit card EMIs. Click any card purchase footprint below to instantiate conversion.
                  </p>
                </div>
                <span className="text-[9.5px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/50 px-2.5 py-0.5 rounded font-black uppercase font-mono shrink-0">
                  {eligibleExpenses.length} Available
                </span>
              </div>

              {/* Horizontal scroll grid */}
              <div className="flex gap-3 overflow-x-auto pb-1.5 scrollbar-thin">
                {eligibleExpenses.map((exp) => {
                  const card = accounts.find(a => a.id === exp.accountId);
                  return (
                    <div 
                      key={exp.id}
                      onClick={() => {
                        setPrefilledExpense(exp);
                        setShowCcForm(true);
                        setEditingCcEmiId(null);
                      }}
                      className="bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-150 dark:border-slate-800/80 rounded-xl p-3 min-w-[210px] shrink-0 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-800/80 hover:shadow-xs transition-all flex flex-col justify-between"
                    >
                      <div className="text-left">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: card?.color || '#000' }} />
                          <span className="text-[9px] text-slate-450 dark:text-slate-400 font-bold truncate max-w-[120px]">{card?.name}</span>
                        </div>
                        <h5 className="text-[11.5px] text-slate-800 dark:text-slate-200 font-black mt-1.5 truncate max-w-[190px]">{exp.description}</h5>
                        <span className="text-[9.5px] text-slate-400 dark:text-slate-550 font-medium">{exp.date}</span>
                      </div>
                      <div className="flex justify-between items-center mt-3 border-t border-slate-50 dark:border-slate-800 pt-2">
                        <span className="font-mono text-[11.5px] font-black text-slate-900 dark:text-slate-100">{formatCurrency(exp.amount, preferences)}</span>
                        <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-0.5">
                          Convert <ArrowRight className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ADD / EDIT FORM BOX */}
          {showCcForm ? (
            <div id="cc-emi-form-container">
              <CcEmiForm 
                data={data}
                setFinanceData={setFinanceData}
                editingEmiId={editingCcEmiId}
                prefilledExpense={prefilledExpense}
                onClose={() => {
                  setShowCcForm(false);
                  setEditingCcEmiId(null);
                  setPrefilledExpense(null);
                }}
              />
            </div>
          ) : (
            <div className="flex justify-end">
               <button
                onClick={() => {
                  setEditingCcEmiId(null);
                  setPrefilledExpense(null);
                  setShowCcForm(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2.5 px-4.5 rounded-xl shadow-xs hover:shadow transition flex items-center gap-1.5 cursor-pointer font-sans"
              >
                <Plus className="w-4 h-4 animate-bounce" /> Convert credit card transaction to EMI
              </button>
            </div>
          )}

          {/* CC EMIS SUMMARY METRIC CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* MONTHLY BILL IMPACT */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between min-h-[110px]">
              <div>
                <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-wider font-sans">
                  Monthly Statement Impact
                </span>
                <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-2.5">CC EMIs Dues Billed This Month</h3>
              </div>
              <p className="text-xl lg:text-2xl font-black text-slate-900 mt-1 font-mono tracking-tight leading-none">
                {formatCurrency(totalCcMonthlyBurden, preferences)}
              </p>
            </div>

            {/* TOTAL CURRENT LIABILITIES */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between min-h-[110px]">
              <div>
                <span className="text-[9px] font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md uppercase tracking-wider font-sans">
                  Current Liabilities
                </span>
                <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-2.5">O/S CC EMI Outstanding Principal</h3>
              </div>
              <p className="text-xl lg:text-2xl font-black text-slate-900 mt-1 font-mono tracking-tight leading-none">
                {formatCurrency(totalCcOutstandingPrincipal, preferences)}
              </p>
            </div>

            {/* TOTAL NO-COST VALUE SAVED */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between min-h-[110px]">
              <div>
                <span className="text-[9px] font-extrabold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md uppercase tracking-wider font-sans">
                  No-Cost Interest Savings
                </span>
                <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-2.5">Upfront Merchant Discounts</h3>
              </div>
              <p className="text-xl lg:text-2xl font-black text-emerald-655 mt-1 font-mono tracking-tight leading-none">
                {formatCurrency(totalCcMerchantDiscountSaved, preferences)}
              </p>
            </div>

            {/* CLOSED EMI SCHEDULES */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between min-h-[110px]">
              <div>
                <span className="text-[9px] font-extrabold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md uppercase tracking-wider font-sans">
                  Closed Schedules
                </span>
                <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-2.5 font-sans">Completed / Preclosed</h3>
              </div>
              <p className="text-xl lg:text-2xl font-black text-slate-900 mt-1 font-mono tracking-tight leading-none">
                {closedCcCount} <span className="text-xs text-slate-400 font-normal">Schedules</span>
              </p>
            </div>
          </div>

          {/* DYNAMIC LIST BOARD TABLE */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-3 mb-4 gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-indigo-500" />
                  Credit Card EMI trackers List
                </h3>
                <span className="text-[10px] bg-slate-100 font-bold px-2 py-0.5 rounded text-slate-500">
                  {filteredCcEmis.length} Schedules
                </span>
              </div>

              {/* Advanced multi-filters */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedCardFilter}
                  onChange={(e) => setSelectedCardFilter(e.target.value)}
                  className="text-[11px] border border-slate-200 rounded-lg p-2 bg-slate-50 focus:outline-none font-bold text-slate-600"
                >
                  <option value="all">💳 All Credit Cards</option>
                  {accounts.filter(a => a.type === 'credit_card').map(a => (
                    <option key={a.id} value={a.id}>💳 {a.institution} - {a.name}</option>
                  ))}
                </select>

                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="text-[11px] border border-slate-200 rounded-lg p-2 bg-slate-50 focus:outline-none font-bold text-slate-600"
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

            {filteredCcEmis.length === 0 ? (
              <div className="text-center py-12 bg-slate-50/30 rounded-3xl border border-dashed border-slate-150 p-6">
                <div className="p-2.5 bg-slate-100 text-slate-300 rounded-xl w-fit mx-auto mb-3">
                  <CreditCard className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-700">No active Credit Card EMIs found.</p>
                <p className="text-[10px] text-slate-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
                  Apply filter criteria overrides or convert credit card receipts from the transaction conveyor above.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 pl-1">Descriptor / Start date</th>
                      <th className="pb-3">Source Card Account</th>
                      <th className="pb-3 text-center">EMI Type</th>
                      <th className="pb-3 text-right">Tenure Progress</th>
                      <th className="pb-3 text-right">O/S Principal</th>
                      <th className="pb-3 text-right">Total Payable</th>
                      <th className="pb-3 text-center">Billed Increments</th>
                      <th className="pb-3 text-right pr-1">Ops</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCcEmis.map((emi) => {
                      const analysis = analyzeEmiCost(emi);
                      const card = accounts.find(a => a.id === emi.cardId);
                      
                      const paidCount = emi.installments.filter(inst => inst.paidStatus === 'paid').length;
                      const progressPercentage = Math.round((paidCount / emi.tenure) * 100);

                      const nextUnpaid = emi.installments.find(inst => inst.paidStatus === 'unpaid');
                      
                      const isPreclosed = emi.status === 'pre_closed';

                      return (
                        <tr key={emi.id} className="text-xs text-slate-700 hover:bg-slate-50 transition font-medium">
                          {/* DESCRIPTOR */}
                          <td className="py-4 pl-1 text-left">
                            <div className="font-black text-slate-800 flex items-center gap-1.5">
                              {emi.expenseName}
                              {isPreclosed && (
                                <span className="text-[8px] bg-amber-50 font-extrabold text-amber-600 px-1.5 py-0.5 rounded font-sans tracking-wide uppercase">
                                  Pre-closed
                                </span>
                              )}
                              {!isPreclosed && paidCount >= emi.tenure && (
                                <span className="text-[8px] bg-slate-100 font-extrabold text-slate-400 px-1.5 py-0.5 rounded font-sans tracking-wide uppercase">
                                  Closed
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                              <span className="flex items-center gap-0.5 font-mono font-bold">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                {emi.startDate} start
                              </span>
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold text-[9px] text-slate-500 uppercase tracking-wide">
                                {emi.category || 'Shopping'}
                              </span>
                            </div>
                          </td>

                          {/* SOURCE CARD */}
                          <td className="py-4">
                            {card ? (
                              <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: card.color }} />
                                <div>
                                  <div className="font-extrabold text-slate-700 leading-tight">{card.institution}</div>
                                  <div className="text-[9px] text-slate-400 uppercase font-black tracking-tight">{card.name}</div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[10px]">Unknown card</span>
                            )}
                          </td>

                          {/* EMI TYPE */}
                          <td className="py-4 text-center">
                            {emi.emiType === 'no_cost' ? (
                              <span className="text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg text-[9.5px] font-black tracking-wide leading-none inline-block">
                                No-Cost ({emi.interestRate}%)
                              </span>
                            ) : (
                              <span className="text-rose-750 bg-rose-50 px-2 py-1 rounded-lg text-[9.5px] font-bold inline-block">
                                Regular ({emi.interestRate}%)
                              </span>
                            )}
                          </td>

                          {/* TENURE PROGRESS */}
                          <td className="py-4 text-left px-3 min-w-[130px]">
                            <div className="flex justify-between text-[9.5px] font-black text-slate-650 mb-1 leading-tight">
                              <span>{paidCount} of {emi.tenure} m</span>
                              <span className="font-mono">{progressPercentage}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
                              <div 
                                className={`h-1 rounded-full transition-all duration-300 ${isPreclosed || paidCount >= emi.tenure ? 'bg-emerald-500' : 'bg-indigo-650'}`}
                                style={{ width: `${progressPercentage}%` }}
                              />
                            </div>
                            {progressPercentage < 100 && !isPreclosed && nextUnpaid && (
                              <span className="text-[9px] text-slate-450 block mt-1 leading-none font-bold">
                                Next: {formatCurrency(nextUnpaid.totalInstallmentAmount, preferences)} due {nextUnpaid.dueDate}
                              </span>
                            )}
                          </td>

                          {/* OUTSTANDING PRINCIPAL */}
                          <td className="py-4 text-right font-mono text-slate-800 font-extrabold">
                            {isPreclosed ? '—' : formatCurrency(emi.outstandingPrincipal, preferences)}
                            <span className="text-[8.5px] text-slate-400 font-semibold block leading-tight mt-0.5">Remaining Principal</span>
                          </td>

                          {/* TOTAL PAYABLE */}
                          <td className="py-4 text-right font-mono text-slate-900 font-black">
                            {formatCurrency(analysis.totalPayable, preferences)}
                            {emi.merchantDiscount > 0 && (
                              <span className="text-[8.5px] text-teal-600 block leading-tight mt-0.5 font-bold">Disc Saved: {formatCurrency(emi.merchantDiscount, preferences)}</span>
                            )}
                          </td>

                          {/* BILLED INCREMENTS */}
                          <td className="py-4 text-center">
                            {progressPercentage < 100 && !isPreclosed ? (
                              <button
                                onClick={() => handleQuickMarkNextPaid(emi)}
                                className="bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-indigo-750 font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition shrink-0 flex items-center gap-1 mx-auto"
                                title="Logs first unpaid month installment"
                              >
                                <CheckCircle className="w-3 h-3 text-indigo-500" /> Pay next Month #{paidCount + 1}
                              </button>
                            ) : (
                              <span className="text-emerald-700 font-extrabold text-[10px] bg-emerald-50 px-2.5 py-1 rounded inline-block leading-none">
                                Fully Settled
                              </span>
                            )}
                          </td>

                          {/* OPS CONTROLS */}
                          <td className="py-4 text-right pr-1">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedCcEmiForDetails(emi)}
                                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 font-extrabold text-slate-650 hover:text-slate-800 text-[10px] py-1 px-2.5 rounded-lg transition flex items-center gap-1 w-fit"
                                title="Run full reducing balance cost reports and payments schedule"
                              >
                                View Schedule Dues
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCcEmiId(emi.id);
                                  setShowCcForm(true);
                                }}
                                className="p-1 px-1.5 hover:bg-slate-150 rounded text-slate-450 hover:text-slate-700 transition"
                                title="Edit conversion particulars"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setCcEmiToDelete({ id: emi.id, name: emi.expenseName })}
                                className="p-1 px-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition"
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
        </div>
      )}

      {/* --- STANDARD LOANS EMIS SUBTAB HUB --- */}
      {activeTab === 'loans' && (
        <div className="space-y-6">
          
          {/* LOAN NEW FORM CONTAINER */}
          {showAddForm && (
            <form id="emi-form-container" onSubmit={handleSaveEmi} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 max-w-4xl animate-fade-in text-left">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-550" />
                  {editingEmiId ? 'Modify Installment Parameters' : 'Register New Payment Installment Schedule'}
                </h3>
              </div>

              {err && (
                <div className="bg-rose-50 text-rose-750 text-xs font-semibold p-4 rounded-xl border border-rose-100 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{err}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descriptor</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. SBI House mortgage tenure"
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Monthly payment Amt</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-405 font-bold">{preferences.currencySymbol}</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 24800"
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 pl-7 bg-slate-50 focus:outline-none focus:border-indigo-505 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Source account</label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:outline-none font-semibold text-slate-700"
                  >
                    <option value="">-- Choose Account --</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.institution} - {acc.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:outline-none font-semibold text-slate-700"
                  >
                    {budgets.map(b => (
                      <option key={b.category} value={b.category}>{b.category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Total tenure (Months)</label>
                  <input
                    type="number"
                    value={totalTenure}
                    onChange={(e) => setTotalTenure(e.target.value)}
                    placeholder="12"
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Installments completed</label>
                  <input
                    type="number"
                    value={installmentsPaid}
                    onChange={(e) => setInstallmentsPaid(e.target.value)}
                    placeholder="0"
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start Period</label>
                  <input
                    type="month"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Interest Rate (% APR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    placeholder="12.5"
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-semibold"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-700">Currently active schedule</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Internal notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Details..."
                  rows={2}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 focus:outline-none font-semibold text-slate-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-50 pt-2">
                <button type="button" onClick={handleResetForm} className="text-xs font-bold text-slate-550 px-3 py-2">
                  Cancel
                </button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4.5 py-2.5 rounded-xl transition">
                  {editingEmiId ? 'Update EMI tracker' : 'Activate Loan EMI'}
                </button>
              </div>
            </form>
          )}

          <div className="flex justify-end">
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2.5 px-4.5 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Register New Personal / Bank loan
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* MONTHLY BURDEN */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between min-h-[110px]">
              <div>
                <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-wider font-sans">
                  Monthly Burden
                </span>
                <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-2.5">Avg Loan EMI Per Month</h3>
              </div>
              <p className="text-xl lg:text-2xl font-black text-slate-900 mt-1 font-mono tracking-tight leading-none">
                {formatCurrency(averageEmiPerMonth, preferences)}
              </p>
            </div>

            {/* PENDING PRINCIPAL */}
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

            {/* COMPLETED PAYMENTS */}
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

            {/* CLOSED SCHEDS */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between min-h-[110px]">
              <div>
                <span className="text-[9px] font-extrabold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md uppercase tracking-wider font-sans">
                  Success Ratio
                </span>
                <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-2.5 pb-0.5 font-sans">Closed Accounts</h3>
              </div>
              <p className="text-xl lg:text-2xl font-black text-slate-900 mt-1 font-mono tracking-tight leading-none">
                {completedEmisCount} <span className="text-xs text-slate-400 font-normal font-sans">Schedules</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-left">
            {/* CARD/ACCOUNT BREAKDOWN */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 lg:col-span-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-500" /> Outstanding Card & Loan Burden
                </h3>
              </div>

              {cardBreakdown.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No loan EMIs active.</p>
              ) : (
                <div className="space-y-4">
                  {cardBreakdown.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-slate-700">
                        <span className="font-bold">{item.account.institution} ({item.account.name})</span>
                        <span className="font-mono font-bold text-slate-800">{formatCurrency(item.amountSum, preferences)}/mo</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1">
                        <div className="h-1 rounded-full" style={{ width: '40%', backgroundColor: item.account.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CATEGORY BREAKDOWN */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 lg:col-span-6 text-left">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Tag className="w-4 h-4 text-indigo-500" /> Category Allocations
                </h3>
              </div>

              {categoryBreakdown.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No loan EMIs linked to categories.</p>
              ) : (
                <div className="space-y-4">
                  {categoryBreakdown.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-slate-700">
                        <span className="bg-slate-100 text-slate-700 font-bold text-[9px] px-2 py-0.5 rounded font-mono uppercase">{item.category}</span>
                        <span className="font-mono font-bold text-slate-800">{formatCurrency(item.amountSum, preferences)}/mo</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1">
                        <div className="h-1 rounded-full bg-indigo-650" style={{ width: '60%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* DYNAMIC LIST BOARD TABLE */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-3 mb-4 gap-3">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 text-left">
                <Gauge className="w-4 h-4 text-indigo-500" /> Loan Installment Schedules
              </h3>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedCardFilter}
                  onChange={(e) => setSelectedCardFilter(e.target.value)}
                  className="text-[11px] border border-slate-200 rounded-lg p-2 bg-slate-50 font-bold text-slate-650"
                >
                  <option value="all">💳 All Accounts</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>💳 {a.institution} - {a.name}</option>
                  ))}
                </select>

                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="text-[11px] border border-slate-200 rounded-lg p-2 bg-slate-50 font-bold text-slate-655"
                >
                  <option value="all">🏷️ All Spend Categories</option>
                  {budgets.map(b => (
                    <option key={b.category} value={b.category}>🏷️ {b.category}</option>
                  ))}
                </select>
              </div>
            </div>

            {filteredEmis.length === 0 ? (
              <p className="text-xs text-slate-450 italic text-center py-6">No matching loan EMIs found.</p>
            ) : (
              <div className="overflow-x-auto text-left">
                <table className="w-full text-left border-collapse min-w-[700px] text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 pl-1">Descriptor / Start date</th>
                      <th className="pb-3">Source Account</th>
                      <th className="pb-3">Category</th>
                      <th className="pb-3 text-right">EMI Burden</th>
                      <th className="pb-3 text-center">Tenure Progress</th>
                      <th className="pb-3 text-right">Sunk / Outstanding</th>
                      <th className="pb-3 text-center">Increment Status</th>
                      <th className="pb-3 text-right pr-1">Ops</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEmis.map((emi) => {
                      const card = accounts.find(a => a.id === emi.accountId);
                      const progress = Math.round((emi.installmentsPaid / emi.totalTenure) * 100);
                      const remains = emi.totalTenure - emi.installmentsPaid;
                      const sunk = emi.amount * emi.installmentsPaid;
                      const outstanding = emi.amount * remains;

                      return (
                        <tr key={emi.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-3.5 pl-1 text-left font-black">{emi.name}</td>
                          <td className="py-3.5">{card?.institution} - {card?.name}</td>
                          <td className="py-3.5"><span className="bg-slate-100 text-[9px] px-2 py-0.5 rounded font-bold uppercase">{emi.category}</span></td>
                          <td className="py-3.5 text-right font-mono font-bold text-slate-900">{formatCurrency(emi.amount, preferences)}</td>
                          <td className="py-3.5 text-center">
                            <span className="font-mono text-[10px] font-bold">{emi.installmentsPaid} of {emi.totalTenure} paid ({progress}%)</span>
                            <div className="w-20 bg-slate-100 h-1 rounded-full mx-auto mt-1 overflow-hidden">
                              <div className="h-1 rounded-full bg-indigo-650" style={{ width: `${progress}%` }} />
                            </div>
                          </td>
                          <td className="py-3.5 text-right font-mono">
                            <div>{formatCurrency(outstanding, preferences)}</div>
                            <span className="text-[9px] text-slate-400 font-semibold block leading-tight mt-0.5">Paid: {formatCurrency(sunk, preferences)}</span>
                          </td>
                          <td className="py-3.5 text-center">
                            {remains > 0 ? (
                              <button
                                onClick={() => handleQuickPayIncrement(emi.id)}
                                className="bg-slate-50 border border-slate-200 hover:bg-indigo-50 font-bold text-[10px] text-indigo-700 py-1 px-2.5 rounded-lg transition"
                              >
                                +1 Paid
                              </button>
                            ) : (
                              <span className="text-emerald-705 font-bold text-[10px] bg-emerald-50 px-2 rounded-md">Paid Off</span>
                            )}
                          </td>
                          <td className="py-3.5 text-right pr-1">
                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={() => handleSelectToEdit(emi)} className="p-1 text-slate-400 hover:text-slate-600 transition"><Edit3 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => setEmiToDelete({ id: emi.id, name: emi.name })} className="p-1 text-slate-400 hover:text-rose-600 transition"><Trash2 className="w-3.5 h-3.5" /></button>
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
        </div>
      )}

      {/* --- CONFIRMATION DELETION DIALOGS --- */}

      {/* Delete Standard Loan EMI */}
      {emiToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-100 text-left">
            <h3 className="text-sm font-bold text-slate-800">Delete EMI Tracker?</h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to remove the track history for <strong className="text-slate-800">"{emiToDelete.name}"</strong>? This will clear all logged installment schedules. This operation is irreversible.
            </p>
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-150">
              <button onClick={() => setEmiToDelete(null)} className="text-xs text-slate-500 font-bold px-3 py-1.5">Cancel</button>
              <button onClick={handleConfirmDelete} className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-lg shadow-sm cursor-pointer">Confirm Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Credit Card EMI */}
      {ccEmiToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-left">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Delete Credit Card EMI Tracker?</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Are you sure you want to completely erase the credit card EMI track history for <strong className="text-slate-800">"{ccEmiToDelete.name}"</strong>? Outstanding principal balances will not be charged to any card. This ledger removal is immutable.
            </p>
            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-150">
              <button onClick={() => setCcEmiToDelete(null)} className="text-xs text-slate-550 font-bold px-3.5 py-1.5">Cancel</button>
              <button onClick={handleDeleteCcEmi} className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-lg shadow-sm cursor-pointer">Confirm Erasure</button>
            </div>
          </div>
        </div>
      )}

      {/* --- AMORTIZATION SCHEDULE REPORTS MODAL --- */}
      {selectedCcEmiForDetails && (
        <CcEmiDetailsModal 
          emi={selectedCcEmiForDetails}
          preferences={preferences}
          onClose={() => setSelectedCcEmiForDetails(null)}
          onToggleInstallment={(num, curr) => handleToggleCcInstallment(selectedCcEmiForDetails.id, num, curr)}
          onPreClose={() => handlePreCloseCcEmi(selectedCcEmiForDetails.id)}
        />
      )}

    </div>
  );
}
