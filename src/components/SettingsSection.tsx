import React, { useState } from 'react';
import { FinanceData, Preferences, CategoryBudget } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useFinance } from '../context/FinanceContext';
import { INITIAL_FINANCE_DATA } from '../data/mockData';
import { saveUserFinanceData } from '../utils/firebase';
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
  Lock,
  Download,
  Upload,
  GitBranch,
  RefreshCw,
  Eye,
  EyeOff,
  Server,
  Copy,
  Database,
  GripVertical,
  ArrowUp,
  ArrowDown,
  LayoutGrid
} from 'lucide-react';
import { motion } from 'motion/react';

interface SettingsSectionProps {
  data: FinanceData;
  setFinanceData: React.Dispatch<React.SetStateAction<FinanceData>>;
  userEmail: string | null;
}

export default function SettingsSection({ data, setFinanceData, userEmail }: SettingsSectionProps) {
  const { preferences, investments = [], expenses = [], budgets = [] } = data;
  const { currentUser } = useFinance();

  // Local state for settings elements
  const [currency, setCurrency] = useState(preferences.currencySymbol);
  const [threshold, setThreshold] = useState(preferences.largeExpenseThreshold.toString());
  const [newCategory, setNewCategory] = useState('');
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(preferences.themeMode || 'light');
  const [accentColor, setAccentColor] = useState<'blue' | 'emerald' | 'yellow' | 'rose' | 'violet'>(preferences.accentColor || 'blue');

  // GitHub Live continuous sync engine state
  const [gitOwner, setGitOwner] = useState(() => localStorage.getItem('pm_git_owner') || 'anupam2511');
  const [gitRepo, setGitRepo] = useState(() => localStorage.getItem('pm_git_repo') || 'paisaflow');
  const [gitBranch, setGitBranch] = useState(() => localStorage.getItem('pm_git_branch') || 'main');
  const [gitToken, setGitToken] = useState(() => localStorage.getItem('pm_git_token') || '');
  const [showToken, setShowToken] = useState(false);
  const [gitCommitMsg, setGitCommitMsg] = useState('Sync newest budget structures & configs');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');

  // Card reordering states
  const DEFAULT_CARD_ORDER = [
    'parameters',
    'theme',
    'budget',
    'portability',
    'assets',
    'maintenance',
    'github'
  ];

  const [cardOrder, setCardOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('paisaflow_settings_card_order');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter(id => DEFAULT_CARD_ORDER.includes(id));
          const missing = DEFAULT_CARD_ORDER.filter(id => !valid.includes(id));
          return [...valid, ...missing];
        }
      } catch (e) {}
    }
    return DEFAULT_CARD_ORDER;
  });

  const [colsCount, setColsCount] = useState<number>(() => {
    const saved = localStorage.getItem('paisaflow_settings_cols_count');
    return saved ? parseInt(saved, 10) : 3;
  });

  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);

  const handleDragStart = (id: string) => {
    setDraggedCardId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetId: string) => {
    if (!draggedCardId || draggedCardId === targetId) return;
    const newOrder = [...cardOrder];
    const draggedIdx = newOrder.indexOf(draggedCardId);
    const targetIdx = newOrder.indexOf(targetId);
    if (draggedIdx !== -1 && targetIdx !== -1) {
      newOrder.splice(draggedIdx, 1);
      newOrder.splice(targetIdx, 0, draggedCardId);
      setCardOrder(newOrder);
      localStorage.setItem('paisaflow_settings_card_order', JSON.stringify(newOrder));
    }
    setDraggedCardId(null);
  };

  const handleMoveCard = (id: string, direction: 'up' | 'down') => {
    const idx = cardOrder.indexOf(id);
    if (idx === -1) return;
    const newOrder = [...cardOrder];
    if (direction === 'up' && idx > 0) {
      newOrder.splice(idx, 1);
      newOrder.splice(idx - 1, 0, id);
    } else if (direction === 'down' && idx < cardOrder.length - 1) {
      newOrder.splice(idx, 1);
      newOrder.splice(idx + 1, 0, id);
    }
    setCardOrder(newOrder);
    localStorage.setItem('paisaflow_settings_card_order', JSON.stringify(newOrder));
  };

  const handleSaveColsCount = (count: number) => {
    setColsCount(count);
    localStorage.setItem('paisaflow_settings_cols_count', count.toString());
  };

  const resetCardOrder = () => {
    setCardOrder(DEFAULT_CARD_ORDER);
    localStorage.setItem('paisaflow_settings_card_order', JSON.stringify(DEFAULT_CARD_ORDER));
    setColsCount(3);
    localStorage.setItem('paisaflow_settings_cols_count', '3');
  };

  const handleGitHubSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gitOwner || !gitRepo || !gitToken) {
      setSyncStatus('error');
      setSyncMessage('Username (Owner), Repository name, and Token are mandatory fields.');
      return;
    }

    setSyncStatus('syncing');
    setSyncMessage('Preparing workspace files and assembling Git delta tree...');

    try {
      localStorage.setItem('pm_git_owner', gitOwner);
      localStorage.setItem('pm_git_repo', gitRepo);
      localStorage.setItem('pm_git_branch', gitBranch);
      localStorage.setItem('pm_git_token', gitToken);

      const response = await fetch('/api/github/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          owner: gitOwner,
          repo: gitRepo,
          branch: gitBranch,
          token: gitToken,
          commitMessage: gitCommitMsg || 'Sync from PaisaFlow workspace'
        })
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || 'Sync request failed.');
      }

      setSyncStatus('success');
      setSyncMessage(resData.message || 'Perfectly synchronized and committed to GitHub!');
      
      setTimeout(() => {
        setSyncStatus('idle');
        setSyncMessage('');
      }, 7000);

    } catch (err: any) {
      setSyncStatus('error');
      setSyncMessage(err.message || 'Connection failure to sync gateway.');
    }
  };

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
      emis: [],
      ccEmis: [],
      ccTransactions: []
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

  // Data redundancy/portability handlers
  const [dragOver, setDragOver] = useState(false);
  const [importError, setImportError] = useState('');

  // Export to JSON helper
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
      
      setAlertOk('All ledger logs, portfolios, budgets, and parameters backed up successfully!');
      setTimeout(() => setAlertOk(''), 5000);
    } catch (err) {
      setAlertErr('Failed to compile data payload for export.');
    }
  };

  // Export Expenses Ledger to CSV helper
  const handleExportCSV = () => {
    try {
      const expensesList = data.expenses || [];
      if (expensesList.length === 0) {
        setAlertErr('Expense Ledger is empty. No rows to output.');
        setTimeout(() => setAlertErr(''), 4000);
        return;
      }

      // Safe CSV Column builder
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

      setAlertOk('Ledger history exported to standard CSV successfully!');
      setTimeout(() => setAlertOk(''), 4000);
    } catch (err) {
      setAlertErr('Failed to compose CSV payload.');
    }
  };

  // Import JSON configuration helper
  const handleImportFile = (file: File) => {
    setImportError('');
    setAlertOk('');
    setAlertErr('');
    
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      setImportError('Please supply a valid JSON configuration backup.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (typeof result !== 'string') {
          setImportError('Could not process upload stream content.');
          return;
        }

        const parsed = JSON.parse(result) as Partial<FinanceData>;
        
        // Dynamic schema assert elements
        if (!parsed.accounts || !Array.isArray(parsed.accounts)) {
          setImportError('Broken schema parameters: Missing ledger accounts array.');
          return;
        }

        const fallbackCats = [
          'Mutual Funds',
          'Government Schemes',
          'Gold Investment',
          'Fixed Deposits',
          'Stocks & Equities',
          'Alternative Assets'
        ];

        const fullyStructuredData: FinanceData = {
          ...parsed,
          accounts: parsed.accounts || [],
          savingGoals: parsed.savingGoals || [],
          incomes: parsed.incomes || [],
          expenses: parsed.expenses || [],
          recurringSpends: parsed.recurringSpends || [],
          budgets: parsed.budgets || [],
          preferences: {
            currencySymbol: parsed.preferences?.currencySymbol || currency,
            largeExpenseThreshold: parsed.preferences?.largeExpenseThreshold || parseFloat(threshold) || 4000,
            investmentCategories: parsed.preferences?.investmentCategories || fallbackCats,
            themeMode: parsed.preferences?.themeMode || themeMode,
            accentColor: parsed.preferences?.accentColor || accentColor,
            ...parsed.preferences
          },
          investments: parsed.investments || [],
          emis: parsed.emis || [],
          ccEmis: parsed.ccEmis || [],
          ccTransactions: parsed.ccTransactions || []
        };

        setFinanceData(fullyStructuredData);

        // Explicitly write the imported data to Cloud Firestore immediately to guarantee absolute synchronicity
        if (currentUser) {
          saveUserFinanceData(currentUser, fullyStructuredData).then(() => {
            console.log("Successfully synchronized imported file backup to Cloud Firestore.");
          }).catch(err => {
            console.error("Failed to push imported backup to Cloud Firestore server:", err);
            setImportError("Data loaded locally, but failed to sync to cloud database. Please check your credentials or connection.");
          });
        }
        
        // Sync interactive local state properties
        setCurrency(fullyStructuredData.preferences.currencySymbol);
        setThreshold(fullyStructuredData.preferences.largeExpenseThreshold.toString());
        setThemeMode(fullyStructuredData.preferences.themeMode || 'light');
        setAccentColor(fullyStructuredData.preferences.accentColor || 'blue');

        setAlertOk('Financial history and core parameters loaded of record successfully!');
        setTimeout(() => setAlertOk(''), 5000);
      } catch (e) {
        setImportError('Unable to parse file. Ensure it is a valid backup output.');
      }
    };
    reader.readAsText(file);
  };

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

  // Helper to render card header with uniform drag handle and manual move buttons
  const renderCardHeader = (id: string, IconComponent: any, title: string, subtitle: string) => {
    const visibleCards = cardOrder.filter(cId => cId !== 'github' || userEmail === 'anupam2511@gmail.com');
    const index = visibleCards.indexOf(id);
    const isFirst = index === 0;
    const isLast = index === visibleCards.length - 1;

    return (
      <div className="flex items-center justify-between pb-4 border-b border-slate-50 dark:border-slate-800/60 mb-5">
        <div className="flex items-center gap-2.5 min-w-0">
          <IconComponent className="w-5.5 h-5.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <div className="min-w-0">
            <h2 className="text-sm md:text-base font-extrabold text-slate-800 dark:text-slate-100 truncate">{title}</h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold truncate">{subtitle}</p>
          </div>
        </div>

        {/* Drag handle & Shift controls */}
        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => handleMoveCard(id, 'up')}
            disabled={isFirst}
            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer transition"
            title="Move Left/Up"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleMoveCard(id, 'down')}
            disabled={isLast}
            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer transition"
            title="Move Right/Down"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <div 
            className="p-1.5 text-slate-400 dark:text-slate-500 cursor-grab active:cursor-grabbing hover:text-slate-600 dark:hover:text-slate-350"
            title="Drag header block to rearrange"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    );
  };

  const renderCardById = (id: string) => {
    switch (id) {
      case 'parameters':
        return (
          <div id="settings-parameters-card" className="bg-white dark:bg-[#0b1329] p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-sm h-full flex flex-col justify-between">
            <div>
              {renderCardHeader('parameters', Settings, 'System Parameters', 'Configure visual prefixes and spend indicator flags.')}
              <form onSubmit={handleSaveGeneralConfig} className="space-y-5">
                {/* Currency Symbol Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Default Currency Symbol</label>
                  <div className="grid grid-cols-5 gap-2">
                    {['₹', '$', '€', '£', '¥'].map(sym => (
                      <button
                        key={sym}
                        type="button"
                        onClick={() => setCurrency(sym)}
                        className={`py-2.5 rounded-xl border text-sm font-extrabold transition cursor-pointer flex justify-center items-center ${
                          currency === sym
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/10'
                            : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-350 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {sym}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                    Changing this immediately overrides the notation structure for all balances, allocations, and expenditures.
                  </p>
                </div>

                {/* Large Expense Threshold Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">
                    Large Outgoings Alert Threshold
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-slate-400 text-xs font-extrabold">{currency}</span>
                    <input
                      type="number"
                      placeholder="e.g. 4000"
                      value={threshold}
                      onChange={(e) => setThreshold(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-600 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 rounded-xl py-3 pl-8 pr-3.5 outline-none transition font-semibold text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                    Any individual debit transaction that equals or exceeds this limit will trigger a vivid yellow high-spend flag in your Expense Ledger.
                  </p>
                </div>

                {/* Submission Alerts */}
                {alertErr && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/40 rounded-xl text-xs flex items-center gap-1.5 font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{alertErr}</span>
                  </div>
                )}

                {alertOk && (
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-900/40 rounded-xl text-xs flex items-center gap-1.5 font-bold">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>{alertOk}</span>
                  </div>
                )}
              </form>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-50 dark:border-slate-800/40">
              <button
                type="button"
                onClick={handleSaveGeneralConfig}
                className="w-full text-xs bg-indigo-600 hover:bg-indigo-700 transition text-white font-extrabold py-3.5 rounded-xl shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save System Parameters
              </button>
            </div>
          </div>
        );

      case 'theme':
        return (
          <div id="settings-theme-card" className="bg-white dark:bg-[#0b1329] p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-sm h-full flex flex-col justify-between">
            <div>
              {renderCardHeader('theme', Palette, 'Theme & Aesthetics', 'Configure visual themes and responsive accent colors.')}
              <div className="space-y-6">
                {/* Theme modes choices */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 tracking-wider">Display Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleThemeChange('light')}
                      className={`py-3 px-2 rounded-xl border text-xs font-black transition cursor-pointer flex flex-col justify-center items-center gap-1.5 ${
                        themeMode === 'light'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/10'
                          : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-350 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
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
                          : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-350 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
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
                          : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-350 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Monitor className="w-4 h-4 shrink-0" />
                      <span>System</span>
                    </button>
                  </div>
                </div>

                {/* Accent Hue Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 tracking-wider">Accent Color Palette</label>
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
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-450 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full ${opt.color} shadow-xs shrink-0`}></span>
                        <span className="text-[9px] font-bold scale-90 truncate max-w-full">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2.5 leading-relaxed font-semibold">
                    Changing palettes dynamically coordinates global buttons, charts, highlights, and headers transparently.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'budget':
        return (
          <div id="settings-budget-categories-card" className="bg-white dark:bg-[#0b1329] p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-sm h-full flex flex-col">
            <div className="flex-1 flex flex-col min-h-0">
              {renderCardHeader('budget', FolderPlus, 'Budget Categories', 'Add or prune expense classifications for spend caps.')}
              
              {/* ADD BUDGET CATEGORY FORM */}
              <form onSubmit={handleAddBudgetCategory} className="flex gap-2 mb-4 shrink-0">
                <input
                  type="text"
                  placeholder="e.g. Health, Coffee, Gym"
                  value={customCategoryName}
                  onChange={(e) => setCustomCategoryName(e.target.value)}
                  className="flex-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-600 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 rounded-xl py-2.5 px-3.5 outline-none transition text-slate-800 dark:text-slate-200"
                />
                <button
                  type="submit"
                  className="text-white bg-indigo-600 hover:bg-indigo-700 transition font-extrabold text-xs px-4 rounded-xl flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </form>

              {budgetSuccess && (
                <div className="mb-3 p-2 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-900/40 rounded-xl text-[10px] font-bold flex items-center gap-1 shrink-0">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{budgetSuccess}</span>
                </div>
              )}

              {budgetError && (
                <div className="mb-3 p-2 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/40 rounded-xl text-[10px] font-bold flex items-center gap-1 shrink-0">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{budgetError}</span>
                </div>
              )}

              {/* LIST CURRENT BUDGET CATEGORIES */}
              <div className="space-y-2 mt-4 overflow-y-auto pr-1 flex-1 min-h-[220px] max-h-[480px]">
                {budgets.map(b => {
                  const count = expenses.filter(exp => exp.category.toLowerCase() === b.category.toLowerCase()).length;
                  
                  return (
                    <div key={b.category} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800/60 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400"></span>
                        <span className="font-extrabold text-slate-700 dark:text-slate-300">{b.category}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                          {count} {count === 1 ? 'expense' : 'expenses'}
                        </span>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => handleDeleteBudgetCategory(b.category)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition cursor-pointer"
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
        );

      case 'portability':
        return (
          <div id="settings-data-portability-card" className="bg-white dark:bg-[#0b1329] p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-sm h-full flex flex-col justify-between">
            <div>
              {renderCardHeader('portability', Download, 'Data Backup & Portability', 'Backup, migrate, or export your ledger transactions seamlessly.')}
              
              <div className="space-y-4">
                {/* Export Section */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Export Backups</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleExportJSON}
                      className="py-3 px-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-350 cursor-pointer flex flex-col items-center justify-center gap-1.5 transition active:scale-[0.98]"
                      title="Download full configuration backup"
                    >
                      <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Backup JSON</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="py-3 px-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-350 cursor-pointer flex flex-col items-center justify-center gap-1.5 transition active:scale-[0.98]"
                      title="Export expenses to CSV format"
                    >
                      <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-450" />
                      <span>Ledger CSV</span>
                    </button>
                  </div>
                </div>

                {/* Import Section */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Restore Backup</label>
                  
                  <div 
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      const files = e.dataTransfer.files;
                      if (files && files.length > 0) {
                        handleImportFile(files[0]);
                      }
                    }}
                    className={`relative border-2 border-dashed rounded-2xl p-4 text-center transition flex flex-col items-center justify-center min-h-[120px] ${
                      dragOver 
                        ? 'border-indigo-600 bg-indigo-50/30' 
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20'
                    }`}
                  >
                    <input 
                      type="file"
                      accept=".json"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          handleImportFile(files[0]);
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      id="data-import-input"
                    />
                    <Upload className="w-6 h-6 text-slate-400 dark:text-slate-700 mb-2" />
                    <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Click or Drag JSON backup here</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Accepts .json backup files compiled by PaisaFlow</span>
                  </div>

                  {importError && (
                    <div className="mt-2.5 p-2.5 bg-rose-50/70 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30 rounded-xl text-[10px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5 transition">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{importError}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'assets':
        return (
          <div id="settings-asset-categories-card" className="bg-white dark:bg-[#0b1329] p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-sm h-full flex flex-col">
            <div className="flex-1 flex flex-col min-h-0">
              {renderCardHeader('assets', Coins, 'Asset Holding Categories', 'Add or restructure classification modules for wealth tracking.')}
              
              {/* ADD CATEGORY FORM */}
              <form onSubmit={handleAddCategory} className="flex gap-2 mb-4 shrink-0">
                <input
                  type="text"
                  placeholder="e.g. Crypto, Real Estate, Art"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="flex-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-600 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 rounded-xl py-2.5 px-3.5 outline-none transition text-slate-800 dark:text-slate-200"
                />
                <button
                  type="submit"
                  className="text-white bg-indigo-600 hover:bg-indigo-700 transition font-extrabold text-xs px-4 rounded-xl flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </form>

              {/* LIST CURRENT CATEGORIES */}
              <div className="space-y-2 mt-4 overflow-y-auto pr-1 flex-1 min-h-[220px] max-h-[480px]">
                {currentCategories.map(cat => {
                  const count = investments.filter(inv => inv.type.toLowerCase() === cat.toLowerCase() || inv.type === cat).length;
                  
                  return (
                    <div key={cat} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800/60 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400"></span>
                        <span className="font-extrabold text-slate-700 dark:text-slate-300">{cat}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                          {count} {count === 1 ? 'asset' : 'assets'}
                        </span>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition cursor-pointer"
                        title={`Delete "${cat}"`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 'maintenance':
        return (
          <div id="settings-maintenance-card" className="bg-white dark:bg-[#0b1329] p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-sm h-full flex flex-col justify-between">
            <div>
              {renderCardHeader('maintenance', RotateCcw, 'System Data Maintenance', 'Restore default metrics or clear the database safely.')}
              
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
        );

      case 'github':
        if (userEmail !== 'anupam2511@gmail.com') return null;
        return (
          <div id="settings-github-sync-card" className="bg-white dark:bg-[#0b1329] p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-sm h-full flex flex-col justify-between">
            <div>
              {renderCardHeader('github', GitBranch, '1-Click GitHub Publisher', 'Instantly push workspace changes directly to trigger your hosting.')}
              
              <form onSubmit={handleGitHubSync} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">GitHub Owner</label>
                    <input
                      type="text"
                      value={gitOwner}
                      onChange={(e) => setGitOwner(e.target.value)}
                      className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 bg-slate-50/60 dark:bg-slate-900 focus:outline-hidden focus:border-indigo-500 dark:focus:border-indigo-500 font-bold text-slate-700 dark:text-slate-300"
                      placeholder="e.g. anupam2511"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Repository</label>
                    <input
                      type="text"
                      value={gitRepo}
                      onChange={(e) => setGitRepo(e.target.value)}
                      className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 bg-slate-50/60 dark:bg-slate-900 focus:outline-hidden focus:border-indigo-500 dark:focus:border-indigo-500 font-bold text-slate-700 dark:text-slate-300"
                      placeholder="e.g. paisaflow"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Branch</label>
                  <input
                    type="text"
                    value={gitBranch}
                    onChange={(e) => setGitBranch(e.target.value)}
                    className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 bg-slate-50/60 dark:bg-slate-900 focus:outline-hidden focus:border-indigo-500 dark:focus:border-indigo-500 font-bold text-slate-700 dark:text-slate-300"
                    placeholder="e.g. main"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Commit Description</label>
                  <input
                    type="text"
                    value={gitCommitMsg}
                    onChange={(e) => setGitCommitMsg(e.target.value)}
                    className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 bg-slate-50/60 dark:bg-slate-900 focus:outline-hidden focus:border-indigo-500 dark:focus:border-indigo-500 font-bold text-slate-700 dark:text-slate-300"
                    placeholder="Describe current system updates"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">GitHub PAT Key</label>
                    <a
                      href="https://github.com/settings/tokens/new?scopes=repo&description=PaisaFlow%201-Click%2520Sync"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[9px] text-indigo-600 dark:text-indigo-400 font-extrabold hover:underline"
                    >
                      New token →
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={gitToken}
                      onChange={(e) => setGitToken(e.target.value)}
                      className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 pr-10 bg-slate-50/60 dark:bg-slate-900 focus:outline-hidden focus:border-indigo-500 dark:focus:border-indigo-500 font-mono text-slate-800 dark:text-slate-100 font-bold"
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 dark:text-slate-650 hover:text-slate-700 dark:hover:text-slate-300 transition"
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {syncMessage && (
                  <div className={`p-3.5 rounded-2xl flex items-start gap-2.5 border text-xs leading-relaxed font-semibold ${
                    syncStatus === 'syncing' 
                      ? 'bg-blue-50/60 border-blue-100 text-blue-700 dark:bg-blue-950/20 dark:border-blue-900/40 dark:text-blue-300' 
                      : syncStatus === 'success'
                      ? 'bg-emerald-50/60 border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-300'
                      : 'bg-rose-50/60 border-rose-100 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-450'
                  }`}>
                    {syncStatus === 'syncing' ? (
                      <RefreshCw className="w-4.5 h-4.5 shrink-0 animate-spin text-blue-500" />
                    ) : syncStatus === 'success' ? (
                      <GitBranch className="w-4.5 h-4.5 shrink-0 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-4.5 h-4.5 shrink-0 text-rose-500" />
                    )}
                    <span>{syncMessage}</span>
                  </div>
                )}
              </form>
            </div>
            <div className="mt-5 pt-4">
              <button
                type="button"
                onClick={handleGitHubSync}
                disabled={syncStatus === 'syncing'}
                className={`w-full text-xs font-black py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition transform active:scale-[0.99] cursor-pointer ${
                  syncStatus === 'syncing'
                    ? 'bg-slate-150 text-slate-450 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                    : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/15 text-white'
                }`}
              >
                <RefreshCw className={`w-4 h-4 shrink-0 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                <span>{syncStatus === 'syncing' ? 'Publishing Workspace...' : 'Push & Publish Changes to GitHub'}</span>
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* CUSTOMIZATION CONTROL BAR */}
      <div className="bg-white dark:bg-[#0b1329] p-5 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-100/50 dark:border-indigo-900/30 shrink-0">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-extrabold text-slate-800 dark:text-slate-100">Workspace Customization</h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold leading-normal">Drag headers to arrange, tap arrows to shift, or set your preferred columns.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 px-2">Columns:</span>
            {[1, 2, 3].map(cols => (
              <button
                key={cols}
                type="button"
                onClick={() => handleSaveColsCount(cols)}
                className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg transition ${
                  colsCount === cols
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {cols} Col{cols > 1 ? 's' : ''}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={resetCardOrder}
            className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-100/60 dark:hover:bg-indigo-950/40 border border-indigo-100/40 dark:border-indigo-900/30 px-3 py-2 rounded-xl cursor-pointer transition active:scale-95"
          >
            Reset Defaults
          </button>
        </div>
      </div>

      {/* DYNAMIC SETTINGS CARDS GRID */}
      <div className={`grid grid-cols-1 ${
        colsCount === 1 
          ? 'grid-cols-1' 
          : colsCount === 2 
          ? 'lg:grid-cols-2' 
          : 'lg:grid-cols-2 xl:grid-cols-3'
      } gap-6`}>
        {cardOrder.map(id => {
          if (id === 'github' && userEmail !== 'anupam2511@gmail.com') return null;
          
          return (
            <div
              key={id}
              draggable
              onDragStart={() => handleDragStart(id)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(id)}
              className={`transition-all duration-300 ${
                draggedCardId === id 
                  ? 'opacity-40 scale-95 border-dashed border-2 border-indigo-400 rounded-3xl' 
                  : 'opacity-100 scale-100'
              }`}
            >
              {renderCardById(id)}
            </div>
          );
        })}
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
