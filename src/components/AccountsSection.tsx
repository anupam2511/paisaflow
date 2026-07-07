/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FinanceData, FinancialAccount } from '../types';
import { formatCurrency } from '../utils/formatters';
import { 
  Building, 
  Plus, 
  Trash2, 
  Landmark, 
  Check, 
  AlertCircle, 
  Edit, 
  ArrowRightLeft, 
  CheckCircle,
  GripVertical,
  X
} from 'lucide-react';
import { motion } from 'motion/react';
import ColorPicker from './ColorPicker';

interface AccountsSectionProps {
  data: FinanceData;
  setFinanceData: React.Dispatch<React.SetStateAction<FinanceData>>;
}

export default function AccountsSection({ data, setFinanceData }: AccountsSectionProps) {
  const { accounts, preferences } = data;

  // Add/Edit bank account fields
  const [institution, setInstitution] = useState('');
  const [name, setName] = useState('');
  const [color, setColor] = useState('#0284c7');
  const [balance, setBalance] = useState('');
  const [mabRequired, setMabRequired] = useState(false);
  const [minimumAverageBalance, setMinimumAverageBalance] = useState('');

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

  const bankAccounts = accounts.filter(a => a.type === 'bank');

  // Auto-set selects for transfer when accounts change
  useEffect(() => {
    if (bankAccounts.length >= 2) {
      if (!transferSource) setTransferSource(bankAccounts[0].id);
      if (!transferTarget) setTransferTarget(bankAccounts[1].id);
    }
  }, [accounts]);

  const colorPresets = [
    { name: 'Emerald Green', value: '#10b981' },
    { name: 'Sky Blue', value: '#0284c7' },
    { name: 'Navy Trust', value: '#004481' },
    { name: 'Premium Charcoal', value: '#1e293b' },
    { name: 'Crimson Wine', value: '#9f1239' },
    { name: 'Amber Glow', value: '#f97316' },
    { name: 'Slate Gray', value: '#64748b' },
    { name: 'Royal Purple', value: '#7c3aed' },
  ];

  // Helper to extract clean descriptor name, removing any prefixed institution names or duplicates
  const getCleanDescriptor = (rawName: string, instVal: string): string => {
    let clean = rawName.trim();
    const instClean = instVal.trim();
    if (!clean || !instClean) return clean;

    // 1. If it contains " - ", split and take the right segment
    if (clean.includes(' - ')) {
      const parts = clean.split(' - ');
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
    setColor(acc.color);
    setBalance(acc.balance.toString());
    setMabRequired(acc.mabRequired || false);
    setMinimumAverageBalance(acc.minimumAverageBalance ? acc.minimumAverageBalance.toString() : '');
    setError('');
    setSuccess('');
  };

  // Cancel Editing
  const handleCancelEdit = () => {
    setEditingAccountId(null);
    setInstitution('');
    setName('');
    setBalance('');
    setMabRequired(false);
    setMinimumAverageBalance('');
    setError('');
  };

  // Form Submission
  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!institution.trim() || !name.trim()) {
      setError('Please provide BOTH the bank name and account descriptor.');
      return;
    }

    const parsedMab = parseFloat(minimumAverageBalance);
    if (mabRequired && (isNaN(parsedMab) || parsedMab < 0)) {
      setError('Please specify a valid Minimum Average Balance (MAB) required.');
      return;
    }

    // Always clean descriptor name before storing to eliminate double headers
    const cleanDescriptor = getCleanDescriptor(name, institution);
    const formattedFullName = `${institution.trim()} - ${cleanDescriptor}`;

    if (editingAccountId) {
      const parsedBalance = parseFloat(balance);
      if (isNaN(parsedBalance)) {
        setError('Please specify a valid balance.');
        return;
      }

      setFinanceData(prev => {
        const updatedList = prev.accounts.map(acc => {
          if (acc.id === editingAccountId) {
            return {
              ...acc,
              name: formattedFullName,
              institution: institution.trim(),
              type: 'bank' as const,
              color,
              balance: parsedBalance,
              mabRequired,
              minimumAverageBalance: mabRequired ? parsedMab : undefined
            };
          }
          return acc;
        });

        return {
          ...prev,
          accounts: updatedList
        };
      });

      setSuccess('Bank account updated successfully!');
      setEditingAccountId(null);
      setInstitution('');
      setName('');
      setBalance('');
      setMabRequired(false);
      setMinimumAverageBalance('');
    } else {
      // Register New Account
      const newAccount: FinancialAccount = {
        id: `acc-${Date.now()}`,
        name: formattedFullName,
        type: 'bank',
        institution: institution.trim(),
        balance: 0, // Starts at 0
        color,
        mabRequired,
        minimumAverageBalance: mabRequired ? parsedMab : undefined
      };

      setFinanceData(prev => ({
        ...prev,
        accounts: [...prev.accounts, newAccount]
      }));

      setSuccess('Bank account registered successfully!');
      setInstitution('');
      setName('');
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
      setTransferError('Please configure both source and destination bank accounts.');
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
      setTransferError('Selected bank accounts could not be resolved.');
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

    const transferExpenseRepresentation = {
      id: `exp-transfer-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
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
    setTransferSuccess(`Transferred ${formatCurrency(amt, preferences, 2)} from ${srcAcc.institution} to ${destAcc.institution}!`);
    setTimeout(() => setTransferSuccess(''), 5000);
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
        accounts: filtered
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

    const bankAccs = [...bankAccounts];
    const [draggedItem] = bankAccs.splice(draggedIndex, 1);
    bankAccs.splice(index, 0, draggedItem);

    const otherAccs = accounts.filter(a => a.type !== 'bank');
    const updated = [...bankAccs, ...otherAccs];

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
              {editingAccountId ? 'Edit Bank Account' : 'Add Bank Account'}
            </h2>
          </div>
          
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            {editingAccountId 
              ? 'Alter properties of this bank account. Capital balances remain preserved.'
              : 'Add checking, savings, or digital bank accounts. Starting balance initiates at 0, adapting instantly with each recorded transfer or ledger transaction.'
            }
          </p>

          <form onSubmit={handleSaveAccount} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Financial Institution</label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g. HDFC Bank, ICICI Bank, SBI, Chase"
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Account Descriptor</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Core Checking, Savings Reserve, Salary Account"
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
              />
            </div>

            {/* Bank account specific configuration (MAB) */}
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

            {/* Editable Balance Field during edit mode */}
            {editingAccountId !== null && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Current Book Balance
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
                  Directly override the capital ledger book balance for this bank account.
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Color Theme Accent</label>
              <ColorPicker color={color} onChange={setColor} />
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-1.5 text-[11px] text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400 font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-teal-50 border border-teal-100 rounded-xl flex items-center gap-1.5 text-[11px] text-teal-700 dark:bg-teal-950/20 dark:border-teal-900/30 dark:text-teal-400 font-semibold">
                <Check className="w-4 h-4 shrink-0 text-teal-600 dark:text-teal-400" /> {success}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 text-xs bg-indigo-600 hover:bg-indigo-700 transition text-white font-extrabold py-3 rounded-xl shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {editingAccountId ? 'Save Changes' : 'Register Account'}
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
              Shift money instantly between your verified bank checking reserves. Updates balances with formal ledger footprints.
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
                <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-[10px] text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400 font-semibold">
                  {transferError}
                </div>
              )}
              {transferSuccess && (
                <div className="p-2.5 bg-teal-50 border border-teal-100 rounded-xl text-[10px] text-teal-700 dark:bg-teal-950/20 dark:border-teal-900/30 dark:text-teal-400 font-semibold flex items-start gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
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

      </div>

      {/* RIGHT COLUMN: CHANNELS LIST */}
      <div className="lg:col-span-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Active Financial Accounts</h2>
          <p className="text-slate-500 text-sm mt-0.5">Drag and drop bank cards by clicking & dragging anywhere on a card. Sort order persists instantly.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bankAccounts.map((acc, index) => {
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
                        Bank Account
                      </span>
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
                    <Building className="w-4 h-4 text-white/95" />
                  </div>
                </div>

                <div className="my-3 z-10 flex flex-col justify-end">
                  <span className="text-[9px] text-white/70 uppercase font-bold block tracking-wider">
                    Current Balance
                  </span>
                  <span className="text-2xl font-black tracking-tight font-mono">
                    {formatCurrency(acc.balance, preferences, 2)}
                  </span>

                  {/* Highlight Minimum Average Balance (MAB) when configured */}
                  {acc.mabRequired && (
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
                              <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover:block z-50 w-32 p-2 rounded-lg bg-slate-900/95 text-[9.5px] leading-tight text-white shadow-xl border border-white/10 pointer-events-none text-center whitespace-nowrap">
                                <span className="font-bold text-emerald-400">MAB Maintained ✓</span>
                              </div>
                            </div>
                          ) : (
                            <div className="relative group cursor-help flex items-center shrink-0">
                              <X className="w-4 h-4 text-rose-400 font-extrabold animate-pulse stroke-[3]" />
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
                </div>

                <div className="flex justify-end items-center mt-2.5 pt-2.5 border-t border-white/10 z-10 text-[10px] text-white/90 font-bold uppercase tracking-wider w-full">
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
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

        {bankAccounts.length === 0 && (
          <div className="p-12 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30 shadow-xs animate-fade-in">
            <Building className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto stroke-1" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-3">No financial bank accounts found</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 max-w-[320px] mx-auto leading-relaxed">
              Add bank accounts in the sidebar form to establish your wealth checking vaults.
            </p>
          </div>
        )}
      </div>

      {/* CUSTOM CONFIRMATION DELETION MODAL */}
      {accountToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 md:p-8 shadow-xl border border-slate-100/80 dark:border-slate-800/50 animate-scale-up">
            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mb-4 border border-rose-100 dark:border-rose-900/30">
              <Trash2 className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-sans tracking-tight">Remove Account Channel?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed font-medium">
              Are you sure you want to remove the bank account <span className="font-bold text-slate-1000 dark:text-slate-200">"{accountToDelete.name}"</span>? 
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
