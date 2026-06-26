/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FinanceData, CreditCardEmiMaster, Expense } from '../types';
import { formatCurrency } from '../utils/formatters';
import { generateEmiSchedule } from '../utils/emiCalculations';
import { AlertCircle, Plus, Info, CreditCard, HelpCircle } from 'lucide-react';

interface CcEmiFormProps {
  data: FinanceData;
  setFinanceData: React.Dispatch<React.SetStateAction<FinanceData>>;
  editingEmiId: string | null;
  onClose: () => void;
  prefilledExpense?: Expense | null;
}

export default function CcEmiForm({ 
  data, 
  setFinanceData, 
  editingEmiId, 
  onClose,
  prefilledExpense 
}: CcEmiFormProps) {
  const { accounts, budgets, preferences } = data;
  const creditCards = accounts.filter(acc => acc.type === 'credit_card');

  // Form states
  const [expenseName, setExpenseName] = useState('');
  const [category, setCategory] = useState(budgets[0]?.category || 'Shopping');
  const [cardId, setCardId] = useState(creditCards[0]?.id || '');
  const [transactionDate, setTransactionDate] = useState('');
  const [originalAmount, setOriginalAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [tenure, setTenure] = useState('12');
  const [emiType, setEmiType] = useState<'no_cost' | 'regular'>('no_cost');

  // Regular EMI Inputs
  const [interestRate, setInterestRate] = useState('13.5');
  const [processingFee, setProcessingFee] = useState('199');
  const [conversionFee, setConversionFee] = useState('99');
  const [offerCharge, setOfferCharge] = useState('0');

  // No-Cost EMI Inputs
  const [autoCalculateDiscount, setAutoCalculateDiscount] = useState(true);
  const [merchantDiscount, setMerchantDiscount] = useState('0');

  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [gstRate, setGstRate] = useState(18);

  // Installments paid editing states
  const [initialPaidCount, setInitialPaidCount] = useState(0);
  const [paidInstallmentsCount, setPaidInstallmentsCount] = useState(0);
  const [matchingExpenses, setMatchingExpenses] = useState<Expense[]>([]);
  const [selectedExpenseIdsToDelete, setSelectedExpenseIdsToDelete] = useState<string[]>([]);

  // Set card validation date check
  const [cardValidityDays, setCardValidityDays] = useState(0);

  // Load existing EMI data for editing or prefill from recent transaction
  useEffect(() => {
    if (editingEmiId) {
      const emi = (data.ccEmis || []).find(e => e.id === editingEmiId);
      if (emi) {
        setExpenseName(emi.expenseName);
        setCategory(emi.category || 'Shopping');
        setCardId(emi.cardId);
        setTransactionDate(emi.purchaseDate || emi.startDate); // Use purchaseDate or fallback to startDate
        setOriginalAmount(emi.originalAmount.toString());
        setStartDate(emi.startDate);
        setTenure(emi.tenure.toString());
        setEmiType(emi.emiType);
        setInterestRate(emi.interestRate.toString());
        setProcessingFee(emi.processingFee.toString());
        setConversionFee((emi.conversionFee || 0).toString());
        setOfferCharge(emi.offerCharge.toString());
        setNotes(emi.notes || '');
        setGstRate(emi.gstRate);
        const currentPaid = (emi.installments || []).filter(inst => inst.paidStatus === 'paid').length;
        setInitialPaidCount(currentPaid);
        setPaidInstallmentsCount(currentPaid);
        if (emi.emiType === 'no_cost') {
          setMerchantDiscount(emi.merchantDiscount.toString());
          setAutoCalculateDiscount(emi.merchantDiscount > 0 && emi.interestRate > 0);
        }
      }
    } else if (prefilledExpense) {
      setExpenseName(prefilledExpense.description);
      setCategory(prefilledExpense.category);
      setCardId(prefilledExpense.accountId);
      setTransactionDate(prefilledExpense.date);
      setOriginalAmount(prefilledExpense.amount.toString());
      setStartDate(prefilledExpense.date.substring(0, 7) + '-01'); // YYYY-MM-01
    } else {
      // Set default transaction and start dates
      const today = new Date().toISOString().split('T')[0];
      setTransactionDate(today);
      setStartDate(today.substring(0, 7) + '-01');
    }
  }, [editingEmiId, prefilledExpense, data.ccEmis]);

  // Set card validity warning check
  // E.g. Check if tenure exceeds remaining credit card validity (we can simulate or prompt card validity)
  useEffect(() => {
    // If credit card selected, check card's attributes or tenure warning
    const months = parseInt(tenure, 10);
    if (months > 24) {
      setCardValidityDays(months);
    } else {
      setCardValidityDays(0);
    }
  }, [tenure]);

  // Detect when paid installments are reduced and scan the ledger for matching expenses to delete
  useEffect(() => {
    if (editingEmiId && paidInstallmentsCount < initialPaidCount && paidInstallmentsCount > 0) {
      const emi = (data.ccEmis || []).find(e => e.id === editingEmiId);
      if (emi) {
        const originallyPaidNums = (emi.installments || [])
          .filter(inst => inst.paidStatus === 'paid')
          .map(inst => inst.installmentNumber);

        // Installment numbers that are being unmarked (sequential from paidInstallmentsCount + 1 to initialPaidCount)
        const targetNums = originallyPaidNums.filter(num => num > paidInstallmentsCount);

        const foundExpenses = data.expenses.filter(exp => {
          if (exp.accountId !== emi.cardId) return false;
          return targetNums.some(num => 
            exp.description.includes(emi.expenseName) && 
            exp.description.includes(`(Installment ${num}/`)
          );
        });

        setMatchingExpenses(foundExpenses);
        // By default, select all found expenses for deletion
        setSelectedExpenseIdsToDelete(foundExpenses.map(exp => exp.id));
      }
    } else {
      setMatchingExpenses([]);
      setSelectedExpenseIdsToDelete([]);
    }
  }, [editingEmiId, paidInstallmentsCount, initialPaidCount, data.ccEmis, data.expenses]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!expenseName.trim()) {
      setError('Please provide a descriptive Expense Name.');
      return;
    }

    if (!cardId) {
      setError('Please select an active Credit Card.');
      return;
    }

    const amt = parseFloat(originalAmount);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid positive Product Cost / Purchase Amount.');
      return;
    }

    const monthsVal = parseInt(tenure, 10);
    if (isNaN(monthsVal) || monthsVal <= 0) {
      setError('Tenure must be at least 1 month.');
      return;
    }

    const rateVal = parseFloat(interestRate);
    if (isNaN(rateVal) || rateVal < 0) {
      setError('Interest rate must be a non-negative annual percentage.');
      return;
    }

    const pfVal = parseFloat(processingFee) || 0;
    const cfVal = parseFloat(conversionFee) || 0;
    const ocVal = parseFloat(offerCharge) || 0;

    let manualDiscount = parseFloat(merchantDiscount) || 0;

    // Trigger schedule generation
    try {
      const schedule = generateEmiSchedule({
        expenseName: expenseName.trim(),
        cardId,
        originalAmount: amt,
        emiType,
        interestRate: rateVal,
        tenure: monthsVal,
        merchantDiscount: manualDiscount,
        processingFee: pfVal,
        conversionFee: cfVal,
        offerCharge: ocVal,
        startDate: startDate || new Date().toISOString().split('T')[0],
        purchaseDate: transactionDate || new Date().toISOString().split('T')[0],
        gstRate,
        autoCalculateDiscount: emiType === 'no_cost' && autoCalculateDiscount,
      });

      // Insert or update EMI registry
      setFinanceData(prev => {
        const baseCcEmis = prev.ccEmis || [];
        let updatedList;
        let nextExpenses = [...prev.expenses];
        let nextAccounts = [...prev.accounts];
        let nextCcTransactions = [...(prev.ccTransactions || [])];

        if (editingEmiId) {
          const originalEmi = baseCcEmis.find(item => item.id === editingEmiId);
          
          // 1. Map over the newly generated schedule installments, set their paidStatus
          const updatedInstallments = schedule.installments.map(inst => {
            if (inst.installmentNumber <= paidInstallmentsCount) {
              return { ...inst, paidStatus: 'paid' as const };
            }
            return { ...inst, paidStatus: 'unpaid' as const };
          });

          // 2. Compute outstanding principal based on unpaid installments
          const unpaidInstallments = updatedInstallments.filter(inst => inst.paidStatus === 'unpaid');
          const newOutstanding = unpaidInstallments.reduce((sum, inst) => sum + inst.principalComponent, 0);

          // 3. Status is closed if all paid
          const allPaid = updatedInstallments.every(inst => inst.paidStatus === 'paid');
          const nextStatusMaster = allPaid ? 'closed' as const : (originalEmi ? originalEmi.status : 'active' as const);

          const updatedEmi: CreditCardEmiMaster = {
            ...schedule,
            id: editingEmiId,
            outstandingPrincipal: Math.round(newOutstanding * 100) / 100,
            installments: updatedInstallments,
            status: nextStatusMaster,
          };

          updatedList = baseCcEmis.map(item => item.id === editingEmiId ? updatedEmi : item);

          // 4. Update the Expenses Ledger
          if (originalEmi) {
            if (paidInstallmentsCount === 0) {
              // Delete ALL expenses from expenses ledger for this EMI
              nextExpenses = nextExpenses.filter(exp => {
                if (exp.accountId !== originalEmi.cardId) return true;
                const isMatch = exp.description.includes(originalEmi.expenseName) && 
                                exp.description.includes("EMI Payment:");
                return !isMatch;
              });
            } else if (paidInstallmentsCount < initialPaidCount) {
              // Delete selected expenses that are being removed
              nextExpenses = nextExpenses.filter(exp => !selectedExpenseIdsToDelete.includes(exp.id));
            } else if (paidInstallmentsCount > initialPaidCount) {
              // Add expenses for the newly paid installments
              for (let num = initialPaidCount + 1; num <= paidInstallmentsCount; num++) {
                const inst = updatedInstallments.find(item => item.installmentNumber === num);
                const instAmt = inst ? inst.totalInstallmentAmount : 0;
                const todayString = new Date().toISOString().split('T')[0];
                const newExpense = {
                  id: `exp-ccemi-${Date.now()}-${num}-${Math.floor(Math.random() * 1000)}`,
                  description: `EMI Payment: ${expenseName.trim()} (Installment ${num}/${monthsVal})`,
                  amount: instAmt,
                  category: category || 'Shopping',
                  date: todayString,
                  accountId: cardId,
                  isRecurring: false
                };
                nextExpenses = [newExpense, ...nextExpenses];
              }
            }
          }

          // 5. Update Credit Card Transactions and Accounts
          if (originalEmi) {
            // Revert old transaction logs and card balance
            originalEmi.installments.forEach(inst => {
              if (inst.paidStatus === 'paid') {
                const amt = inst.totalInstallmentAmount;
                nextAccounts = nextAccounts.map(a => {
                  if (a.id === originalEmi.cardId) {
                    return { ...a, balance: Math.max(0, Math.round((a.balance - amt) * 100) / 100) };
                  }
                  return a;
                });
                nextCcTransactions = nextCcTransactions.filter(
                  t => t.id !== `tx_cc_emi-${originalEmi.id}-${inst.installmentNumber}`
                );
              }
            });
          }

          // Apply new transaction logs and card balance for paid installments
          updatedInstallments.forEach(inst => {
            if (inst.paidStatus === 'paid') {
              const amt = inst.totalInstallmentAmount;
              const todayString = new Date().toISOString().split('T')[0];
              nextAccounts = nextAccounts.map(a => {
                if (a.id === cardId) {
                  return { ...a, balance: Math.round((a.balance + amt) * 100) / 100 };
                }
                return a;
              });
              const ccTxId = `tx_cc_emi-${editingEmiId}-${inst.installmentNumber}`;
              const newCcTx = {
                id: ccTxId,
                cardId: cardId,
                type: 'purchase' as const,
                description: `EMI Payment: ${expenseName.trim()} (Installment ${inst.installmentNumber}/${monthsVal})`,
                amount: amt,
                date: todayString,
                category: category || 'Shopping',
              };
              nextCcTransactions.push(newCcTx);
            }
          });

        } else {
          // Add newly converted EMI
          const scheduleWithRef = prefilledExpense 
            ? { ...schedule, convertedFromExpenseId: prefilledExpense.id }
            : schedule;
          updatedList = [...baseCcEmis, scheduleWithRef];

          // If converting an existing card purchase (prefilledExpense), we log an emi_conversion transaction
          // that credits back/offset-refunds the full purchase amount from the active statement balance.
          if (prefilledExpense) {
            const conversionTxId = `tx_cc_conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            const conversionTx = {
              id: conversionTxId,
              cardId: cardId,
              type: 'emi_conversion' as const,
              description: `Converted to EMI: ${prefilledExpense.description}`,
              amount: prefilledExpense.amount,
              date: new Date().toISOString().split('T')[0],
              category: prefilledExpense.category || 'Shopping',
            };
            nextCcTransactions = [conversionTx, ...nextCcTransactions];

            // Refund/offset the full purchase amount from the active credit card balance
            nextAccounts = nextAccounts.map(a => {
              if (a.id === cardId) {
                return { ...a, balance: Math.max(0, Math.round((a.balance - prefilledExpense.amount) * 100) / 100) };
              }
              return a;
            });
          }
        }

        return {
          ...prev,
          ccEmis: updatedList,
          expenses: nextExpenses,
          accounts: nextAccounts,
          ccTransactions: nextCcTransactions,
        };
      });

      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error generating EMI schedule.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-4 max-w-4xl animate-fade-in text-left">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-indigo-500" />
          {editingEmiId ? 'Edit Credit Card EMI Parameters' : 'Convert Transaction Into CC EMI Account'}
        </h3>
        <span className="text-[10px] bg-slate-100 font-extrabold text-slate-500 px-2.5 py-0.5 rounded uppercase">
          Dynamic Calculators
        </span>
      </div>

      {error && (
        <div className="bg-rose-50 text-rose-750 text-xs font-bold p-3 rounded-xl border border-rose-100 flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {cardValidityDays > 0 && (
        <div className="bg-amber-50 text-amber-700 text-[10px] font-bold p-3 rounded-xl border border-amber-100 flex items-start gap-1.5 leading-tight animate-pulse">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <span className="font-extrabold uppercase">Tenure Duration Warning:</span>
            <p className="font-medium mt-0.5">Please ensure your selected physical credit card remains valid for the entire ({cardValidityDays} months) tenure period. Banks might reject conversions aligning near card expiration limits.</p>
          </div>
        </div>
      )}

      {prefilledExpense && (
        <div className="bg-emerald-50 text-emerald-800 text-[10.5px] font-bold p-3 rounded-xl border border-emerald-150 flex items-center gap-2">
          <span className="font-extrabold uppercase bg-emerald-100 px-2 py-0.5 rounded text-[9px] text-emerald-700">Converting Transaction</span>
          <span>Prefilled "{prefilledExpense.description}" ({formatCurrency(prefilledExpense.amount, preferences)}) successfully!</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* EXPENSE NAME */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Expense Name</label>
          <input
            type="text"
            value={expenseName}
            onChange={(e) => setExpenseName(e.target.value)}
            placeholder="e.g. Sony Bravia 55 inch OLED"
            className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
          />
        </div>

        {/* CREDIT CARD SELECT */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Credit Card</label>
          <select
            value={cardId}
            onChange={(e) => setCardId(e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:outline-none focus:border-indigo-500 font-semibold text-slate-700"
          >
            <option value="">-- Select Credit Card --</option>
            {creditCards.map(cc => (
              <option key={cc.id} value={cc.id}>
                {cc.institution} - {cc.name} (Lim: {formatCurrency(cc.limit || 0, preferences)})
              </option>
            ))}
          </select>
        </div>

        {/* SPEND BUDGET CATEGORY */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Budget Category</label>
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

        {/* PRODUCT COST */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Product Original Cost</label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">{preferences.currencySymbol}</span>
            <input
              type="number"
              value={originalAmount}
              onChange={(e) => setOriginalAmount(e.target.value)}
              placeholder="e.g. 54999"
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 pl-7 bg-slate-50 focus:outline-none focus:border-indigo-500 font-mono font-black text-slate-800"
            />
          </div>
        </div>

        {/* TRANSACTION DATE */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Purchase Date</label>
          <input
            type="date"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
          />
        </div>

        {/* EMI START DATE */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">First Installment Due Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:outline-none focus:border-indigo-500 font-bold text-slate-800 font-mono"
          />
        </div>

        {/* TENURE MONTHS */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">EMI Tenure (Months)</label>
          <select
            value={tenure}
            onChange={(e) => setTenure(e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:outline-none focus:border-indigo-500 font-bold text-slate-800"
          >
            <option value="3">3 Months</option>
            <option value="6">6 Months</option>
            <option value="9">9 Months</option>
            <option value="12">12 Months</option>
            <option value="18">18 Months</option>
            <option value="24">24 Months</option>
            <option value="36">36 Months</option>
          </select>
        </div>

        {/* EMI TYPE SELECTION */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Card EMI Type</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setEmiType('no_cost');
                setInterestRate('14.5'); // standard bank interest rate for No-Cost calculations
              }}
              className={`py-2 px-3 text-[11px] font-bold rounded-lg border transition ${emiType === 'no_cost' ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
            >
              No-Cost EMI
            </button>
            <button
              type="button"
              onClick={() => {
                setEmiType('regular');
                setInterestRate('15.5');
              }}
              className={`py-2 px-3 text-[11px] font-bold rounded-lg border transition ${emiType === 'regular' ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
            >
              Regular EMI
            </button>
          </div>
        </div>

        {/* GST COMPONENT RATE (Fixed at 18%) */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Applicable GST Rate</label>
          <input
            type="text"
            value="18% GST (Standard Bank service charge)"
            disabled
            className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-100 font-bold text-slate-500 cursor-not-allowed"
          />
        </div>
      </div>

      <div className="border-t border-slate-50 pt-3 mt-2 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* ANNUAL INTEREST RATE */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
            Annual Interest Rate (%)
          </label>
          <div className="relative">
            <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">%</span>
            <input
              type="number"
              step="0.01"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              placeholder="e.g. 15.5"
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 pr-7 bg-slate-50 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
            />
          </div>
        </div>

        {/* PROCESSING FEE */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
            Processing Fee (1st Month)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">{preferences.currencySymbol}</span>
            <input
              type="number"
              value={processingFee}
              onChange={(e) => setProcessingFee(e.target.value)}
              placeholder="e.g. 199"
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 pl-7 bg-slate-50 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
            />
          </div>
        </div>

        {/* CONVERSION FEE */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
            Conversion Fee (1st Month)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">{preferences.currencySymbol}</span>
            <input
              type="number"
              value={conversionFee}
              onChange={(e) => setConversionFee(e.target.value)}
              placeholder="e.g. 99"
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 pl-7 bg-slate-50 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
            />
          </div>
        </div>

        {/* OFFER CHARGE */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
            Offer Redemption Charge (1st Month)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">{preferences.currencySymbol}</span>
            <input
              type="number"
              value={offerCharge}
              onChange={(e) => setOfferCharge(e.target.value)}
              placeholder="0 If None"
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 pl-7 bg-slate-50 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
            />
          </div>
        </div>
      </div>

      {emiType === 'no_cost' && (
        <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
              <Info className="w-3.5 h-3.5" /> No-Cost Merchant Discount Settings
            </span>
            <div className="flex items-center gap-1">
              <input
                type="checkbox"
                id="autoCalculateDiscount"
                checked={autoCalculateDiscount}
                onChange={(e) => setAutoCalculateDiscount(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="autoCalculateDiscount" className="text-xs font-extrabold text-slate-700 cursor-pointer">
                Auto-calculate discount
              </label>
            </div>
          </div>

          {autoCalculateDiscount ? (
            <p className="text-[10px] text-slate-500 italic leading-relaxed">
              * The app will automatically calculate the upfront <strong>Merchant Discount</strong> required to offset the reducing balance interest of <strong>{interestRate}% APR</strong> over <strong>{tenure} months</strong>. The user's net financial principal paid will sum precisely to the original item cost.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-xs font-bold text-slate-505 uppercase mb-1">Merchant Discount Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">{preferences.currencySymbol}</span>
                  <input
                    type="number"
                    value={merchantDiscount}
                    onChange={(e) => setMerchantDiscount(e.target.value)}
                    placeholder="Provide fixed discount amount"
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 pl-7 bg-slate-50 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
                  />
                </div>
              </div>
              <p className="text-[9.5px] text-slate-400 leading-tight">
                * Specify the exact upfront discount given by the vendor during billing. Financed Principal becomes: original amount - merchant discount.
              </p>
            </div>
          )}
        </div>
      )}

      {/* EDIT PAID INSTALLMENTS SECTION */}
      {editingEmiId && (
        <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Installments Paid</label>
              <select
                value={paidInstallmentsCount}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setPaidInstallmentsCount(val);
                }}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:border-indigo-500 font-bold text-slate-800"
              >
                {Array.from({ length: parseInt(tenure, 10) + 1 }, (_, idx) => (
                  <option key={idx} value={idx}>
                    {idx} of {tenure} Paid
                  </option>
                ))}
              </select>
            </div>
            <div className="text-[10.5px] text-slate-500 font-medium leading-relaxed self-center text-left">
              Editing paid installments will automatically update the outstanding principal and ledger logs. 
              {paidInstallmentsCount === 0 && initialPaidCount > 0 && (
                <span className="text-rose-600 block font-bold mt-1">
                  ⚠️ Setting to 0 will automatically delete all matching ledger expenses for this EMI!
                </span>
              )}
            </div>
          </div>

          {/* Ask which transactions to delete from expenses ledger */}
          {paidInstallmentsCount > 0 && paidInstallmentsCount < initialPaidCount && matchingExpenses.length > 0 && (
            <div className="border-t border-slate-150 pt-3 animate-fade-in text-left">
              <span className="text-[10.5px] font-black text-rose-700 uppercase tracking-wider block mb-1.5">
                Select transactions to delete from Expenses Ledger:
              </span>
              <p className="text-[10px] text-slate-500 mb-2 font-medium">
                You are reducing paid installments from {initialPaidCount} to {paidInstallmentsCount}. Select which existing ledger expenses to delete:
              </p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto bg-white p-2.5 rounded-lg border border-slate-200">
                {matchingExpenses.map(exp => {
                  const isChecked = selectedExpenseIdsToDelete.includes(exp.id);
                  return (
                    <label key={exp.id} className="flex items-start gap-2.5 p-1.5 hover:bg-slate-50 rounded cursor-pointer text-xs font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedExpenseIdsToDelete(prev => prev.filter(id => id !== exp.id));
                          } else {
                            setSelectedExpenseIdsToDelete(prev => [...prev, exp.id]);
                          }
                        }}
                        className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 mt-0.5"
                      />
                      <div className="flex-1 text-left">
                        <div className="flex justify-between font-bold">
                          <span>{exp.description}</span>
                          <span className="font-mono text-slate-900">{formatCurrency(exp.amount, preferences)}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">Date: {exp.date}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* INTERNAL NOTES FIELD */}
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description / Internal Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Purchased during holiday sale promotion."
          rows={1.5}
          className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 focus:outline-none focus:border-indigo-500 text-slate-700 font-semibold"
        />
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-bold text-slate-500 hover:text-slate-700.md px-3.5 py-2 font-semibold"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-xs transition hover:shadow cursor-pointer"
        >
          {editingEmiId ? 'Update Card EMI Plan' : 'Instantiate EMI Plan'}
        </button>
      </div>
    </form>
  );
}
