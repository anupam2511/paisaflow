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
  LogOut,
  HelpCircle,
  CalendarClock,
  CheckCircle
} from 'lucide-react';

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
              className="w-full flex items-center justify-center gap-2 py-2 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-850 rounded-xl transition cursor-pointer"
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
              <p>PaisaFlow • Comprehensive Capital Management Workspace • Secured via Firebase Cloud Sync</p>
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
