/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { featureRegistry } from './features/registry';
import { formatCurrency } from './utils/formatters';

// Component Imports
import LoginScreen from './components/LoginScreen';
import UserManualPanel from './components/UserManualPanel';
import { ToastContainer } from './components/shared/ToastContainer';
import { SectionSkeleton } from './components/shared/SkeletonLoader';

// Lucide Icons
import {
  X,
  Menu,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LogOut,
  HelpCircle,
  CalendarClock,
  CheckCircle,
  BookOpen,
  User,
  PieChart,
  Landmark,
  ArrowDownRight,
  CreditCard,
  Target,
  Settings
} from 'lucide-react';

const friendlyLabels: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Overview HUD', subtitle: 'Quick metrics & wealth summary' },
  forecasting: { title: 'Wealth Predictor', subtitle: 'Compounding future forecasts' },
  annual_review: { title: 'Yearly Summary', subtitle: 'Retrospective annual analysis' },
  accounts: { title: 'Bank & Cash', subtitle: 'Liquid bank balances & cash' },
  income: { title: 'Income Streams', subtitle: 'Wage, rent, and passive credits' },
  transactions: { title: 'Spend Ledger', subtitle: 'Itemized transaction records' },
  budgets: { title: 'Spending Limits', subtitle: 'Monthly envelope budget caps' },
  subscriptions: { title: 'Subscriptions', subtitle: 'Recurring bill commitments' },
  credit_cards: { title: 'Credit Cards', subtitle: 'Borrowing lines & statements' },
  emis: { title: 'EMI & Loans', subtitle: 'Active loan payback installments' },
  net_worth: { title: 'My Net Worth', subtitle: 'Overall solvency indicator' },
  investments: { title: 'Investments', subtitle: 'Asset & portfolio tracking' },
  savings: { title: 'Savings Targets', subtitle: 'Goal-oriented milestones' },
  emergency: { title: 'Emergency Shield', subtitle: 'Essential survival backup funds' },
  settings: { title: 'System Settings', subtitle: 'Currencies, themes, & backups' }
};

const navCategories = [
  {
    id: 'console',
    label: 'Command & Analytics',
    icon: PieChart,
    description: 'Overview, projections, and reports',
    items: ['dashboard', 'forecasting', 'annual_review']
  },
  {
    id: 'cash_inflow',
    label: 'Cash & Income',
    icon: Landmark,
    description: 'Bank accounts and salary streams',
    items: ['accounts', 'income']
  },
  {
    id: 'spending',
    label: 'Daily Trackers',
    icon: ArrowDownRight,
    description: 'Daily ledger, budget limits, subscriptions',
    items: ['transactions', 'budgets', 'subscriptions']
  },
  {
    id: 'debt_cards',
    label: 'Loans & Cards',
    icon: CreditCard,
    description: 'Credit liabilities and active EMIs',
    items: ['credit_cards', 'emis']
  },
  {
    id: 'wealth_future',
    label: 'Future & Security',
    icon: Target,
    description: 'Net worth, goals, emergency shield',
    items: ['net_worth', 'investments', 'savings', 'emergency']
  },
  {
    id: 'system',
    label: 'Preferences',
    icon: Settings,
    description: 'System-wide settings & utilities',
    items: ['settings']
  }
];

function MainApp() {
  const {
    financeData,
    setFinanceData,
    currentUser,
    userEmail,
    userDisplayName,
    authLoading,
    isDataLoaded,
    currentTab,
    setCurrentTab,
    isManualOpen,
    setIsManualOpen,
    isCollapsed,
    setIsCollapsed,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    autoDebitLogs,
    setAutoDebitLogs,
    resetMessage,
    handleLogout,
  } = useFinance();

  const navItems = featureRegistry;

  const [expandedCats, setExpandedCats] = React.useState<Record<string, boolean>>({
    console: true,
    cash_inflow: false,
    spending: false,
    debt_cards: false,
    wealth_future: false,
    system: false,
  });

  // Automatically expand active tab's parent category
  React.useEffect(() => {
    const parentCat = navCategories.find(cat => cat.items.includes(currentTab));
    if (parentCat) {
      setExpandedCats(prev => ({
        ...prev,
        [parentCat.id]: true
      }));
    }
  }, [currentTab]);

  const [isTabChanging, setIsTabChanging] = React.useState(false);

  React.useEffect(() => {
    setIsTabChanging(true);
    const timer = setTimeout(() => {
      setIsTabChanging(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [currentTab]);

  const handleSelectTab = (tabId: string) => {
    setCurrentTab(tabId);
    setIsMobileMenuOpen(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-transparent flex flex-col justify-center items-center">
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

  // Calculate statistics for Header HUD
  const bankAccounts = financeData.accounts.filter(a => a.type === 'bank');
  const creditCards = financeData.accounts.filter(a => a.type === 'credit_card');

  const totalLiquidAssets = bankAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalOutstandingCredit = creditCards.reduce((sum, a) => sum + a.balance, 0);
  const aggregateNetWorth = totalLiquidAssets - totalOutstandingCredit;

  // Resolve dynamic content to render
  const activeModule = featureRegistry.find(m => m.id === currentTab) || featureRegistry[0];
  const ActiveComponent = activeModule.component;

  return (
    <div id="application-container" className="min-h-screen bg-slate-50 dark:bg-transparent text-slate-800 dark:text-slate-100 flex antialiased overflow-x-hidden max-w-full">
      
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
          <div className="flex-grow py-4 overflow-y-auto px-3 space-y-3">
            {navCategories.map(cat => {
              const CatIcon = cat.icon;
              const isCatExpanded = expandedCats[cat.id];
              const hasActiveChild = cat.items.includes(currentTab);
              
              return (
                <div key={cat.id} className="mb-2">
                  {/* Category Header */}
                  <button
                    onClick={() => setExpandedCats(prev => ({ ...prev, [cat.id]: !prev[cat.id] }))}
                    className={`w-full flex items-center justify-between text-left py-2 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition duration-150 cursor-pointer ${
                      hasActiveChild ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : 'text-slate-650 dark:text-slate-350'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1 rounded-lg ${hasActiveChild ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
                        <CatIcon className="w-4 h-4 shrink-0" />
                      </div>
                      <div>
                        <span className="text-[11px] font-extrabold uppercase tracking-wider block leading-tight font-sans">
                          {cat.label}
                        </span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 block leading-none mt-0.5">
                          {cat.description}
                        </span>
                      </div>
                    </div>
                    <div>
                      {isCatExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Children Container */}
                  {isCatExpanded && (
                    <div className="pl-3 mt-1 space-y-1 border-l border-slate-100 dark:border-slate-800/60 ml-5.5 animate-fade-in">
                      {cat.items.map(itemId => {
                        const item = featureRegistry.find(f => f.id === itemId);
                        if (!item) return null;
                        const ItemIcon = item.icon;
                        const isActive = currentTab === item.id;
                        const labelDetails = friendlyLabels[itemId] || { title: item.label, subtitle: '' };
                        
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSelectTab(item.id)}
                            className={`w-full flex items-center gap-2.5 text-left py-2 px-2.5 rounded-lg transition-all duration-150 cursor-pointer ${
                              isActive
                                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                          >
                            <ItemIcon className="w-3.5 h-3.5 shrink-0" />
                            <div className="truncate min-w-0">
                              <span className="text-xs font-semibold block leading-tight">
                                {labelDetails.title}
                              </span>
                              {labelDetails.subtitle && (
                                <span className={`text-[9px] block truncate leading-none mt-0.5 ${
                                  isActive ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'
                                }`}>
                                  {labelDetails.subtitle}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom actions */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800/85 shrink-0">
            <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-3 border border-slate-100 dark:border-slate-800/80">
              {/* Profile details */}
              <div className="flex items-center gap-2.5 mb-3">
                <div className="relative shrink-0">
                  <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-950/40 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs border border-indigo-200/40 dark:border-indigo-900/40">
                    {(userDisplayName || userEmail || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0b1329] animate-pulse" />
                </div>
                <div className="truncate min-w-0">
                  <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 block truncate leading-tight" title={userEmail || ""}>
                    {userDisplayName || userEmail || 'Active User'}
                  </span>
                  <span className="text-[8px] text-emerald-600 dark:text-emerald-400 font-black tracking-wider uppercase block mt-0.5 leading-none">
                    ● SECURE VAULT
                  </span>
                </div>
              </div>

              {/* Action Toolbar Grid for Mobile */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setIsManualOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="py-2.5 bg-white dark:bg-[#070c19] hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/40 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer group animate-fade-in"
                  title="How to Use Manual"
                >
                  <BookOpen className="w-4 h-4 group-hover:scale-105 transition-transform" />
                  <span className="text-[10px] font-bold">Manual</span>
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="py-2.5 bg-white dark:bg-[#070c19] hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-100 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-955/40 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer group animate-fade-in"
                  title="Secure Logout"
                >
                  <LogOut className="w-4 h-4 group-hover:scale-105 transition-transform text-rose-500" />
                  <span className="text-[10px] font-bold">Lock</span>
                </button>
              </div>
            </div>
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
          <div className="flex-grow py-4 overflow-y-auto px-3">
            {isCollapsed ? (
              <div className="space-y-3 flex flex-col items-center">
                {navCategories.map((cat, idx) => {
                  return (
                    <React.Fragment key={cat.id}>
                      {idx > 0 && <div className="w-8 h-[1px] bg-slate-100 dark:bg-slate-850/60" />}
                      <div className="space-y-1.5 flex flex-col items-center">
                        {cat.items.map(itemId => {
                          const item = featureRegistry.find(f => f.id === itemId);
                          if (!item) return null;
                          const ItemIcon = item.icon;
                          const isActive = currentTab === item.id;
                          const labelDetails = friendlyLabels[itemId] || { title: item.label, subtitle: '' };
                          
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleSelectTab(item.id)}
                              className={`w-10 h-10 flex items-center justify-center rounded-xl transition cursor-pointer relative group ${
                                isActive
                                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/15'
                                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-205'
                              }`}
                              title={labelDetails.title}
                            >
                              <ItemIcon className="w-4.5 h-4.5 shrink-0" />
                              <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition duration-150 whitespace-nowrap pointer-events-none z-50 shadow-md">
                                <p className="font-sans font-extrabold">{labelDetails.title}</p>
                                {labelDetails.subtitle && (
                                  <p className="text-[8px] text-slate-300 font-medium font-sans mt-0.5">{labelDetails.subtitle}</p>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3 animate-fade-in">
                {navCategories.map(cat => {
                  const CatIcon = cat.icon;
                  const isCatExpanded = expandedCats[cat.id];
                  const hasActiveChild = cat.items.includes(currentTab);
                  
                  return (
                    <div key={cat.id} className="mb-2">
                      {/* Category Header */}
                      <button
                        onClick={() => setExpandedCats(prev => ({ ...prev, [cat.id]: !prev[cat.id] }))}
                        className={`w-full flex items-center justify-between text-left py-2 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition duration-150 cursor-pointer ${
                          hasActiveChild ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : 'text-slate-650 dark:text-slate-350'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1 rounded-lg ${hasActiveChild ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
                            <CatIcon className="w-4 h-4 shrink-0" />
                          </div>
                          <div>
                            <span className="text-[11px] font-extrabold uppercase tracking-wider block leading-tight font-sans">
                              {cat.label}
                            </span>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 block leading-none mt-0.5">
                              {cat.description}
                            </span>
                          </div>
                        </div>
                        <div>
                          {isCatExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {/* Children Container */}
                      {isCatExpanded && (
                        <div className="pl-3 mt-1 space-y-1 border-l border-slate-100 dark:border-slate-800/60 ml-5.5 animate-fade-in">
                          {cat.items.map(itemId => {
                            const item = featureRegistry.find(f => f.id === itemId);
                            if (!item) return null;
                            const ItemIcon = item.icon;
                            const isActive = currentTab === item.id;
                            const labelDetails = friendlyLabels[itemId] || { title: item.label, subtitle: '' };
                            
                            return (
                              <button
                                key={item.id}
                                onClick={() => handleSelectTab(item.id)}
                                className={`w-full flex items-center gap-2.5 text-left py-2 px-2.5 rounded-lg transition-all duration-155 cursor-pointer ${
                                  isActive
                                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30 hover:text-slate-800 dark:hover:text-slate-205'
                                }`}
                              >
                                <ItemIcon className="w-3.5 h-3.5 shrink-0" />
                                <div className="truncate min-w-0">
                                  <span className="text-xs font-semibold block leading-tight">
                                    {labelDetails.title}
                                  </span>
                                  {labelDetails.subtitle && (
                                    <span className={`text-[9px] block truncate leading-none mt-0.5 ${
                                      isActive ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'
                                    }`}>
                                      {labelDetails.subtitle}
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom actions */}
          {isCollapsed ? (
            /* Collapsed mode Actions Column */
            <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 space-y-2 shrink-0 flex flex-col items-center animate-fade-in">
              {/* User Avatar with simple popover */}
              <div className="relative group">
                <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-950/40 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs border border-indigo-200/40 dark:border-indigo-900/40 cursor-pointer">
                  {(userDisplayName || userEmail || 'U').charAt(0).toUpperCase()}
                </div>
                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0b1329] animate-pulse" />
                
                {/* Floating profile popover */}
                <div className="absolute left-full ml-3 top-0 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-800 p-2.5 opacity-0 group-hover:opacity-100 transition duration-155 pointer-events-none whitespace-nowrap z-50">
                  <p className="text-xs font-bold leading-tight">{userDisplayName || userEmail || 'Active User'}</p>
                  <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider mt-0.5 leading-none">● SECURE LOCK ACTIVE</p>
                </div>
              </div>

              {/* Quick Manual Icon Button */}
              <button
                onClick={() => setIsManualOpen(true)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 border border-slate-150 dark:border-slate-800 transition cursor-pointer relative group"
                title="How To Use Manual"
              >
                <BookOpen className="w-4 h-4" />
                <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition duration-150 whitespace-nowrap pointer-events-none z-50 shadow-md">
                  How To Use Manual
                </div>
              </button>

              {/* Quick Logout Icon Button */}
              <button
                onClick={handleLogout}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900/60 text-rose-500 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-slate-150 dark:border-slate-800 transition cursor-pointer relative group"
                title="Lock and Logout Space"
              >
                <LogOut className="w-4 h-4" />
                <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition duration-150 whitespace-nowrap pointer-events-none z-50 shadow-md">
                  Lock & Logout
                </div>
              </button>

              {/* Expand Toggle Button */}
              <button
                onClick={() => setIsCollapsed(false)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-850 transition cursor-pointer relative group"
                title="Expand Sidebar"
              >
                <ChevronRight className="w-4 h-4" />
                <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition duration-150 whitespace-nowrap pointer-events-none z-50 shadow-md">
                  Expand Sidebar
                </div>
              </button>
            </div>
          ) : (
            /* Consolidated User & Command Center Card */
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 shrink-0 animate-fade-in">
              <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-3 border border-slate-100 dark:border-slate-800/80 mb-1">
                {/* Profile details */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-950/40 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs border border-indigo-200/40 dark:border-indigo-900/40">
                      {(userDisplayName || userEmail || 'U').charAt(0).toUpperCase()}
                    </div>
                    {/* Pulsing online badge */}
                    <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0b1329] animate-pulse" />
                  </div>
                  <div className="truncate min-w-0">
                    <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 block truncate leading-tight" title={userEmail || ""}>
                      {userDisplayName || userEmail || 'Active User'}
                    </span>
                    <span className="text-[8px] text-emerald-600 dark:text-emerald-400 font-black tracking-wider uppercase block mt-0.5 leading-none">
                      ● SECURE VAULT
                    </span>
                  </div>
                </div>

                {/* Action Toolbar Grid */}
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => setIsManualOpen(true)}
                    className="py-2 bg-white dark:bg-[#070c19] hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/40 rounded-xl transition flex flex-col items-center justify-center cursor-pointer group"
                    title="How to Use Manual"
                  >
                    <BookOpen className="w-4 h-4 group-hover:scale-105 transition-transform" />
                    <span className="text-[8px] font-bold mt-0.5">Manual</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="py-2 bg-white dark:bg-[#070c19] hover:bg-rose-50 dark:hover:bg-rose-955/20 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-450 border border-slate-100 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-955/40 rounded-xl transition flex flex-col items-center justify-center cursor-pointer group"
                    title="Secure Logout"
                  >
                    <LogOut className="w-4 h-4 group-hover:scale-105 transition-transform text-rose-500" />
                    <span className="text-[8px] font-bold mt-0.5">Lock</span>
                  </button>
                  <button
                    onClick={() => setIsCollapsed(true)}
                    className="py-2 bg-white dark:bg-[#070c19] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650 dark:hover:text-slate-300 border border-slate-100 dark:border-slate-800 rounded-xl transition flex flex-col items-center justify-center cursor-pointer group"
                    title="Collapse Sidebar"
                  >
                    <ChevronLeft className="w-4 h-4 group-hover:translate-x-[-1px] transition-transform" />
                    <span className="text-[8px] font-bold mt-0.5">Collapse</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* RIGHT WORKSPACE PANELS */}
      <div className="flex-grow flex flex-col min-w-0">
        
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
                    {formatCurrency(totalLiquidAssets, financeData.preferences, 2)}
                  </span>
                </div>
                <div className="hidden sm:block border-l border-slate-200 dark:border-slate-800 pl-3 md:pl-4">
                  <span className="text-[9px] text-slate-450 dark:text-slate-500 uppercase font-extrabold leading-3 block text-rose-500/90">Credit cards</span>
                  <span id="header-credit-readout" className="text-xs md:text-sm font-black text-rose-600 dark:text-rose-400 block whitespace-nowrap font-mono mt-0.5">
                    {formatCurrency(totalOutstandingCredit, financeData.preferences, 2)}
                  </span>
                </div>
                <div className="sm:border-l sm:border-slate-200 dark:sm:border-slate-850 sm:pl-3 md:pl-4">
                  <span className="text-[9px] text-zinc-400 dark:text-slate-500 uppercase font-extrabold leading-3 block text-right">Net Worth</span>
                  <span id="header-net-readout" className={`text-xs md:text-sm font-extrabold block whitespace-nowrap font-mono mt-0.5 text-right ${aggregateNetWorth >= 0 ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-600 dark:text-rose-450'}`}>
                    {formatCurrency(aggregateNetWorth, financeData.preferences, 2)}
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



              <div className="transition-opacity duration-200">
                {isTabChanging ? (
                  <SectionSkeleton />
                ) : (
                  <ActiveComponent 
                    data={financeData} 
                    setFinanceData={setFinanceData} 
                    setCurrentTab={setCurrentTab} 
                    userEmail={userEmail}
                  />
                )}
              </div>
            </main>

            <footer id="workspace-footer" className="bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/80 py-6 text-center text-xs text-slate-400 font-semibold mt-auto shrink-0">
              <p>PaisaFlow • Simplify your spending. Master your flow. • Secured via Firebase Cloud Sync</p>
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
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <FinanceProvider>
      <MainApp />
    </FinanceProvider>
  );
}
