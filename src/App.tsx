/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FinanceData } from './types';
import { INITIAL_FINANCE_DATA } from './data/mockData';
import { formatCurrency } from './utils/formatters';
import { processAutoDebits } from './utils/billing';
import { auth, signOutUser, getUserFinanceData, saveUserFinanceData } from './utils/firebase';
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';

// Component Imports
import Dashboard from './components/Dashboard';
import AccountsSection from './components/AccountsSection';
import IncomeSection from './components/IncomeSection';
import BudgetsSection from './components/BudgetsSection';
import RecurringSpendsSection from './components/RecurringSpendsSection';
import EmisSection from './components/EmisSection';
import ExpensesSection from './components/ExpensesSection';
import SavingsGoalsSection from './components/SavingsGoalsSection';
import InvestmentsSection from './components/InvestmentsSection';
import SettingsSection from './components/SettingsSection';
import LoginScreen from './components/LoginScreen';
import UserManualPanel from './components/UserManualPanel';
import ForecastingSection from './components/ForecastingSection';
import EmergencyFundSection from './components/EmergencyFundSection';

/// Lucide Icons
import {
  PieChart,
  Landmark,
  ArrowUpRight,
  Sliders,
  Repeat,
  ArrowDownRight,
  Wallet,
  ShieldAlert,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  Target,
  Coins,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  CalendarClock,
  LogOut,
  TrendingUp,
  Percent
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [financeData, setFinanceData] = useState<FinanceData>(() => {
    return JSON.parse(JSON.stringify(INITIAL_FINANCE_DATA));
  });

  // Handle Firebase Auth listening
  useEffect(() => {
    // Process redirect result if returning from Google Auth flow
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log("Redirect sign-in success:", result.user.email);
        }
      })
      .catch((error) => {
        console.error("Redirect sign-in handler error:", error);
      });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user.uid);
        setUserEmail(user.email);
        setUserDisplayName(user.displayName);
        localStorage.setItem('paisaflow_active_user', user.uid);

        // Load secure data from Firestore
        try {
          const dbData = await getUserFinanceData(user.uid);
          if (dbData) {
            setFinanceData(dbData);
          } else {
            // Check legacy local storage fallback
            const legacyKey = `personal_finance_dashboard_data_user_${user.uid.toLowerCase()}`;
            const legacyDataStr = localStorage.getItem(legacyKey);
            if (legacyDataStr) {
              const parsed = JSON.parse(legacyDataStr);
              setFinanceData(parsed);
              // Save to Firestore so it is stored safely in the cloud
              await saveUserFinanceData(user.uid, parsed);
            } else {
              // Create brand new account dataset from INITIAL_FINANCE_DATA
              const freshClone = JSON.parse(JSON.stringify(INITIAL_FINANCE_DATA));
              setFinanceData(freshClone);
              await saveUserFinanceData(user.uid, freshClone);
            }
          }
        } catch (error) {
          console.error("Failed to load user data from Firestore", error);
        }
      } else {
        setCurrentUser(null);
        setUserEmail(null);
        setUserDisplayName(null);
        localStorage.removeItem('paisaflow_active_user');
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const [currentTab, setCurrentTab] = useState('dashboard');
  const [resetMessage, setResetMessage] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);

  // Sidebar responsive collapsible states
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Auto-debit processing logs / notifications
  const [autoDebitLogs, setAutoDebitLogs] = useState<string[]>([]);

  // Automatically check and process auto-debits on login & whenever spends or investments load/change
  useEffect(() => {
    if (!currentUser) return;

    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const todayStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    const result = processAutoDebits(financeData, todayStr);
    if (result.changed) {
      setFinanceData(result.updatedData);
      setAutoDebitLogs(prev => {
        const uniqueNew = result.notifications.filter(n => !prev.includes(n));
        return [...prev, ...uniqueNew];
      });
    }
  }, [currentUser, financeData.recurringSpends, financeData.investments]);

  // Persist schema modifications instantly per user session
  useEffect(() => {
    if (!currentUser) return;
    try {
      const userKey = `personal_finance_dashboard_data_user_${currentUser.toLowerCase()}`;
      localStorage.setItem(userKey, JSON.stringify(financeData));
      
      // Mirror to Firestore securely
      saveUserFinanceData(currentUser, financeData).catch(err => {
        console.error('Firestore duplex Sync error:', err);
      });
    } catch (e) {
      console.error('Storage sync error:', e);
    }
  }, [financeData, currentUser]);

  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch (e) {
      console.error('Logout error:', e);
    }
    setIsMobileMenuOpen(false);
  };

  // Color theme tables targeting root tailwind custom properties
  const colorPalettes = {
    yellow: {
      '50': '#fefde8',
      '100': '#fdf9bf',
      '200': '#faf18f',
      '300': '#f7e864',
      '400': '#f4e44f',
      '500': '#f4ca3e',
      '600': '#d3be2d',
      '700': '#ae9a1a',
      '800': '#8a780b',
      '900': '#706103',
    },
    blue: {
      '50': '#eff6ff',
      '100': '#dbeafe',
      '200': '#bfdbfe',
      '300': '#93c5fd',
      '400': '#60a5fa',
      '500': '#3b82f6',
      '600': '#2563eb',
      '700': '#1d4ed8',
      '800': '#1e40af',
      '900': '#1e3a8a',
    },
    emerald: {
      '50': '#ecfdf5',
      '100': '#d1fae5',
      '200': '#a7f3d0',
      '300': '#6ee7b7',
      '400': '#34d399',
      '500': '#10b981',
      '600': '#059669',
      '700': '#047857',
      '800': '#065f46',
      '900': '#064e3b',
    },
    rose: {
      '50': '#fff1f2',
      '100': '#ffe4e6',
      '200': '#fecdd3',
      '300': '#fda4af',
      '400': '#fb7185',
      '500': '#f43f5e',
      '600': '#e11d48',
      '700': '#be123c',
      '800': '#9f1239',
      '900': '#881337',
    },
    violet: {
      '50': '#f5f3ff',
      '100': '#ede9fe',
      '200': '#ddd6fe',
      '300': '#c4b5fd',
      '400': '#a78bfa',
      '500': '#8b5cf6',
      '600': '#7c3aed',
      '700': '#6d28d9',
      '800': '#5b21b6',
      '900': '#4c1d95',
    },
  };

  // Dynamic App Styling and Theme Engine
  useEffect(() => {
    const root = document.documentElement;
    const pref = financeData.preferences;
    const mode = pref.themeMode || 'light';
    const accent = pref.accentColor || 'blue';

    // 1. Resolve Dark Mode helper
    const resolveMode = () => {
      if (mode === 'dark') return true;
      if (mode === 'light') return false;
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    };

    if (resolveMode()) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // 2. Set Custom Accent Colors overriding values of tailwind custom-properties: `--color-indigo-xxx`
    const palette = colorPalettes[accent as keyof typeof colorPalettes] || colorPalettes.blue;
    Object.entries(palette).forEach(([shade, hex]) => {
      root.style.setProperty(`--color-indigo-${shade}`, hex);
    });

    // Also custom listener if system changes and system is active
    if (mode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        if (e.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [financeData.preferences.themeMode, financeData.preferences.accentColor]);

  // Global Financial Statistics Header Metrics
  const bankAccounts = financeData.accounts.filter(a => a.type === 'bank');
  const creditCards = financeData.accounts.filter(a => a.type === 'credit_card');

  const totalLiquidAssets = bankAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalOutstandingCredit = creditCards.reduce((sum, a) => sum + a.balance, 0);
  const aggregateNetWorth = totalLiquidAssets - totalOutstandingCredit;

  // Handles resetting state to default seed data for clear demonstration
  const handleResetToDefaults = () => {
    setShowResetConfirm(true);
  };

  const handleConfirmReset = () => {
    const freshDeepClone = JSON.parse(JSON.stringify(INITIAL_FINANCE_DATA));
    setFinanceData(freshDeepClone);
    setCurrentTab('dashboard');
    setShowResetConfirm(false);
    setIsMobileMenuOpen(false);
    setResetMessage('All demo financial pools restored to original preset specs!');
    setTimeout(() => setResetMessage(''), 4000);
  };

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: PieChart },
    { id: 'accounts', label: 'Accounts & Cards', icon: Landmark },
    { id: 'income', label: 'Income Accounts', icon: ArrowUpRight },
    { id: 'budgets', label: 'Budget Caps', icon: Sliders },
    { id: 'subscriptions', label: 'Subscriptions', icon: Repeat },
    { id: 'emis', label: 'EMI Trackers', icon: CalendarClock },
    { id: 'transactions', label: 'Expense Ledger', icon: ArrowDownRight },
    { id: 'savings', label: 'Savings Milestones', icon: Target },
    { id: 'investments', label: 'Investments Portfolio', icon: Coins },
    { id: 'forecasting', label: 'Wealth Forecast', icon: TrendingUp },
    { id: 'emergency', label: 'Emergency Shield', icon: ShieldAlert },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  // Render Section dynamically based on active selected tab
  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <Dashboard 
            data={financeData} 
            setFinanceData={setFinanceData} 
            setCurrentTab={setCurrentTab} 
          />
        );
      case 'accounts':
        return (
          <AccountsSection 
            data={financeData} 
            setFinanceData={setFinanceData} 
          />
        );
      case 'income':
        return (
          <IncomeSection 
            data={financeData} 
            setFinanceData={setFinanceData} 
          />
        );
      case 'budgets':
        return (
          <BudgetsSection 
            data={financeData} 
            setFinanceData={setFinanceData} 
          />
        );
      case 'subscriptions':
        return (
          <RecurringSpendsSection 
            data={financeData} 
            setFinanceData={setFinanceData} 
          />
        );
      case 'emis':
        return (
          <EmisSection 
            data={financeData} 
            setFinanceData={setFinanceData} 
          />
        );
      case 'transactions':
        return (
          <ExpensesSection 
            data={financeData} 
            setFinanceData={setFinanceData} 
          />
        );
      case 'savings':
        return (
          <SavingsGoalsSection 
            data={financeData} 
            setFinanceData={setFinanceData} 
          />
        );
      case 'investments':
        return (
          <InvestmentsSection 
            data={financeData} 
            setFinanceData={setFinanceData} 
          />
        );
      case 'forecasting':
        return (
          <ForecastingSection 
            data={financeData} 
          />
        );
      case 'emergency':
        return (
          <EmergencyFundSection 
            data={financeData} 
            setFinanceData={setFinanceData}
          />
        );
      case 'settings':
        return (
          <SettingsSection 
            data={financeData} 
            setFinanceData={setFinanceData} 
            userEmail={userEmail}
          />
        );
      default:
        return (
          <Dashboard 
            data={financeData} 
            setFinanceData={setFinanceData} 
            setCurrentTab={setCurrentTab} 
          />
        );
    }
  };

  const handleSelectTab = (tabId: string) => {
    setCurrentTab(tabId);
    setIsMobileMenuOpen(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#030712] flex flex-col justify-center items-center">
        <div className="w-16 h-16 bg-indigo-600 rounded-2.5xl flex items-center justify-center shadow-xl shadow-indigo-600/15 animate-bounce text-white font-bold text-3xl">
          ₹
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black mt-5 uppercase tracking-widest animate-pulse">
          Verifying Encrypted Space...
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <div id="application-container" className="min-h-screen bg-slate-50 dark:bg-[#070c19] text-slate-800 dark:text-slate-100 flex antialiased overflow-x-hidden max-w-full">
      
      {/* MOBILE MENU DRAWER OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)} 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden" 
        />
      )}

      {/* MOBILE DRAWER SIDEBAR */}
      <aside 
        className={`fixed inset-y-0 left-0 bg-white dark:bg-[#0b1329] border-r border-slate-100 dark:border-slate-800/80 flex flex-col justify-between transition-transform duration-300 z-50 md:hidden w-64 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md text-white font-bold text-base shrink-0">
                ₹
              </div>
              <div>
                <span className="text-base font-black text-slate-800 dark:text-slate-100 tracking-tight block">PaisaFlow</span>
                <span className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Capital Suite</span>
              </div>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="p-1 text-slate-400 hover:text-slate-850 dark:hover:text-slate-105"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 py-4 overflow-y-auto px-3 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 text-xs font-bold py-3 px-3 rounded-xl transition cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/15'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-205'
                  }`}
                >
                  <Icon className="w-4.5 h-4.5 shrink-0" />
                  <span className="font-sans font-bold">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom actions */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800/85 space-y-1.5 shrink-0">
            <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl mb-1 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
              <span className="truncate" title={userEmail || currentUser || ""}>User: {userDisplayName || userEmail || currentUser}</span>
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0"></span>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100/50 hover:border-rose-250 dark:border-rose-800 font-bold text-[10px] uppercase tracking-wider transition duration-200 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span>Lock and Logout</span>
            </button>
            <button
              onClick={() => setIsManualOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-150 dark:border-indigo-900/50 hover:border-indigo-305 dark:hover:border-indigo-800 font-bold text-[10px] uppercase tracking-wider transition duration-200 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 shrink-0" />
              <span>How To Use</span>
            </button>
          </div>
        </div>
      </aside>

      {/* DESKTOP PERSISTENT COLLAPSIBLE SIDEBAR */}
      <aside 
        className={`hidden md:flex flex-col justify-between transition-all duration-300 sticky top-0 h-screen z-40 bg-white dark:bg-[#0b1329] border-r border-slate-100 dark:border-slate-800/80 ${
          isCollapsed ? 'w-[76px]' : 'w-64'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Top Brand Block */}
          <div className="p-4 border-b border-slate-50 dark:border-slate-800/50 flex items-center gap-3 shrink-0 h-[73px] overflow-hidden">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/15 text-white font-bold tracking-tight text-xl shrink-0">
              ₹
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <span className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-4 block">PaisaFlow</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block mt-0.5">Secure Wealth Space</span>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex-grow py-4 overflow-y-auto px-3 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 text-xs font-bold py-3 px-3 rounded-xl transition cursor-pointer relative group ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/15'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!isCollapsed && (
                    <span className="truncate font-sans font-bold">
                      {item.label}
                    </span>
                  )}
                  {isCollapsed && (
                    <div className="absolute left-full ml-3 px-2 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition duration-150 whitespace-nowrap pointer-events-none z-50 shadow-md">
                      {item.label}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom actions */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 shrink-0">
            {!isCollapsed && (
              <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 rounded-xl mb-1 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 animate-fade-in">
                <span className="truncate" title={userEmail || currentUser || ""}>Active: {userDisplayName || userEmail || currentUser}</span>
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0"></span>
              </div>
            )}
            
            <button
              onClick={handleLogout}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100/50 hover:border-rose-200 font-bold transition duration-200 cursor-pointer ${
                isCollapsed ? 'px-0' : 'px-3 text-[10px] uppercase tracking-wider'
              }`}
              title="Secure Logout / Lock Space"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              {!isCollapsed && <span className="truncate">Lock & Logout</span>}
            </button>

            {/* How To Use Button */}
            <button
              onClick={() => setIsManualOpen(true)}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border border-indigo-100/40 dark:border-indigo-900/40 hover:border-indigo-300 font-bold transition duration-200 cursor-pointer ${
                isCollapsed ? 'px-0' : 'px-3 text-[10px] uppercase tracking-wider'
              }`}
              title="Open PaisaFlow Interactive User Manual"
            >
              <HelpCircle className="w-3.5 h-3.5 shrink-0" />
              {!isCollapsed && <span className="truncate">How To Use</span>}
            </button>

            {/* Toggle trigger */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-full flex items-center justify-center gap-2 py-2 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 rounded-xl transition cursor-pointer"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                  <ChevronLeft className="w-4 h-4" />
                  <span>Collapse Sidebar</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* RIGHT WORKSPACE PANELS */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* GLOBAL HEADER (NET WEALTH METRICS AND MOBILE TRIGGERS) */}
        <header className="bg-white dark:bg-[#0b1329] border-b border-slate-100 dark:border-slate-800/80 sticky top-0 z-30 shadow-xs h-[73px] flex items-center shrink-0">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center gap-4">
              
              {/* Left Segment: Mobile burger handler & Dashboard Title */}
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl border border-slate-150 dark:border-slate-800 cursor-pointer"
                  title="Open Navigation Drawer"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div className="hidden sm:block">
                  <h1 className="text-sm font-bold text-slate-600 dark:text-slate-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                    Live Capital HUD
                  </h1>
                </div>
              </div>

              {/* Net worth readouts */}
              <div className="flex bg-slate-50 dark:bg-slate-905/40 dark:bg-slate-900 rounded-xl px-2.5 py-1.5 sm:px-4 sm:py-2 border border-slate-100 dark:border-slate-800 w-auto shrink-0 gap-3 md:gap-5 max-w-full">
                <div className="hidden sm:block">
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-extrabold leading-3 block">Cash reserves</span>
                  <span id="header-liquid-readout" className="text-xs md:text-sm font-black text-slate-700 dark:text-slate-200 block whitespace-nowrap font-mono mt-0.5">
                    {formatCurrency(totalLiquidAssets, financeData.preferences)}
                  </span>
                </div>
                <div className="hidden sm:block border-l border-slate-200 dark:border-slate-800 pl-3 md:pl-4">
                  <span className="text-[9px] text-slate-450 dark:text-slate-500 uppercase font-extrabold leading-3 block text-rose-500/90">Credit cards</span>
                  <span id="header-credit-readout" className="text-xs md:text-sm font-black text-rose-600 dark:text-rose-400 block whitespace-nowrap font-mono mt-0.5">
                    {formatCurrency(totalOutstandingCredit, financeData.preferences)}
                  </span>
                </div>
                <div className="sm:border-l sm:border-slate-200 dark:sm:border-slate-850 sm:pl-3 md:pl-4">
                  <span className="text-[9px] text-zinc-400 dark:text-slate-500 uppercase font-extrabold leading-3 block text-right">Net Worth</span>
                  <span id="header-net-readout" className={`text-xs md:text-sm font-extrabold block whitespace-nowrap font-mono mt-0.5 text-right ${aggregateNetWorth >= 0 ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-600 dark:text-rose-450'}`}>
                    {formatCurrency(aggregateNetWorth, financeData.preferences)}
                  </span>
                </div>
              </div>

            </div>
          </div>
        </header>

        {/* Content Area with optional Right-Side User Manual */}
        <div id="workspace-viewport" className="flex-grow flex min-h-0 overflow-hidden h-[calc(100vh-73px)]">
          
          {/* Main scrollable viewport */}
          <div className="flex-grow flex flex-col overflow-y-auto overflow-x-hidden min-w-0">
            <main id="main-content-layout" className="flex-grow py-8 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
              {autoDebitLogs.length > 0 && (
                <div className="mb-6 p-5 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 rounded-3xl text-sm font-medium animate-fade-in text-slate-800 dark:text-slate-100 relative overflow-hidden backdrop-blur-md">
                  <div className="absolute top-0 right-0 p-2">
                    <button
                      onClick={() => setAutoDebitLogs([])}
                      className="p-1 px-2.5 text-xs text-slate-400 hover:text-slate-650 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition font-extrabold cursor-pointer"
                      title="Clear notifications"
                    >
                      Acknowledge & Close
                    </button>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-100 dark:border-emerald-900/30 shrink-0">
                      <CalendarClock className="w-5 h-5 animate-bounce" style={{ animationDuration: '3s' }} />
                    </div>
                    <div className="flex-grow">
                      <h4 className="text-sm font-black text-slate-900 dark:text-slate-50 uppercase tracking-widest flex items-center gap-2">
                        Automatic Subscription Renewal
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-805 dark:text-emerald-305 font-bold px-1.5 py-0.5 rounded-md">🔄 Processed Auto-Debits</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 font-bold">The following payments were charged & logged automatically on their due dates:</p>
                      <ul className="mt-2 text-xs space-y-1.5 list-disc pl-4 font-semibold text-slate-650 dark:text-slate-350">
                        {autoDebitLogs.map((log, index) => (
                          <li key={index} className="leading-relaxed">
                            {log}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {resetMessage && (
                <div className="mb-6 p-4 bg-teal-50 border border-teal-100 text-teal-700 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>{resetMessage}</span>
                </div>
              )}

              <div className="transition-opacity duration-200">
                {renderTabContent()}
              </div>
            </main>

            <footer id="workspace-footer" className="bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/80 py-6 text-center text-xs text-slate-400 font-semibold mt-auto shrink-0">
              <p>PaisaFlow • Comprehensive Monthly Capital Manager & Tracker • Fully Offline secure client-side storage (localStorage)</p>
            </footer>
          </div>

          {/* RIGHT WORKSPACE MANUAL SIDEBAR */}
          {isManualOpen && (
            <UserManualPanel
              isOpen={isManualOpen}
              onClose={() => setIsManualOpen(false)}
              currentTab={currentTab}
            />
          )}

        </div>

      </div>
    </div>
  );
}
