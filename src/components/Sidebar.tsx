/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { featureRegistry } from '../features/registry';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LogOut,
  BookOpen,
  PieChart,
  Landmark,
  ArrowDownRight,
  CreditCard,
  Target,
  Settings
} from 'lucide-react';
import paisaflowLogo from "../assets/images/paisaflow-logo.png";

const friendlyLabels: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Overview HUD', subtitle: 'Quick metrics & wealth summary' },
  forecasting: { title: 'Wealth Predictor', subtitle: 'Compounding future forecasts' },
  analytics: { title: 'Capital Analytics', subtitle: 'Financial trends, MoM/YoY growth & spending anomalies' },
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
    items: ['dashboard', 'forecasting', 'analytics']
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

export default function Sidebar() {
  const {
    currentTab,
    setCurrentTab,
    isCollapsed,
    setIsCollapsed,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    userEmail,
    userDisplayName,
    handleLogout
  } = useFinance();

  const [expandedCats, setExpandedCats] = React.useState<Record<string, boolean>>({
    console: true,
    cash_inflow: false,
    spending: false,
    debt_cards: false,
    wealth_future: false,
    system: false,
  });

  // Automatically expand active tab's parent category on desktop
  React.useEffect(() => {
    const parentCat = navCategories.find(cat => cat.items.includes(currentTab));
    if (parentCat) {
      setExpandedCats(prev => ({
        ...prev,
        [parentCat.id]: true
      }));
    }
  }, [currentTab]);

  const handleSelectTab = (tabId: string) => {
    setCurrentTab(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* MOBILE MENU DRAWER OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)} 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-45 md:hidden animate-fade-in" 
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
          <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between h-[73px]">
            <div className="flex items-center gap-3">
              <img 
                src={paisaflowLogo} 
                alt="PaisaFlow" 
                className="w-8 h-8 object-contain shrink-0"
              />
              <div>
                <span className="text-base font-black text-slate-800 dark:text-slate-100 tracking-tight block">PaisaFlow</span>
                <span className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block animate-pulse">Capital Suite</span>
              </div>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation items for Mobile */}
          <div className="flex-grow py-4 overflow-y-auto px-3 space-y-3">
            {navCategories.map(cat => {
              const CatIcon = cat.icon;
              const isCatExpanded = expandedCats[cat.id];
              const hasActiveChild = cat.items.includes(currentTab);
              
              return (
                <div key={cat.id} className="mb-2">
                  <button
                    onClick={() => setExpandedCats(prev => ({ ...prev, [cat.id]: !prev[cat.id] }))}
                    className={`w-full flex items-center justify-between text-left py-2 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition duration-150 cursor-pointer ${
                      hasActiveChild ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : 'text-slate-600 dark:text-slate-300'
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
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                          >
                            <ItemIcon className="w-3.5 h-3.5 shrink-0" />
                            <div className="truncate min-w-0" title={labelDetails.title}>
                              <span className="text-xs font-semibold block leading-tight">
                                {labelDetails.title}
                              </span>
                              {labelDetails.subtitle && (
                                <span className={`text-[9px] block truncate leading-none mt-0.5 ${
                                  isActive ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'
                                }`} title={labelDetails.subtitle}>
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

          {/* Bottom actions for Mobile */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800/85 shrink-0">
            <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-3 border border-slate-100 dark:border-slate-800/80">
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

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSelectTab('help')}
                  className="py-2.5 bg-white dark:bg-[#070c19] hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/40 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer group"
                  title="How to Use Manual"
                >
                  <BookOpen className="w-4 h-4 group-hover:scale-105 transition-transform" />
                  <span className="text-[10px] font-bold">Manual</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="py-2.5 bg-white dark:bg-[#070c19] hover:bg-rose-50 dark:hover:bg-rose-905/20 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-100 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-900/40 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer group"
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
        className={`hidden md:flex flex-col justify-between transition-all duration-300 sticky top-0 h-screen z-35 bg-white dark:bg-[#0b1329] border-r border-slate-100 dark:border-slate-800/80 ${
          isCollapsed ? 'w-[76px]' : 'w-64'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Top Brand Block */}
          <div className="p-4 border-b border-slate-50 dark:border-slate-800/50 flex items-center gap-3 shrink-0 h-[73px] overflow-hidden">
            <img 
              src={paisaflowLogo} 
              alt="PaisaFlow" 
              className="w-10 h-10 object-contain shrink-0"
            />
            {!isCollapsed && (
              <div className="truncate" title="PaisaFlow - Secure Wealth Space">
                <span className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-4 block" title="PaisaFlow">PaisaFlow</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block mt-0.5" title="Secure Wealth Space">Secure Wealth Space</span>
              </div>
            )}
          </div>

          {/* Desktop Navigation items */}
          <div className="flex-grow py-4 overflow-y-auto px-3">
            {isCollapsed ? (
              <div className="space-y-3 flex flex-col items-center">
                {navCategories.map((cat, idx) => {
                  return (
                    <React.Fragment key={cat.id}>
                      {idx > 0 && <div className="w-8 h-[1px] bg-slate-100 dark:bg-slate-800/60" />}
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
                                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200'
                              }`}
                              title={labelDetails.title}
                            >
                              <ItemIcon className="w-4.5 h-4.5 shrink-0" />
                              <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition duration-150 whitespace-nowrap pointer-events-none z-50 shadow-md border border-slate-800">
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
                      <button
                        onClick={() => setExpandedCats(prev => ({ ...prev, [cat.id]: !prev[cat.id] }))}
                        className={`w-full flex items-center justify-between text-left py-2 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition duration-150 cursor-pointer ${
                          hasActiveChild ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : 'text-slate-600 dark:text-slate-400'
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
                            <span className="text-[9px] text-slate-400 dark:text-slate-505 block leading-none mt-0.5">
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
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30 hover:text-slate-800 dark:hover:text-slate-200'
                                }`}
                              >
                                <ItemIcon className="w-3.5 h-3.5 shrink-0" />
                                <div className="truncate min-w-0" title={labelDetails.title}>
                                  <span className="text-xs font-semibold block leading-tight">
                                    {labelDetails.title}
                                  </span>
                                  {labelDetails.subtitle && (
                                    <span className={`text-[9px] block truncate leading-none mt-0.5 ${
                                      isActive ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'
                                    }`} title={labelDetails.subtitle}>
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

          {/* Desktop bottom actions */}
          {isCollapsed ? (
            <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 space-y-2 shrink-0 flex flex-col items-center animate-fade-in">
              <div className="relative group">
                <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-950/40 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs border border-indigo-200/40 dark:border-indigo-900/40 cursor-pointer">
                  {(userDisplayName || userEmail || 'U').charAt(0).toUpperCase()}
                </div>
                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0b1329] animate-pulse" />
                
                <div className="absolute left-full ml-3 top-0 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-800 p-2.5 opacity-0 group-hover:opacity-100 transition duration-155 pointer-events-none whitespace-nowrap z-50">
                  <p className="text-xs font-bold leading-tight">{userDisplayName || userEmail || 'Active User'}</p>
                  <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider mt-0.5 leading-none">● SECURE LOCK ACTIVE</p>
                </div>
              </div>

              <button
                onClick={() => handleSelectTab('help')}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 border border-slate-200 dark:border-slate-800 transition cursor-pointer relative group"
                title="How To Use Manual"
              >
                <BookOpen className="w-4 h-4" />
                <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition duration-150 whitespace-nowrap pointer-events-none z-50 shadow-md">
                  How To Use Manual
                </div>
              </button>

              <button
                onClick={handleLogout}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900/60 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-slate-200 dark:border-slate-800 transition cursor-pointer relative group"
                title="Lock and Logout Space"
              >
                <LogOut className="w-4 h-4" />
                <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition duration-150 whitespace-nowrap pointer-events-none z-50 shadow-md">
                  Lock & Logout
                </div>
              </button>

              <button
                onClick={() => setIsCollapsed(false)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 transition cursor-pointer relative group"
                title="Expand Sidebar"
              >
                <ChevronRight className="w-4 h-4" />
                <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition duration-150 whitespace-nowrap pointer-events-none z-50 shadow-md">
                  Expand Sidebar
                </div>
              </button>
            </div>
          ) : (
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 shrink-0 animate-fade-in animate-duration-300">
              <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-3 border border-slate-100 dark:border-slate-800/80 mb-1">
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

                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => handleSelectTab('help')}
                    className="py-2 bg-white dark:bg-[#070c19] hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/40 rounded-xl transition flex flex-col items-center justify-center cursor-pointer group"
                    title="How to Use Manual"
                  >
                    <BookOpen className="w-4 h-4 group-hover:scale-105 transition-transform" />
                    <span className="text-[8px] font-bold mt-0.5">Manual</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="py-2 bg-white dark:bg-[#070c19] hover:bg-rose-50 dark:hover:bg-rose-905/20 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-100 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-900/40 rounded-xl transition flex flex-col items-center justify-center cursor-pointer group"
                    title="Secure Logout"
                  >
                    <LogOut className="w-4 h-4 group-hover:scale-105 transition-transform text-rose-500" />
                    <span className="text-[8px] font-bold mt-0.5">Lock</span>
                  </button>
                  <button
                    onClick={() => setIsCollapsed(true)}
                    className="py-2 bg-white dark:bg-[#070c19] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 border border-slate-100 dark:border-slate-800 rounded-xl transition flex flex-col items-center justify-center cursor-pointer group"
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
    </>
  );
}
