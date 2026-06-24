/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FinanceData, FinancialAccount } from '../types';
import { formatCurrency } from '../utils/formatters';
import { getBillingCycleRange, filterExpensesByRange } from '../utils/billing';
import { 
  Building, 
  CreditCard, 
  Plus, 
  Trash2, 
  Landmark, 
  Check, 
  AlertCircle, 
  Edit, 
  ArrowRightLeft, 
  CheckCircle,
  GripVertical,
  Link,
  Star,
  X
} from 'lucide-react';
import { motion } from 'motion/react';

interface AccountsSectionProps {
  data: FinanceData;
  setFinanceData: React.Dispatch<React.SetStateAction<FinanceData>>;
}

export default function AccountsSection({ data, setFinanceData }: AccountsSectionProps) {
  const { accounts, preferences } = data;

  // Add/Edit common fields
  const [institution, setInstitution] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<'bank' | 'credit_card'>('bank');
  const [limit, setLimit] = useState('');
  const [color, setColor] = useState('#0284c7');
  const [balance, setBalance] = useState('');
  const [billingCycleStartDay, setBillingCycleStartDay] = useState<string>('15');
  const [mabRequired, setMabRequired] = useState(false);
  const [minimumAverageBalance, setMinimumAverageBalance] = useState('');

  // Card-by-Card Statement Cycle Selection tracking
  // Key: accountId, Value: "YYYY-MM"
  const [selectedCardCycles, setSelectedCardCycles] = useState<Record<string, string>>({});

  // Shared Limit Pool States
  const [sharedLimitOption, setSharedLimitOption] = useState<'standalone' | 'link'>('standalone');
  const [linkToCardId, setLinkToCardId] = useState('');
  const [isMainCard, setIsMainCard] = useState(false);

  // Edit Mode tracking
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);

  // Self Transfer State
  const [transferSource, setTransferSource] = useState('');
  const [transferTarget, setTransferTarget] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferError, setTransferError] = useState('');
  const [transferSuccess, setTransferSuccess] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [accountToDelete, setAccountToDelete] = useState<{ id: string; name: string } | null>(null);

  // Credit Card Payment State
  const [payCardId, setPayCardId] = useState('');
  const [paySourceBankId, setPaySourceBankId] = useState('');
  const [payOption, setPayOption] = useState<'full' | 'custom'>('full');
  const [payCustomAmount, setPayCustomAmount] = useState('');
  const [payError, setPayError] = useState('');
  const [paySuccess, setPaySuccess] = useState('');

  const bankAccounts = accounts.filter(a => a.type === 'bank');
  const creditCards = accounts.filter(a => a.type === 'credit_card');
  const otherCreditCards = creditCards.filter(c => c.id !== editingAccountId);

  // Auto-set selects for transfer when accounts change
  useEffect(() => {
    if (bankAccounts.length >= 2) {
      if (!transferSource) setTransferSource(bankAccounts[0].id);
      if (!transferTarget) setTransferTarget(bankAccounts[1].id);
    }
  }, [accounts]);

  // Auto-set dynamic selections for credit card payments
  useEffect(() => {
    const bankIds = bankAccounts.map(b => b.id);
    const cardIds = creditCards.map(c => c.id);

    if (paySourceBankId && !bankIds.includes(paySourceBankId)) {
      setPaySourceBankId(bankIds[0] || '');
    } else if (!paySourceBankId && bankIds.length > 0) {
      setPaySourceBankId(bankIds[0]);
    }

    if (payCardId && !cardIds.includes(payCardId)) {
      setPayCardId(cardIds[0] || '');
    } else if (!payCardId && cardIds.length > 0) {
      setPayCardId(cardIds[0]);
    }
  }, [accounts, paySourceBankId, payCardId, bankAccounts.length, creditCards.length]);

  const getRecentMonths = () => {
    const list = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) + " Statement";
      list.push({ value, label });
    }
    return list;
  };

  const colorPresets = [
    { name: 'Emerald Green', value: '#10b981' },
    { name: 'Sky Blue', value: '#0284c7' },
    { name: 'HDFC Navy', value: '#004481' },
    { name: 'Premium Jet Black', value: '#1e293b' },
    { name: 'Crimson Wine', value: '#9f1239' },
    { name: 'ICICI Orange', value: '#f97316' },
    { name: 'Amex Platinum Gray', value: '#64748b' },
    { name: 'Purple Dream', value: '#7c3aed' },
  ];

  // Helper to extract clean descriptor name, removing any prefixed institution names or duplicates
  const getCleanDescriptor = (rawName: string, instVal: string): string => {
    let clean = rawName.trim();
    const instClean = instVal.trim();
    if (!clean || !instClean) return clean;

    // 1. If it contains " - ", split and take the right segment
    if (clean.includes(' - ')) {
      const parts = clean.split(' - ');
      // Drop the first part as it's almost always the institution prefix
      clean = parts.slice(1).join(' - ');
    }

    // 2. Strip the current institution name if it is at the start (case-insensitive)
    if (clean.toLowerCase().startsWith(instClean.toLowerCase())) {
      clean = clean.substring(instClean.length).replace(/^[-\s]+/, '');
    }

    // 3. Strip individual significant words of the institution name from the start to prevent repetition
    const words = instClean.split(/\s+/).filter(w => w.length > 2);
    for (const w of words) {
      if (clean.toLowerCase().startsWith(w.toLowerCase())) {
        const escapedWord = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`^${escapedWord}\\s*`, 'i');
        clean = clean.replace(regex, '').replace(/^[-\s]+/, '');
      }
    }

    return clean.trim();
  };

  // Start Editing Account
  const handleStartEdit = (acc: FinancialAccount) => {
    setEditingAccountId(acc.id);
    setInstitution(acc.institution);
    
    // Separate institution from descriptive name using our robust helper
    const cleanName = getCleanDescriptor(acc.name, acc.institution);
    setName(cleanName);
    setType(acc.type);
    setColor(acc.color);
    setLimit(acc.limit ? acc.limit.toString() : '');
    setBalance(acc.balance.toString());
    setBillingCycleStartDay(acc.billingCycleStartDay ? acc.billingCycleStartDay.toString() : '15');
    setSharedLimitOption(acc.linkedGroupId ? 'link' : 'standalone');
    setIsMainCard(acc.isMainCard || false);
    setMabRequired(acc.mabRequired || false);
    setMinimumAverageBalance(acc.minimumAverageBalance ? acc.minimumAverageBalance.toString() : '');
    if (acc.linkedGroupId) {
      const sibling = accounts.find(c => c.type === 'credit_card' && c.linkedGroupId === acc.linkedGroupId && c.id !== acc.id);
      setLinkToCardId(sibling ? sibling.id : '');
    } else {
      setLinkToCardId('');
    }
    setError('');
    setSuccess('');
  };

  // Cancel Editing
  const handleCancelEdit = () => {
    setEditingAccountId(null);
    setInstitution('');
    setName('');
    setLimit('');
    setBalance('');
    setBillingCycleStartDay('15');
    setSharedLimitOption('standalone');
    setLinkToCardId('');
    setIsMainCard(false);
    setMabRequired(false);
    setMinimumAverageBalance('');
    setError('');
  };

  // Maintenance helper for linked groups
  const maintainLinkedGroups = (accountsList: FinancialAccount[]): FinancialAccount[] => {
    const groupCounts: { [key: string]: number } = {};
    accountsList.forEach(acc => {
      if (acc.type === 'credit_card' && acc.linkedGroupId) {
        groupCounts[acc.linkedGroupId] = (groupCounts[acc.linkedGroupId] || 0) + 1;
      }
    });

    return accountsList.map(acc => {
      if (acc.type === 'credit_card' && acc.linkedGroupId) {
        if (groupCounts[acc.linkedGroupId] <= 1) {
          // Disband group with < 2 elements
          return {
            ...acc,
            linkedGroupId: undefined,
            isMainCard: undefined
          };
        } else {
          // Double check that at least one card in each sibling group is marked as main.
          // If none is main, designate one.
          const groupSiblings = accountsList.filter(c => c.type === 'credit_card' && c.linkedGroupId === acc.linkedGroupId);
          const hasMain = groupSiblings.some(c => c.isMainCard);
          if (!hasMain) {
            // Designate the first sibling as main
            const firstSiblingId = groupSiblings[0].id;
            if (acc.id === firstSiblingId) {
              return {
                ...acc,
                isMainCard: true
              };
            }
          }
        }
      }
      return acc;
    });
  };

  // Form Submission
  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!institution.trim() || !name.trim()) {
      setError('Please provide BOTH the bank/institution name and account descriptor.');
      return;
    }

    const parsedLimit = parseFloat(limit);
    const limitRequired = type === 'credit_card' && (sharedLimitOption === 'standalone' || isMainCard);

    if (limitRequired && (isNaN(parsedLimit) || parsedLimit <= 0)) {
      setError('Please specify a valid credit limit greater than 0.');
      return;
    }

    if (type === 'credit_card' && sharedLimitOption === 'link' && !linkToCardId) {
      setError('Please select a credit card to link this card with.');
      return;
    }

    const parsedBillingDay = type === 'credit_card' ? (parseInt(billingCycleStartDay) || 15) : undefined;
    if (type === 'credit_card' && parsedBillingDay !== undefined && (parsedBillingDay < 1 || parsedBillingDay > 31)) {
      setError('Please specify a billing cycle start day between 1 and 31.');
      return;
    }

    const parsedMab = parseFloat(minimumAverageBalance);
    if (type === 'bank' && mabRequired && (isNaN(parsedMab) || parsedMab < 0)) {
      setError('Please specify a valid Minimum Average Balance (MAB) required.');
      return;
    }

    // Always clean descriptor name before storing to eliminate double headers
    const cleanDescriptor = getCleanDescriptor(name, institution);
    const formattedFullName = `${institution.trim()} - ${cleanDescriptor}`;

    let computedGroupId: string | undefined = undefined;
    if (type === 'credit_card' && sharedLimitOption === 'link' && linkToCardId) {
      const parentCard = accounts.find(a => a.id === linkToCardId);
      if (parentCard) {
        computedGroupId = parentCard.linkedGroupId || `group-${parentCard.id}`;
      }
    }

    if (editingAccountId) {
      const parsedBalance = parseFloat(balance);
      if (isNaN(parsedBalance)) {
        setError('Please specify a valid balance.');
        return;
      }

      setFinanceData(prev => {
        let updatedList = prev.accounts.map(acc => {
          if (acc.id === editingAccountId) {
            return {
              ...acc,
              name: formattedFullName,
              institution: institution.trim(),
              type,
              color,
              balance: parsedBalance,
              limit: limitRequired ? parsedLimit : undefined,
              linkedGroupId: computedGroupId,
              isMainCard: computedGroupId ? isMainCard : undefined,
              billingCycleStartDay: parsedBillingDay,
              mabRequired: type === 'bank' ? mabRequired : undefined,
              minimumAverageBalance: (type === 'bank' && mabRequired) ? parsedMab : undefined
            };
          }
          return acc;
        });

        if (computedGroupId) {
          // If we mapped current card to group, update other group members if current is made main
          updatedList = updatedList.map(acc => {
            if (acc.type === 'credit_card') {
              if (acc.id === linkToCardId) {
                return {
                  ...acc,
                  linkedGroupId: computedGroupId,
                  isMainCard: isMainCard ? false : (acc.isMainCard !== undefined ? acc.isMainCard : true)
                };
              } else if (acc.linkedGroupId === computedGroupId && acc.id !== editingAccountId) {
                return {
                  ...acc,
                  isMainCard: isMainCard ? false : acc.isMainCard
                };
              }
            }
            return acc;
          });
        }

        updatedList = maintainLinkedGroups(updatedList);

        return {
          ...prev,
          accounts: updatedList
        };
      });

      setSuccess('Account updated successfully!');
      setEditingAccountId(null);
      setInstitution('');
      setName('');
      setLimit('');
      setBalance('');
      setBillingCycleStartDay('15');
      setSharedLimitOption('standalone');
      setLinkToCardId('');
      setIsMainCard(false);
      setMabRequired(false);
      setMinimumAverageBalance('');
    } else {
      // Register New Account
      const newAccount: FinancialAccount = {
        id: `acc-${Date.now()}`,
        name: formattedFullName,
        type,
        institution: institution.trim(),
        balance: 0, // Starts at 0, updated via transactions/transfers
        color,
        limit: limitRequired ? parsedLimit : undefined,
        linkedGroupId: computedGroupId,
        isMainCard: computedGroupId ? isMainCard : undefined,
        billingCycleStartDay: parsedBillingDay,
        mabRequired: type === 'bank' ? mabRequired : undefined,
        minimumAverageBalance: (type === 'bank' && mabRequired) ? parsedMab : undefined
      };

      setFinanceData(prev => {
        let updatedList = [...prev.accounts];
        if (computedGroupId) {
          // Update the targeted sister card
          updatedList = updatedList.map(acc => {
            if (acc.type === 'credit_card') {
              if (acc.id === linkToCardId) {
                return {
                  ...acc,
                  linkedGroupId: computedGroupId,
                  isMainCard: isMainCard ? false : (acc.isMainCard !== undefined ? acc.isMainCard : true)
                };
              } else if (acc.linkedGroupId === computedGroupId) {
                return {
                  ...acc,
                  isMainCard: isMainCard ? false : acc.isMainCard
                };
              }
            }
            return acc;
          });
        }

        updatedList = [...updatedList, newAccount];
        updatedList = maintainLinkedGroups(updatedList);

        return {
          ...prev,
          accounts: updatedList
        };
      });

      setSuccess('Dynamic financial source registered successfully!');
      setInstitution('');
      setName('');
      setLimit('');
      setBillingCycleStartDay('15');
      setSharedLimitOption('standalone');
      setLinkToCardId('');
      setIsMainCard(false);
      setMabRequired(false);
      setMinimumAverageBalance('');
    }

    setTimeout(() => setSuccess(''), 4000);
  };

  // self bank transfer logic
  const handleSelfTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');
    setTransferSuccess('');

    if (!transferSource || !transferTarget) {
      setTransferError('Please configure both source and destination checking vaults.');
      return;
    }

    if (transferSource === transferTarget) {
      setTransferError('Source and target bank accounts must be different.');
      return;
    }

    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0) {
      setTransferError('Please key in a positive draft amount to transfer.');
      return;
    }

    const srcAcc = accounts.find(a => a.id === transferSource);
    const destAcc = accounts.find(a => a.id === transferTarget);

    if (!srcAcc || !destAcc) {
      setTransferError('Selected checking vaults could not be resolved.');
      return;
    }

    if (srcAcc.balance < amt) {
      setTransferError(`Insufficient capital in ${srcAcc.institution}. Maximum transferrable holds: ${formatCurrency(srcAcc.balance, preferences, 2)}`);
      return;
    }

    // Process balances update
    const updatedAccounts = accounts.map(a => {
      if (a.id === transferSource) {
        return { ...a, balance: a.balance - amt };
      }
      if (a.id === transferTarget) {
        return { ...a, balance: a.balance + amt };
      }
      return a;
    });

    // Create a self-transfer logging expense representation
    // To record the paper audit trail nicely!
    const transferExpenseRepresentation = {
      id: `exp-transfer-${Date.now()}`,
      description: `Self-Transfer: ${srcAcc.institution} → ${destAcc.institution}`,
      amount: amt,
      category: 'Miscellaneous',
      date: new Date().toISOString().split('T')[0],
      accountId: transferSource,
      isRecurring: false,
    };

    setFinanceData(prev => ({
      ...prev,
      accounts: updatedAccounts,
      expenses: [transferExpenseRepresentation, ...prev.expenses]
    }));

    setTransferAmount('');
    setTransferSuccess(`Transferred ${formatCurrency(amt, preferences, 2)} from ${srcAcc.institution} to ${destAcc.institution}! Paper audit created.`);
    setTimeout(() => setTransferSuccess(''), 5000);
  };

  // Credit Card Bill Payment handler
  const handleCreditCardPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setPayError('');
    setPaySuccess('');

    if (!paySourceBankId || !payCardId) {
      setPayError('Please select both a source bank and a credit card.');
      return;
    }

    const srcAcc = accounts.find(a => a.id === paySourceBankId);
    const cardAcc = accounts.find(a => a.id === payCardId);

    if (!srcAcc || !cardAcc) {
      setPayError('Selected accounts could not be resolved.');
      return;
    }

    let amt = 0;
    if (payOption === 'full') {
      amt = cardAcc.balance;
      if (amt <= 0) {
        setPayError(`"${cardAcc.name}" has no outstanding balance to pay.`);
        return;
      }
    } else {
      amt = parseFloat(payCustomAmount);
      if (isNaN(amt) || amt <= 0) {
        setPayError('Please specify a valid payment amount greater than 0.');
        return;
      }
    }

    if (srcAcc.balance < amt) {
      setPayError(`Insufficient balance in ${srcAcc.institution}. Maximum payment amount: ${formatCurrency(srcAcc.balance, preferences, 2)}`);
      return;
    }

    // Process balances update
    const updatedAccounts = accounts.map(a => {
      if (a.id === paySourceBankId) {
        return { ...a, balance: a.balance - amt }; // Bank balance decreases by amt
      }
      if (a.id === payCardId) {
        return { ...a, balance: Math.max(0, a.balance - amt) }; // Credit card outstanding balance decreases by amt
      }
      return a;
    });

    // Create custom expense to preserve paper audit trail
    const ccPayExpense = {
      id: `exp-ccpay-${Date.now()}`,
      description: `CC Payment: Paid ${formatCurrency(amt, preferences, 2)} to ${cardAcc.name}`,
      amount: amt,
      category: 'Miscellaneous',
      date: new Date().toISOString().split('T')[0],
      accountId: paySourceBankId, // The funds come from the bank account
      isRecurring: false,
    };

    setFinanceData(prev => ({
      ...prev,
      accounts: updatedAccounts,
      expenses: [ccPayExpense, ...prev.expenses]
    }));

    setPayCustomAmount('');
    setPaySuccess(`Successfully paid ${formatCurrency(amt, preferences, 2)} to ${cardAcc.name} using ${srcAcc.institution}! Outstanding card balance updated.`);
    setTimeout(() => setPaySuccess(''), 5000);
  };

  const handleDeleteAccount = (id: string, name: string) => {
    setAccountToDelete({ id, name });
  };

  const confirmDeleteAccount = () => {
    if (!accountToDelete) return;
    const { id } = accountToDelete;
    setFinanceData(prev => {
      const filtered = prev.accounts.filter(acc => acc.id !== id);
      return {
        ...prev,
        accounts: maintainLinkedGroups(filtered)
      };
    });
    if (editingAccountId === id) {
      handleCancelEdit();
    }
    setAccountToDelete(null);
  };

  // Drag and Drop reordering state & handlers
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...accounts];
    const [draggedItem] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);

    setFinanceData(prev => ({
      ...prev,
      accounts: updated
    }));

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div id="accounts-root" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT COLUMN: FORMS & CONTROLS */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* ADD/EDIT ACCOUNT FORM */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm h-fit">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-50 mb-4">
            <Landmark className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-800">
              {editingAccountId ? 'Edit Bank or Card' : 'Add Bank or Card'}
            </h2>
          </div>
          
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            {editingAccountId 
              ? 'Alter properties of this active payment layout. Capital balances remain preserved.'
              : 'Add checking registers or credit lines. Starting balance initiates at 0, adapting instantly with each recorded income or payment.'
            }
          </p>

          <form onSubmit={handleSaveAccount} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Financial Institution</label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g. HDFC Bank, ICICI Bank, SBI, Amex"
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Account Descriptor</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Core Checking, Premium Visa, Cashback Platinum"
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Instrument Type</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  disabled={editingAccountId !== null}
                  onClick={() => setType('bank')}
                  className={`py-2.5 px-3 text-xs font-semibold rounded-lg border transition flex items-center justify-center gap-1.5 ${editingAccountId ? 'opacity-50 cursor-not-allowed' : ''} ${type === 'bank' ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                >
                  <Building className="w-4 h-4" /> Bank Account
                </button>
                <button
                  type="button"
                  disabled={editingAccountId !== null}
                  onClick={() => setType('credit_card')}
                  className={`py-2.5 px-3 text-xs font-semibold rounded-lg border transition flex items-center justify-center gap-1.5 ${editingAccountId ? 'opacity-50 cursor-not-allowed' : ''}  ${type === 'credit_card' ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                >
                  <CreditCard className="w-4 h-4" /> Credit Card
                </button>
              </div>
            </div>

            {/* Bank account specific configuration (MAB) */}
            {type === 'bank' && (
              <div className="space-y-4 border border-slate-100 dark:border-slate-800 rounded-xl p-3.5 bg-slate-50/50 dark:bg-slate-900/40">
                <h4 className="text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
                  <Building className="w-3.5 h-3.5 text-indigo-500" /> Balance Maintenance
                </h4>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="mabRequiredCheckbox"
                    checked={mabRequired}
                    onChange={(e) => setMabRequired(e.target.checked)}
                    className="w-3.5 h-3.5 border-slate-300 dark:border-slate-700 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="mabRequiredCheckbox" className="text-xs font-bold text-slate-650 dark:text-slate-300 cursor-pointer select-none">
                    Maintain Minimum Average Balance (MAB)
                  </label>
                </div>

                {mabRequired && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Required Minimum Balance (MAB Amount)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">{preferences.currencySymbol}</span>
                      <input
                        type="number"
                        value={minimumAverageBalance}
                        onChange={(e) => setMinimumAverageBalance(e.target.value)}
                        onWheel={(e) => e.currentTarget.blur()}
                        autoComplete="off"
                        placeholder="e.g. 5000"
                        className="w-full text-xs border border-slate-200 dark:border-slate-850 rounded-lg p-2.5 pl-7 bg-white dark:bg-slate-900 focus:outline-none focus:border-indigo-500 font-bold text-slate-850 dark:text-slate-200"
                      />
                    </div>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">
                      PalsaFlow will highlight this bank channel if its current book balance drops lower than this MAB buffer limit.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Credit limit and shared limit configuration */}
            {type === 'credit_card' && (
              <div className="space-y-4 border border-slate-100 dark:border-slate-800 rounded-xl p-3.5 bg-slate-50/50 dark:bg-slate-900/40">
                <h4 className="text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
                  <Link className="w-3.5 h-3.5 text-indigo-500" /> Limit Sharing Configuration
                </h4>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Limit Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSharedLimitOption('standalone');
                        setIsMainCard(false);
                      }}
                      className={`py-2 px-2.5 text-[11px] font-bold rounded-lg border transition text-center cursor-pointer ${
                        sharedLimitOption === 'standalone'
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800/85 text-indigo-700 dark:text-indigo-400 font-extrabold shadow-xs'
                          : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      Standalone Limit
                    </button>
                    <button
                      type="button"
                      disabled={otherCreditCards.length === 0}
                      onClick={() => {
                        setSharedLimitOption('link');
                        if (otherCreditCards.length > 0 && !linkToCardId) {
                          setLinkToCardId(otherCreditCards[0].id);
                        }
                      }}
                      className={`py-2 px-2.5 text-[11px] font-bold rounded-lg border transition text-center cursor-pointer ${
                        otherCreditCards.length === 0 ? 'opacity-40 cursor-not-allowed' : ''
                      } ${
                        sharedLimitOption === 'link'
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800/85 text-indigo-700 dark:text-indigo-400 font-extrabold shadow-xs'
                          : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                      title={otherCreditCards.length === 0 ? "You need at least one other Credit Card to use limit sharing" : ""}
                    >
                      Shared Limit Pool
                    </button>
                  </div>
                  {otherCreditCards.length === 0 && (
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 italic mt-1 block">
                      * Register another credit card first to share limit pools.
                    </span>
                  )}
                </div>

                {sharedLimitOption === 'link' && otherCreditCards.length > 0 && (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Link to Sister Credit Card
                      </label>
                      <select
                        value={linkToCardId}
                        onChange={(e) => setLinkToCardId(e.target.value)}
                        className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg p-2 bg-white dark:bg-slate-900 font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                      >
                        {otherCreditCards.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.institution} - {getCleanDescriptor(c.name, c.institution)}
                          </option>
                        ))}
                      </select>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">
                        Both cards will connect into a unified shared limit buffer pool.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-850">
                      <input
                        type="checkbox"
                        id="isMainCard"
                        checked={isMainCard}
                        onChange={(e) => setIsMainCard(e.target.checked)}
                        className="w-3.5 h-3.5 border-slate-300 dark:border-slate-700 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <label htmlFor="isMainCard" className="text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                        Designate as Main Card of this shared pool
                      </label>
                    </div>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 -mt-1 pl-5.5">
                      The credit limit defines the overall pool's spending limit. Other linked cards will inherit and reduce this limit pool.
                    </p>
                  </div>
                )}

                {/* Show limit input if standalone or main card */}
                {(sharedLimitOption === 'standalone' || isMainCard) ? (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-850">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-sans">
                      {isMainCard ? 'Unified Pool Shared Credit Limit' : 'Card Credit Limit'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">{preferences.currencySymbol}</span>
                      <input
                        type="number"
                        value={limit}
                        onChange={(e) => setLimit(e.target.value)}
                        onWheel={(e) => e.currentTarget.blur()}
                        autoComplete="off"
                        placeholder="e.g. 150000"
                        className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 pl-7 bg-white dark:bg-slate-900 focus:outline-none focus:border-indigo-500 font-bold text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">
                      {isMainCard ? 'Our overall pool budget limit.' : 'Individual maximum credit holding available.'}
                    </p>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-850 bg-indigo-55/10 dark:bg-indigo-950/15 p-2 rounded-lg">
                    <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                      ℹ️ Shared Limit Pool inherited
                    </p>
                    <p className="text-[9.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                      This card automatically shares and consumes credit capacity from the Main card of the pool. Limit adjustment can be performed directly on the Main card.
                    </p>
                  </div>
                )}

                {/* Billing Cycle Day */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Monthly Statement Billing Start Cycle (Day of Month)
                  </label>
                  <select
                    value={billingCycleStartDay}
                    onChange={(e) => setBillingCycleStartDay(e.target.value)}
                    className="w-full text-xs border border-slate-200 dark:border-slate-850 rounded-lg p-2.5 bg-white dark:bg-slate-900 focus:outline-none focus:border-indigo-500 font-bold text-slate-850 dark:text-slate-200 cursor-pointer"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day}>
                        Day {day} of the Month
                      </option>
                    ))}
                  </select>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">
                    Select the calendar day when your bill starts. A July statement will collect all logs starting from month-start Day {billingCycleStartDay} of June up through July Day {parseInt(billingCycleStartDay) === 1 ? '30' : (parseInt(billingCycleStartDay) - 1).toString()}.
                  </p>
                </div>
              </div>
            )}

            {/* Editable Balance Field during edit mode */}
            {editingAccountId !== null && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  {type === 'bank' ? 'Current Book Balance' : 'Outstanding Credit Balance'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">{preferences.currencySymbol}</span>
                  <input
                    type="number"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    autoComplete="off"
                    placeholder="e.g. 25000"
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 pl-7 bg-slate-50 focus:outline-none focus:border-indigo-500 font-bold text-slate-800"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Directly override the capital ledger book balance for this financial channel.
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Color Theme Accent</label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {colorPresets.map(preset => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setColor(preset.value)}
                    className="w-6 h-6 rounded-full border border-slate-200 transition-transform relative hover:scale-110 flex items-center justify-center shrink-0"
                    style={{ backgroundColor: preset.value }}
                    title={preset.name}
                  >
                    {color === preset.value && (
                      <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-1.5 text-[11px] text-rose-600 font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-teal-50 border border-teal-100 rounded-xl flex items-center gap-1.5 text-[11px] text-teal-700 font-semibold">
                <Check className="w-4 h-4 shrink-0 text-teal-600" /> {success}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 text-xs bg-indigo-600 hover:bg-indigo-700 transition text-white font-extrabold py-3 rounded-xl shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {editingAccountId ? 'Save Changes' : 'Register Instrument'}
              </button>
              {editingAccountId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* SELF TRANSFER PORTAL */}
        {bankAccounts.length >= 2 && (
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-50 mb-3">
              <ArrowRightLeft className="w-5 h-5 text-indigo-600 animate-pulse" />
              <h2 className="text-base font-bold text-slate-800">Bank-to-Bank Transfer</h2>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Shift money instantly between your verified bank checking reserves (Credit instruments excluded). Updates balances with formal ledger footprints.
            </p>

            <form onSubmit={handleSelfTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Outflow checking Source</label>
                <select
                  value={transferSource}
                  onChange={(e) => setTransferSource(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
                >
                  {bankAccounts.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({formatCurrency(b.balance, preferences, 2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Inflow checking Target</label>
                <select
                  value={transferTarget}
                  onChange={(e) => setTransferTarget(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
                >
                  {bankAccounts.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({formatCurrency(b.balance, preferences, 2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Amount to Shift</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">{preferences.currencySymbol}</span>
                  <input
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    autoComplete="off"
                    placeholder="e.g. 5000"
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 pl-7 bg-slate-50 focus:outline-none focus:border-indigo-500 font-extrabold text-slate-800"
                  />
                </div>
              </div>

              {transferError && (
                <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-[10px] text-rose-600 font-semibold">
                  {transferError}
                </div>
              )}
              {transferSuccess && (
                <div className="p-2.5 bg-teal-50 border border-teal-100 rounded-xl text-[10px] text-teal-700 font-semibold flex items-start gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <span>{transferSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowRightLeft className="w-4 h-4" /> Move Liquid Reserves
              </button>
            </form>
          </div>
        )}

        {/* CREDIT CARD BILL PAYMENT PORTAL */}
        <div id="cc-payment-portal" className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-50 mb-3">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-800">Pay Credit Card Bill</h2>
          </div>

          {bankAccounts.length >= 1 && creditCards.length >= 1 ? (
            <>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Clear outstanding debt by transferring liquidity from your checking vault directly to your credit lines.
              </p>

              <form onSubmit={handleCreditCardPayment} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Paying Bank Source</label>
                  <select
                    value={paySourceBankId}
                    onChange={(e) => setPaySourceBankId(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
                  >
                    {bankAccounts.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({formatCurrency(b.balance, preferences, 2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Credit Card</label>
                  <select
                    value={payCardId}
                    onChange={(e) => setPayCardId(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
                  >
                    {creditCards.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} (O/S: {formatCurrency(c.balance, preferences, 2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Payment Option</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setPayOption('full')}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border transition text-left flex flex-col justify-center cursor-pointer ${payOption === 'full' ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                    >
                      <span className="font-bold text-[9px] uppercase opacity-75">Pay Full O/S</span>
                      <span className="font-mono text-xs mt-0.5 font-extrabold truncate max-w-full">
                        {formatCurrency(accounts.find(a => a.id === payCardId)?.balance || 0, preferences, 2)}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayOption('custom')}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border transition text-left flex flex-col justify-center cursor-pointer ${payOption === 'custom' ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                    >
                      <span className="font-bold text-[9px] uppercase opacity-75">Custom Amount</span>
                      <span className="text-xs mt-0.5 font-bold">Specify below</span>
                    </button>
                  </div>
                </div>

                {payOption === 'custom' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Amount to pay</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">{preferences.currencySymbol}</span>
                      <input
                        type="number"
                        value={payCustomAmount}
                        onChange={(e) => setPayCustomAmount(e.target.value)}
                        onWheel={(e) => e.currentTarget.blur()}
                        autoComplete="off"
                        placeholder="e.g. 10000"
                        className="w-full text-xs border border-slate-200 rounded-lg p-2.5 pl-7 bg-slate-50 focus:outline-none focus:border-indigo-500 font-extrabold text-slate-800"
                      />
                    </div>
                  </div>
                )}

                {payError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-[10px] text-rose-600 font-semibold animate-fade-in">
                    {payError}
                  </div>
                )}
                {paySuccess && (
                  <div className="p-2.5 bg-teal-50 border border-teal-100 rounded-xl text-[10px] text-teal-700 font-semibold flex items-start gap-1 animate-fade-in">
                    <CheckCircle className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                    <span>{paySuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" /> Execute Bill Payment
                </button>
              </form>
            </>
          ) : (
            <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs text-slate-600 leading-relaxed font-bold">
                Awaiting Accounts to Setup Gateway
              </p>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                To pay credit card outstanding debt here, you need at least:
              </p>
              <ul className="text-[11px] text-slate-500 text-left list-disc list-inside mt-2.5 space-y-1 font-semibold">
                <li>One active <span className="text-emerald-600">Bank Account</span> with dry powder/funds</li>
                <li>One active <span className="text-amber-600">Credit Card</span> (with an O/S balance)</li>
              </ul>
              <div className="mt-4 p-2 bg-indigo-50/50 rounded-xl border border-indigo-100 text-left">
                <span className="text-[9px] font-extrabold text-indigo-600 uppercase block tracking-wider mb-1">Interactive Setup Helper</span>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Click the quick-populate option below to automatically pre-fill demo values immediately!
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setInstitution('HDFC Bank');
                  setName('Regalia Premium');
                  setType('credit_card');
                  setLimit('200000');
                  setColor('#004481');
                  const elem = document.getElementById('accounts-root');
                  if (elem) {
                    elem.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="mt-3.5 w-full text-[11px] font-black leading-none bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl transition cursor-pointer shadow-xs"
              >
                Let me try: Fill Demo Credit Card
              </button>
            </div>
          )}
        </div>

      </div>

      {/* RIGHT COLUMN: CHANNELS LIST */}
      <div className="lg:col-span-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Active Financial Channels</h2>
          <p className="text-slate-500 text-sm mt-0.5">Drag and drop bank cards by clicking & dragging anywhere on a card. Sort order persists instantly.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((acc, index) => {
            const isBank = acc.type === 'bank';
            const isLinkedCard = acc.type === 'credit_card' && !!acc.linkedGroupId;
            let groupLimit = acc.limit || 0;
            let groupTotalSpent = acc.balance;
            let isMainOfGroup = acc.isMainCard;

            if (isLinkedCard && acc.linkedGroupId) {
              const groupCards = accounts.filter(c => c.type === 'credit_card' && c.linkedGroupId === acc.linkedGroupId);
              const mainCard = groupCards.find(c => c.isMainCard);
              if (mainCard && mainCard.limit !== undefined) {
                groupLimit = mainCard.limit;
              } else {
                groupLimit = Math.max(...groupCards.map(c => c.limit || 0), 0);
              }
              groupTotalSpent = groupCards.reduce((sum, c) => sum + c.balance, 0);
              isMainOfGroup = acc.isMainCard || (mainCard ? mainCard.id === acc.id : groupCards[0]?.id === acc.id);
            }

            const hasLimit = acc.type === 'credit_card' && groupLimit > 0;
            const utilizationPercentage = hasLimit ? (groupTotalSpent / groupLimit) * 100 : 0;

            return (
              <motion.div
                key={acc.id}
                layout
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, index)}
                onDragLeave={handleDragLeave}
                className={`relative text-white rounded-2xl p-5 shadow-sm overflow-hidden flex flex-col justify-between min-h-[210px] cursor-grab active:cursor-grabbing transition-all duration-300 ${
                  draggedIndex === index ? 'opacity-30 scale-95 border-2 border-dashed border-indigo-400' : ''
                } ${
                  dragOverIndex === index ? 'ring-3 ring-indigo-500 scale-[1.03] shadow-xl z-20' : 'hover:shadow-lg'
                }`}
                style={{
                  background: `linear-gradient(135deg, ${acc.color}, ${adjustColorBrightness(acc.color, -30)})`
                }}
              >
                {/* Background effects */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full transform translate-x-8 -translate-y-8 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/5 rounded-full transform -translate-x-6 translate-y-6 pointer-events-none"></div>

                <div className="flex justify-between items-start z-10 w-full mb-1">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                      <GripVertical className="w-3.5 h-3.5 text-white/45 cursor-grab active:cursor-grabbing hover:text-white/80 transition-colors shrink-0" />
                      <span className="text-[9px] font-extrabold uppercase tracking-widest bg-white/15 px-2 py-0.5 rounded-md text-white/95">
                        {isBank ? 'Bank Account' : 'Credit Card'}
                      </span>
                      {acc.type === 'credit_card' && isLinkedCard && (
                        <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md text-white/95 flex items-center gap-1 ${isMainOfGroup ? 'bg-amber-500/40 border border-amber-300/35' : 'bg-white/10'}`}>
                          {isMainOfGroup ? <Star className="w-2.5 h-2.5 fill-amber-300 stroke-none" /> : <Link className="w-2.5 h-2.5" />}
                          {isMainOfGroup ? 'Main' : 'Linked'}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0" title={acc.name}>
                      <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider truncate mb-0.5">
                        {acc.institution}
                      </span>
                      <h3 className="text-base font-black tracking-tight leading-tight truncate w-full">
                        {getCleanDescriptor(acc.name, acc.institution)}
                      </h3>
                    </div>
                  </div>
                  {/* Premium floating instrument icon */}
                  <div className="p-1.5 bg-white/10 rounded-lg shrink-0 ml-2">
                    {isBank ? <Building className="w-4 h-4 text-white/95" /> : <CreditCard className="w-4 h-4 text-white/95" />}
                  </div>
                </div>

                <div className="my-3 z-10 flex flex-col justify-end">
                  <span className="text-[9px] text-white/70 uppercase font-bold block tracking-wider">
                    {isBank ? 'Current Balance' : 'Outstanding Credit Spent'}
                  </span>
                  <span className="text-2xl font-black tracking-tight font-mono">
                    {formatCurrency(acc.balance, preferences, 2)}
                  </span>

                  {/* Highlight Minimum Average Balance (MAB) when configured for Bank Accounts */}
                  {isBank && acc.mabRequired && (
                    <div className="mt-3 pt-3 border-t border-white/10 text-xs text-left">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[9px] text-white/70 uppercase font-extrabold tracking-wider">
                          Minimum Bal (MAB)
                        </span>
                        <div className="flex items-center gap-1.5 relative">
                          <span className="font-mono text-[9px] font-black bg-white/15 px-2 py-0.5 rounded text-white">
                            {formatCurrency(acc.minimumAverageBalance || 0, preferences, 2)}
                          </span>
                          
                          {/* MAB Status Indicator */}
                          {acc.balance >= (acc.minimumAverageBalance || 0) ? (
                            <div className="relative group cursor-help flex items-center shrink-0">
                              <Check className="w-4 h-4 text-emerald-400 font-extrabold stroke-[3]" />
                              {/* Hover Tooltip */}
                              <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover:block z-50 w-32 p-2 rounded-lg bg-slate-900/95 text-[9.5px] leading-tight text-white shadow-xl border border-white/10 pointer-events-none text-center whitespace-nowrap">
                                <span className="font-bold text-emerald-400">MAB Maintained ✓</span>
                              </div>
                            </div>
                          ) : (
                            <div className="relative group cursor-help flex items-center shrink-0">
                              <X className="w-4 h-4 text-rose-400 font-extrabold animate-pulse stroke-[3]" />
                              {/* Hover Tooltip */}
                              <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover:block z-50 w-44 p-2 rounded-lg bg-slate-900/95 text-[9.5px] leading-tight text-white shadow-xl border border-white/10 pointer-events-none">
                                <span className="font-extrabold text-rose-400 block text-[10px] uppercase tracking-wider mb-0.5">Below MAB Limit ⚠️</span>
                                <span className="text-white/85 text-[9px] font-medium">
                                  Top up needed: {formatCurrency((acc.minimumAverageBalance || 0) - acc.balance, preferences, 2)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Limit & percentage for credit cards */}
                  {acc.type === 'credit_card' && (
                    <div className="mt-2 pt-2 border-t border-white/10 text-xs">
                      <div className="flex flex-wrap items-center justify-between text-[10px] text-white/80 font-black mb-1">
                        {isLinkedCard ? (
                          <span className="flex items-center gap-1 bg-white/15 px-1.5 py-0.5 rounded text-[8.5px] uppercase font-black">
                            🔗 Pool Limit: {formatCurrency(groupLimit, preferences, 2)}
                          </span>
                        ) : (
                          <span>Limit: {formatCurrency(acc.limit || 0, preferences, 2)}</span>
                        )}
                        <span>{utilizationPercentage.toFixed(0)}% pooled use</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-white/75 font-semibold mb-1">
                        {isLinkedCard && (
                          <>
                            <span>Spent: {formatCurrency(acc.balance, preferences, 2)}</span>
                            <span>Limit Remainder: {formatCurrency(Math.max(0, groupLimit - groupTotalSpent), preferences, 2)}</span>
                          </>
                        )}
                      </div>
                      <div className="w-full bg-white/20 h-1.5 rounded-full mt-1 overflow-hidden">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-300 ${utilizationPercentage > 85 ? 'bg-rose-450' : 'bg-emerald-300'}`}
                          style={{ width: `${Math.min(100, utilizationPercentage)}%` }}
                        ></div>
                      </div>

                      {/* Dynamic Billing Cycle Expenses Panel */}
                      {(() => {
                        const defaultMonthStr = `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`;
                        const currentSelection = selectedCardCycles[acc.id] || defaultMonthStr;
                        const [selYear, selMonth] = currentSelection.split('-').map(Number);
                        const bDay = acc.billingCycleStartDay || 15;
                        const range = getBillingCycleRange(bDay, selYear, selMonth);

                        const cardExpenses = data.expenses.filter(e => e.accountId === acc.id);
                        const billableInCycle = filterExpensesByRange(cardExpenses, range.startStr, range.endStr);
                        const totalBillable = billableInCycle.reduce((sum, e) => sum + e.amount, 0);

                        return (
                          <div className="mt-3.5 pt-3 border-t border-white/10 text-xs text-left">
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <span className="text-[9px] text-white/70 uppercase font-extrabold tracking-wider">
                                Billing Statement (Day {bDay})
                              </span>
                              <select
                                value={currentSelection}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  setSelectedCardCycles(prev => ({ ...prev, [acc.id]: e.target.value }));
                                }}
                                className="bg-white/15 hover:bg-white/25 text-white border-0 rounded px-1.5 py-0.5 text-[9px] font-black focus:ring-1 focus:ring-white/40 focus:outline-none cursor-pointer"
                              >
                                {getRecentMonths().map(month => (
                                  <option key={month.value} value={month.value} className="text-slate-800 font-bold bg-white">
                                    {month.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            <div className="bg-black/20 dark:bg-slate-950/40 rounded-xl p-2.5 flex flex-col gap-1 text-[10px] leading-tight font-medium text-white/90">
                              <div className="flex justify-between font-bold">
                                <span className="opacity-75">Cycle Period:</span>
                                <span className="font-mono">{range.startStr} to {range.endStr}</span>
                              </div>
                              <div className="flex justify-between font-bold pt-1 border-t border-white/5">
                                <span className="opacity-75">Cycle Expenses:</span>
                                <span>{billableInCycle.length} item{billableInCycle.length !== 1 ? 's' : ''}</span>
                              </div>
                              <div className="flex justify-between font-extrabold text-sm pt-1 mt-0.5 border-t border-white/5">
                                <span className="text-emerald-300 font-sans uppercase text-[10px] tracking-wide">Billable Total:</span>
                                <span className="text-emerald-300 font-mono">{formatCurrency(totalBillable, preferences, 2)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mt-2.5 pt-2.5 border-t border-white/10 z-10 text-[10px] text-white/90 font-bold uppercase tracking-wider w-full">
                  <span className="truncate max-w-[80px] sm:max-w-[124px]">{acc.institution}</span>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {!isBank && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPayCardId(acc.id);
                          setPayOption('full');
                          const element = document.getElementById('cc-payment-portal');
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                        className="py-1 px-2 bg-emerald-500 hover:bg-emerald-600 rounded-md text-white font-black text-[9px] transition flex items-center justify-center gap-0.5 cursor-pointer shadow-xs active:scale-95 uppercase tracking-wide shrink-0"
                        title="Pay off outstanding balance of this card"
                      >
                        <Check className="w-2.5 h-2.5 text-white stroke-[3.5px]" /> Pay Bill
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(acc);
                      }}
                      className="p-1 px-2 bg-white/15 hover:bg-white/25 rounded-md text-white font-extrabold text-[9px] transition flex items-center gap-0.5 cursor-pointer uppercase tracking-tight shrink-0"
                      title="Edit instrument descriptors"
                    >
                      <Edit className="w-2.5 h-2.5" /> Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAccount(acc.id, acc.name);
                      }}
                      className="p-1 bg-white/10 hover:bg-rose-500/40 text-white/90 hover:text-white rounded-md transition cursor-pointer shrink-0"
                      title="Remove Account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {accounts.length === 0 && (
          <div className="p-12 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30 shadow-xs animate-fade-in">
            <Building className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto stroke-1" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-3">No financial channels found</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 max-w-[320px] mx-auto leading-relaxed">
              Add Checking accounts or Credit Cards in the sidebar form to correctly establish your wealth flow ledger.
            </p>
          </div>
        )}
      </div>

      {/* CUSTOM CONFIRMATION DELETION MODAL */}
      {accountToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-xl border border-slate-100/80 animate-scale-up">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4 border border-rose-100">
              <Trash2 className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-sans tracking-tight">Remove Account Channel?</h3>
            <p className="text-xs text-slate-500 mt-2.5 leading-relaxed font-medium">
              Are you sure you want to remove the financial instrument <span className="font-bold text-slate-1000">"{accountToDelete.name}"</span>? 
              Associated transactions and ledger history will remain in place, but you won't be able to map new items to this account.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={confirmDeleteAccount}
                className="flex-1 text-xs bg-rose-600 hover:bg-rose-700 transition duration-150 text-white font-extrabold py-3 px-4 rounded-xl cursor-pointer shadow-sm hover:shadow-rose-600/10 active:scale-[0.98]"
              >
                Yes, Delete Channel
              </button>
              <button
                onClick={() => setAccountToDelete(null)}
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

// Utility to darken card backdrops programmatically
function adjustColorBrightness(hex: string, percent: number): string {
  let R = parseInt(hex.substring(1, 3), 16);
  let G = parseInt(hex.substring(3, 5), 16);
  let B = parseInt(hex.substring(5, 7), 16);

  R = Math.max(0, Math.min(255, R + (R * percent / 100)));
  G = Math.max(0, Math.min(255, G + (G * percent / 100)));
  B = Math.max(0, Math.min(255, B + (B * percent / 100)));

  const rHex = Math.round(R).toString(16).padStart(2, '0');
  const gHex = Math.round(G).toString(16).padStart(2, '0');
  const bHex = Math.round(B).toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}
