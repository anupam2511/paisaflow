import React, { useState } from 'react';
import { FinanceData, Preferences, CategoryBudget } from '../types';
import { formatCurrency } from '../utils/formatters';
import { INITIAL_FINANCE_DATA } from '../data/mockData';
import {
  Settings,
  Coins,
  ShieldAlert,
  Save,
  CheckCircle,
  AlertCircle,
  Trash2,
  Plus,
  HelpCircle,
  Palette,
  FolderPlus,
  Sun,
  Moon,
  Monitor,
  RotateCcw,
  Lock
} from 'lucide-react';
import { motion } from 'motion/react';

interface SettingsSectionProps {
  data: FinanceData;
  setFinanceData: React.Dispatch<React.SetStateAction<FinanceData>>;
}

export default function SettingsSection({ data, setFinanceData }: SettingsSectionProps) {
  const { preferences, investments = [], expenses = [], budgets = [] } = data;

  // Local state for settings elements
  const [currency, setCurrency] = useState(preferences.currencySymbol);
  const [threshold, setThreshold] = useState(preferences.largeExpenseThreshold.toString());
  const [newCategory, setNewCategory] = useState('');
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(preferences.themeMode || 'light');
  const [accentColor, setAccentColor] = useState<'blue' | 'emerald' | 'yellow' | 'rose' | 'violet'>(preferences.accentColor || 'blue');

  // Local state for system reset and purge confirmations
  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0);
  const [understandCheckbox, setUnderstandCheckbox] = useState(false);
  const [purgeStep, setPurgeStep] = useState<0 | 1 | 2>(0);
  const [purgeUnderstandCheckbox, setPurgeUnderstandCheckbox] = useState(false);

  const hasCustomData = () => {
    const accountsChanged = JSON.stringify(data.accounts) !== JSON.stringify(INITIAL_FINANCE_DATA.accounts);
    const expensesChanged = JSON.stringify(data.expenses) !== JSON.stringify(INITIAL_FINANCE_DATA.expenses);
    const savingGoalsChanged = JSON.stringify(data.savingGoals) !== JSON.stringify(INITIAL_FINANCE_DATA.savingGoals);
    const budgetsChanged = JSON.stringify(data.budgets) !== JSON.stringify(INITIAL_FINANCE_DATA.budgets);
    const investmentsChanged = JSON.stringify(data.investments) !== JSON.stringify(INITIAL_FINANCE_DATA.investments);
    const isRecChanged = data.recurringSpends && INITIAL_FINANCE_DATA.recurringSpends && 
      JSON.stringify(data.recurringSpends) !== JSON.stringify(INITIAL_FINANCE_DATA.recurringSpends);
    return accountsChanged || expensesChanged || savingGoalsChanged || budgetsChanged || investmentsChanged || !!isRecChanged;
  };

  const handleTriggerReset = () => {
    if (hasCustomData()) {
      setResetStep(1); // Double confirmation required
    } else {
      setResetStep(2); // Single confirmation is enough
    }
  };

  const handleFinalReset = () => {
    const freshDeepClone = JSON.parse(JSON.stringify(INITIAL_FINANCE_DATA));
    setFinanceData(freshDeepClone);
    setResetStep(0);
    setUnderstandCheckbox(false);
    setAlertOk('All default finance data has been restored to factory specs!');
    setTimeout(() => setAlertOk(''), 4000);
  };

  const handleTriggerPurge = () => {
    setPurgeStep(1); // Always trigger double confirmation for a total purge of data
  };

  const handleFinalPurge = () => {
    setFinanceData({
      accounts: [],
      savingGoals: [],
      incomes: [],
      expenses: [],
      recurringSpends: [],
      budgets: [],
      preferences: {
        currencySymbol: currency,
        largeExpenseThreshold: parseFloat(threshold) || 4000,
        investmentCategories: [],
        themeMode,
        accentColor,
      },
      investments: [],
      emis: []
    });
    setPurgeStep(0);
    setPurgeUnderstandCheckbox(false);
    setAlertOk('All ledger records and configuration structures have been completely purged! Ready for fresh entries.');
    setTimeout(() => setAlertOk(''), 4000);
  };

  // Live Instant Theme Updates
  const handleThemeChange = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    setFinanceData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        themeMode: mode
      }
    }));
  };

  const handleAccentChange = (color: 'blue' | 'emerald' | 'yellow' | 'rose' | 'violet') => {
    setAccentColor(color);
    setFinanceData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        accentColor: color
      }
    }));
  };

  // Budget category customise state
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [budgetSuccess, setBudgetSuccess] = useState('');
  const [budgetError, setBudgetError] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  // Notifications
  const [alertOk, setAlertOk] = useState('');
  const [alertErr, setAlertErr] = useState('');

  // Available categories (ensuring standard + user custom ones are safely retrieved)
  const currentCategories = preferences.investmentCategories || [
    'Mutual Funds',
    'Government Schemes',
    'Gold Investment',
    'Fixed Deposits',
    'Stocks & Equities',
    'Alternative Assets'
  ];

  const handleSaveGeneralConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setAlertOk('');
    setAlertErr('');

    const parsedThreshold = parseFloat(threshold);
    if (isNaN(parsedThreshold) || parsedThreshold <= 0) {
      setAlertErr('Please specify a positive numeric value for the large outgoings audit limit.');
      return;
    }

    setFinanceData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        currencySymbol: currency,
        largeExpenseThreshold: parsedThreshold,
        themeMode,
        accentColor,
      }
    }));

    setAlertOk('Preferences successfully synchronized!');
    setTimeout(() => setAlertOk(''), 3000);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setAlertOk('');
    setAlertErr('');

    const cleanCategoryName = newCategory.trim();
    if (!cleanCategoryName) {
      setAlertErr('Please enter a valid category name.');
      return;
    }

    if (currentCategories.some(cat => cat.toLowerCase() === cleanCategoryName.toLowerCase())) {
      setAlertErr(`Category "${cleanCategoryName}" already exists!`);
      return;
    }

    const updatedCategories = [...currentCategories, cleanCategoryName];

    setFinanceData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        investmentCategories: updatedCategories
      }
    }));

    setNewCategory('');
    setAlertOk(`Category "${cleanCategoryName}" successfully created!`);
    setTimeout(() => setAlertOk(''), 3000);
  };

  const handleDeleteCategory = (catToDelete: string) => {
    setAlertOk('');
    setAlertErr('');

    // Warn or guard if assets are using this category
    const isUsed = investments.some(inv => inv.type.toLowerCase() === catToDelete.toLowerCase() || inv.type === catToDelete);
    if (isUsed) {
      setAlertErr(`Cannot delete "${catToDelete}" because some investments are currently categorized under it.`);
      setTimeout(() => setAlertErr(''), 4000);
      return;
    }

    const updatedCategories = currentCategories.filter(cat => cat !== catToDelete);

    setFinanceData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        investmentCategories: updatedCategories
      }
    }));

    setAlertOk(`Category "${catToDelete}" successfully removed.`);
    setTimeout(() => setAlertOk(''), 3000);
  };

  const handleAddBudgetCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setBudgetSuccess('');
    setBudgetError('');

    const trimmed = customCategoryName.trim();
    if (!trimmed) {
      setBudgetError('Category name cannot be empty.');
      return;
    }

    const exists = budgets.some(b => b.category.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setBudgetError(`Category "${trimmed}" already exists.`);
      return;
    }

    const newBudgetItem: CategoryBudget = {
      category: trimmed,
      limit: 10000 // Default initial limit
    };

    setFinanceData(prev => ({
      ...prev,
      budgets: [...prev.budgets, newBudgetItem]
    }));

    setCustomCategoryName('');
    setBudgetSuccess(`Budget category "${trimmed}" successfully created!`);
    setTimeout(() => setBudgetSuccess(''), 3000);
  };

  const handleDeleteBudgetCategory = (categoryToDel: string) => {
    setBudgetSuccess('');
    setBudgetError('');

    if (budgets.length <= 1) {
      setBudgetError('You must have at least one active budget category.');
      setTimeout(() => setBudgetError(''), 4000);
      return;
    }

    setCategoryToDelete(categoryToDel);
  };

  const confirmDeleteBudgetCategory = () => {
    if (!categoryToDelete) return;
    const remainingBudgets = budgets.filter(b => b.category.toLowerCase() !== categoryToDelete.toLowerCase());
    setFinanceData(prev => ({
      ...prev,
      budgets: remainingBudgets
    }));
    setCategoryToDelete(null);
    setBudgetSuccess('Budget category successfully removed.');
    setTimeout(() => setBudgetSuccess(''), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
      
      {/* LEFT COLUMN - GENERAL SYSTEM SETTINGS / RULES */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* SETTINGS CARD */}
        <div id="settings-parameters-card" className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-50 mb-5">
            <Settings className="w-5.5 h-5.5 text-indigo-600" />
            <div>
              <h2 className="text-base font-extrabold text-slate-800">System Parameters</h2>
              <p className="text-[11px] text-slate-400">Configure visual prefixes and spend indicator flags.</p>
            </div>
          </div>

          <form onSubmit={handleSaveGeneralConfig} className="space-y-5">
            
            {/* Currency Symbol Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Default Currency Symbol</label>
              <div className="grid grid-cols-5 gap-2">
                {['₹', '$', '€', '£', '¥'].map(sym => (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => setCurrency(sym)}
                    className={`py-2.5 rounded-xl border text-sm font-extrabold transition cursor-pointer flex justify-center items-center ${
                      currency === sym
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/10'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {sym}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Changing this immediately overrides the notation structure for all balances, allocations, and expenditures.
              </p>
            </div>

            {/* Large Expense Threshold Input */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                Large Outgoings Alert Threshold
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-400 text-xs font-extrabold">{currency}</span>
                <input
                  type="number"
                  placeholder="e.g. 4000"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-600 focus:bg-white rounded-xl py-3 pl-8 pr-3.5 outline-none transition font-semibold"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Any individual debit transaction that equals or exceeds this limit will trigger a vivid yellow high-spend flag in your Expense Ledger.
              </p>
            </div>

            {/* Submission Alerts */}
            {alertErr && (
              <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{alertErr}</span>
              </div>
            )}

            {alertOk && (
              <div className="p-3 bg-green-50 text-green-700 border border-green-100 rounded-xl text-xs flex items-center gap-1.5 font-bold">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{alertOk}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full text-xs bg-indigo-600 hover:bg-indigo-700 transition text-white font-extrabold py-3.5 rounded-xl shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" /> Save System Parameters
            </button>

          </form>
        </div>

        {/* THEME & PERSONALIZATION CARD */}
        <div id="settings-theme-card" className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-50 mb-5">
            <Palette className="w-5.5 h-5.5 text-indigo-600" />
            <div>
              <h2 className="text-base font-extrabold text-slate-800">Theme & Aesthetics</h2>
              <p className="text-[11px] text-slate-400">Configure visual themes and responsive accent colors.</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Theme modes choices */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Display Mode</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleThemeChange('light')}
                  className={`py-3 px-2 rounded-xl border text-xs font-black transition cursor-pointer flex flex-col justify-center items-center gap-1.5 ${
                    themeMode === 'light'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/10'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Sun className="w-4 h-4 shrink-0" />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleThemeChange('dark')}
                  className={`py-3 px-2 rounded-xl border text-xs font-black transition cursor-pointer flex flex-col justify-center items-center gap-1.5 ${
                    themeMode === 'dark'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/10'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Moon className="w-4 h-4 shrink-0" />
                  <span>Dark</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleThemeChange('system')}
                  className={`py-3 px-2 rounded-xl border text-xs font-black transition cursor-pointer flex flex-col justify-center items-center gap-1.5 ${
                    themeMode === 'system'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/10'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Monitor className="w-4 h-4 shrink-0" />
                  <span>System</span>
                </button>
              </div>
            </div>

            {/* Accent Hue Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Accent Color Palette</label>
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { name: 'blue', label: 'Blue', color: 'bg-blue-500' },
                  { name: 'yellow', label: 'Yellow', color: 'bg-yellow-500' },
                  { name: 'emerald', label: 'Green', color: 'bg-emerald-500' },
                  { name: 'rose', label: 'Rose', color: 'bg-rose-500' },
                  { name: 'violet', label: 'Violet', color: 'bg-violet-500' },
                ].map(opt => (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() => handleAccentChange(opt.name as any)}
                    className={`py-2 px-1 rounded-xl border transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      accentColor === opt.name
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${opt.color} shadow-xs shrink-0`}></span>
                    <span className="text-[9px] font-bold scale-90 truncate max-w-full">{opt.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-2.5 leading-relaxed font-semibold">
                Changing palettes dynamically coordinates global buttons, charts, highlights, and headers transparently.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* MIDDLE COLUMN - EXPENSE BUDGET CATEGORIES MANAGER */}
      <div className="lg:col-span-4 space-y-6">
        
        <div id="settings-budget-categories-card" className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-50 mb-4">
            <FolderPlus className="w-5.5 h-5.5 text-indigo-600" />
            <div>
              <h2 className="text-base font-extrabold text-slate-800">Budget Categories</h2>
              <p className="text-[11px] text-slate-400">Add or prune expense classifications for spend caps.</p>
            </div>
          </div>

          {/* ADD BUDGET CATEGORY FORM */}
          <form onSubmit={handleAddBudgetCategory} className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="e.g. Health, Coffee, Gym"
              value={customCategoryName}
              onChange={(e) => setCustomCategoryName(e.target.value)}
              className="flex-1 text-xs bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-600 focus:bg-white rounded-xl py-2.5 px-3.5 outline-none transition"
            />
            <button
              type="submit"
              className="text-white bg-indigo-600 hover:bg-indigo-700 transition font-extrabold text-xs px-4 rounded-xl flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </form>

          {budgetSuccess && (
            <div className="mb-3 p-2 bg-green-50 text-green-700 border border-green-100 rounded-xl text-[10px] font-bold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{budgetSuccess}</span>
            </div>
          )}

          {budgetError && (
            <div className="mb-3 p-2 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[10px] font-bold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{budgetError}</span>
            </div>
          )}

          {/* LIST CURRENT BUDGET CATEGORIES */}
          <div className="space-y-2 mt-4 max-h-[280px] overflow-y-auto pr-1">
            {budgets.map(b => {
              // Count expenses using this category label (case-insensitive check)
              const count = expenses.filter(exp => exp.category.toLowerCase() === b.category.toLowerCase()).length;
              
              return (
                <div key={b.category} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                    <span className="font-extrabold text-slate-700">{b.category}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600">
                      {count} {count === 1 ? 'expense' : 'expenses'}
                    </span>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => handleDeleteBudgetCategory(b.category)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title={`Delete "${b.category}"`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

        </div>

      </div>

      {/* RIGHT COLUMN - HOLDING ASSET CATEGORIES MANAGER */}
      <div className="lg:col-span-4 space-y-6">
        
        <div id="settings-asset-categories-card" className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-50 mb-4">
            <Coins className="w-5.5 h-5.5 text-indigo-600" />
            <div>
              <h2 className="text-base font-extrabold text-slate-800">Asset Holding Categories</h2>
              <p className="text-[11px] text-slate-400">Add or restructure classification modules for wealth tracking.</p>
            </div>
          </div>

          {/* ADD CATEGORY FORM */}
          <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="e.g. Crypto, Real Estate, Art"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="flex-1 text-xs bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-600 focus:bg-white rounded-xl py-2.5 px-3.5 outline-none transition"
            />
            <button
              type="submit"
              className="text-white bg-indigo-600 hover:bg-indigo-700 transition font-extrabold text-xs px-4 rounded-xl flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </form>

          {/* LIST CURRENT CATEGORIES */}
          <div className="space-y-2 mt-4 max-h-[280px] overflow-y-auto pr-1">
            {currentCategories.map(cat => {
              // Count investments in this category
              const count = investments.filter(inv => inv.type.toLowerCase() === cat.toLowerCase() || inv.type === cat).length;
              
              return (
                <div key={cat} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                    <span className="font-extrabold text-slate-700">{cat}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600">
                      {count} {count === 1 ? 'asset' : 'assets'}
                    </span>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title={`Delete "${cat}"`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

        </div>

        {/* SYSTEM DATA MAINTENANCE CARD */}
        <div id="settings-maintenance-card" className="bg-white dark:bg-[#0b1329] p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-55 dark:border-slate-800/60 mb-4">
            <RotateCcw className="w-5.5 h-5.5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">System Data Maintenance</h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Restore default metrics or clear the database safely.</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-indigo-50/20 dark:bg-indigo-950/15 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/30">
              <h3 className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 mb-1.5 bg-indigo-50/80 dark:bg-indigo-950/50 px-2 py-1 rounded-lg border border-indigo-100/60 dark:border-indigo-900/40 w-fit">
                <RotateCcw className="w-3.5 h-3.5" /> Restore Default Seeds
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3.5 leading-relaxed font-semibold">
                Repopulate system database with sample financial records, preconfigured category spend budgets, bank balances, and standard holding schemes.
              </p>
              <button
                type="button"
                onClick={handleTriggerReset}
                className="w-full text-xs text-indigo-600 dark:text-indigo-400 hover:text-white dark:hover:text-white font-extrabold hover:bg-indigo-600 dark:hover:bg-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 hover:shadow-lg active:scale-[0.99] border border-indigo-100/80 dark:border-indigo-800/40 py-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition duration-150"
              >
                <RotateCcw className="w-4 h-4" /> Restore Default Seeds
              </button>
            </div>

            <div className="p-4 bg-rose-50/20 dark:bg-rose-950/10 rounded-2xl border border-rose-100/50 dark:border-rose-900/30">
              <h3 className="text-xs font-extrabold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 mb-1.5 bg-rose-50/80 dark:bg-rose-950/50 px-2 py-1 rounded-lg border border-rose-100/60 dark:border-rose-900/40 w-fit">
                <Trash2 className="w-3.5 h-3.5" /> Wipe All Records (Clean Slate)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3.5 leading-relaxed font-semibold">
                Wipe all bank accounts, savings targets, investment portfolios, logged transactions, and custom categories. Choose this if you want to enter all metrics completely from scratch.
              </p>
              <button
                type="button"
                onClick={handleTriggerPurge}
                className="w-full text-xs text-rose-600 dark:text-rose-400 hover:text-white dark:hover:text-white font-extrabold hover:bg-rose-600 dark:hover:bg-rose-600 bg-rose-50/40 dark:bg-rose-950/30 hover:shadow-lg active:scale-[0.99] border border-rose-100/80 dark:border-rose-800/40 py-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition duration-150"
              >
                <Trash2 className="w-4 h-4" /> Wipe Entire System & Start Blank
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* CONFIRM DELETE BUDGET CATEGORY MODAL */}
      {categoryToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-xl border border-slate-100/80">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4 border border-rose-100">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-sans tracking-tight">Remove Budget Category?</h3>
            <p className="text-xs text-slate-500 mt-2.5 leading-relaxed font-medium">
              Are you sure you want to delete the budget category <span className="font-bold text-slate-800">"{categoryToDelete}"</span>? 
              This category will be immediately unmapped, but logged expenses will keep this label.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={confirmDeleteBudgetCategory}
                className="flex-1 text-xs bg-rose-600 hover:bg-rose-700 transition duration-150 text-white font-extrabold py-3 px-4 rounded-xl cursor-pointer shadow-sm active:scale-[0.98]"
              >
                Yes, Delete Category
              </button>
              <button
                onClick={() => setCategoryToDelete(null)}
                className="flex-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition duration-150 cursor-pointer active:scale-[0.98]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOUBLE CONFIRMATION MODAL - STEP 1 */}
      {resetStep === 1 && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-xl border border-slate-150 text-left">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4 border border-amber-100">
              <ShieldAlert className="w-6 h-6 shrink-0" />
            </div>
            <span className="text-[9px] bg-amber-100 text-amber-800 font-black px-2.5 py-1 rounded-md uppercase tracking-wider">Warning: Step 1 of 2</span>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight mt-3">Custom Data Detected</h3>
            <p className="text-xs text-slate-500 mt-2.5 leading-relaxed font-medium">
              We detected <strong className="text-slate-800 font-extrabold">customized transactions, updated account balances, or active commitments</strong>. Restoring original prefilled default seeds will erase these changes permanently.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setResetStep(2)}
                className="flex-1 text-xs bg-amber-600 hover:bg-amber-700 transition duration-150 text-white font-extrabold py-3 px-4 rounded-xl cursor-pointer shadow-sm"
              >
                I Understand, Continue
              </button>
              <button
                onClick={() => setResetStep(0)}
                className="flex-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-705 font-bold py-3 px-4 rounded-xl transition duration-150 cursor-pointer"
              >
                Cancel Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOUBLE CONFIRMATION MODAL - STEP 2 */}
      {resetStep === 2 && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-xl border border-rose-150 text-left animate-scale-up">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4 border border-rose-100">
              <Lock className="w-6 h-6 shrink-0 animate-pulse" />
            </div>
            <span className="text-[9px] bg-rose-100 text-rose-800 font-black px-2.5 py-1 rounded-md uppercase tracking-wider">Critical: Final Step</span>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight mt-3">Wipe & Override with Defaults?</h3>
            <p className="text-xs text-slate-500 mt-2.5 leading-relaxed font-medium">
              This action is completely irreversible. All your current custom financial logs, budget margins, and cards will be dropped and replaced with system default seed metrics.
            </p>

            <div className="flex items-start gap-2.5 bg-rose-50/40 p-3 rounded-xl border border-rose-100/50 my-4">
              <input
                type="checkbox"
                id="understandCheckbox"
                checked={understandCheckbox}
                onChange={(e) => setUnderstandCheckbox(e.target.checked)}
                className="mt-0.5 rounded border-rose-300 text-rose-600 focus:ring-rose-500 cursor-pointer h-4 w-4 shrink-0 shadow-xs"
              />
              <label htmlFor="understandCheckbox" className="text-[11px] text-slate-600 font-semibold select-none cursor-pointer leading-relaxed">
                Confirm: I understand that overriding active capital pools will restore factory datasets. All customized history is discarded.
              </label>
            </div>

            <div className="flex gap-3 mt-2">
              <button
                disabled={!understandCheckbox}
                onClick={handleFinalReset}
                className={`flex-1 text-xs font-extrabold py-3 px-4 rounded-xl transition duration-150 shadow-sm flex items-center justify-center gap-1 ${
                  understandCheckbox 
                    ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer active:scale-[0.98]' 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0" /> Restructure Now
              </button>
              <button
                onClick={() => {
                  setResetStep(0);
                  setUnderstandCheckbox(false);
                }}
                className="flex-1 text-xs bg-slate-100 hover:bg-slate-205 text-slate-700 font-bold py-3 px-4 rounded-xl transition duration-150 cursor-pointer"
              >
                Keep My Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PURGE DOUBLE CONFIRMATION MODAL - STEP 1 */}
      {purgeStep === 1 && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-xl border border-rose-100 text-left animate-scale-up">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4 border border-amber-100">
              <ShieldAlert className="w-6 h-6 shrink-0" />
            </div>
            <span className="text-[9px] bg-amber-100 text-amber-800 font-black px-2.5 py-1 rounded-md uppercase tracking-wider font-sans">Wipe All Records: Step 1 of 2</span>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight mt-3">Wipe & Purge Entire Database?</h3>
            <p className="text-xs text-slate-500 mt-2.5 leading-relaxed font-semibold">
              You are selecting a <span className="text-rose-600 font-extrabold">Complete Purge</span> of the database. This will delete all your bank accounts, cards, logged transaction entries, savings targets, investments, budgets, active commitments, and EMIs.
            </p>
            <p className="text-xs text-slate-400 mt-2 font-medium">
              You will be left with an entirely blank dashboard and you must set up all your assets, cards, and budgets by yourself.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setPurgeStep(2)}
                className="flex-1 text-xs bg-rose-600 hover:bg-rose-700 transition duration-150 text-white font-extrabold py-3 px-4 rounded-xl cursor-pointer shadow-sm active:scale-[0.98]"
              >
                Yes, Proceed to Final Step
              </button>
              <button
                onClick={() => setPurgeStep(0)}
                className="flex-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition duration-150 cursor-pointer active:scale-[0.98]"
              >
                No, Keep Everything
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PURGE DOUBLE CONFIRMATION MODAL - STEP 2 */}
      {purgeStep === 2 && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-xl border border-rose-100 text-left animate-scale-up">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4 border border-rose-100">
              <Lock className="w-6 h-6 shrink-0 animate-pulse" />
            </div>
            <span className="text-[9px] bg-rose-100 text-rose-805 font-black px-2.5 py-1 rounded-md uppercase tracking-wider font-sans">Critical Action: Final Step</span>
            <h3 className="text-base font-extrabold text-red-600 tracking-tight mt-3">Confirm Complete Purge</h3>
            <p className="text-xs text-slate-500 mt-2.5 leading-relaxed font-semibold">
              There is no way to restore your records once this process concludes. Every expense ledger, card, bank balance, and target tracker is deleted irreversibly.
            </p>

            <div className="flex items-start gap-2.5 bg-rose-50/40 p-3 rounded-xl border border-rose-100/50 my-4">
              <input
                type="checkbox"
                id="purgeUnderstandCheckbox"
                checked={purgeUnderstandCheckbox}
                onChange={(e) => setPurgeUnderstandCheckbox(e.target.checked)}
                className="mt-0.5 rounded border-rose-300 text-rose-600 focus:ring-rose-500 cursor-pointer h-4 w-4 shrink-0 shadow-xs"
              />
              <label htmlFor="purgeUnderstandCheckbox" className="text-[11px] text-slate-600 font-semibold select-none cursor-pointer leading-relaxed">
                Confirm: I am absolutely sure. Wipe all user-defined values, accounts, plans, logs, and categories completely.
              </label>
            </div>

            <div className="flex gap-3 mt-2">
              <button
                disabled={!purgeUnderstandCheckbox}
                onClick={handleFinalPurge}
                className={`flex-1 text-xs font-extrabold py-3 px-4 rounded-xl transition duration-150 shadow-sm flex items-center justify-center gap-1 ${
                  purgeUnderstandCheckbox 
                    ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer active:scale-[0.98]' 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" /> Wipe Entire System
              </button>
              <button
                onClick={() => {
                  setPurgeStep(0);
                  setPurgeUnderstandCheckbox(false);
                }}
                className="flex-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition duration-150 cursor-pointer active:scale-[0.98]"
              >
                Cancel Purge
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
