/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { ThemeProvider } from './context/ThemeContext';
import { featureRegistry } from './features/registry';

// Component Imports
import LoginScreen from './components/LoginScreen';
import UserManualPanel from './components/UserManualPanel';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { ToastContainer } from './components/shared/ToastContainer';
import { SectionSkeleton } from './components/shared/SkeletonLoader';

import paisaflowLogo from "./assets/images/paisaflow-logo.png";
import { CalendarClock } from 'lucide-react';

function MainApp() {
  const {
    financeData,
    setFinanceData,
    currentUser,
    userEmail,
    authLoading,
    currentTab,
    setCurrentTab,
    isManualOpen,
    setIsManualOpen,
    autoDebitLogs,
    setAutoDebitLogs
  } = useFinance();

  const [isTabChanging, setIsTabChanging] = React.useState(false);

  React.useEffect(() => {
    setIsTabChanging(true);
    const timer = setTimeout(() => {
      setIsTabChanging(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [currentTab]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-transparent flex flex-col justify-center items-center">
        <img 
          src={paisaflowLogo} 
          alt="PaisaFlow" 
          className="w-16 h-16 object-contain animate-bounce"
        />
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black mt-5 uppercase tracking-widest animate-pulse">
          Verifying Encrypted Space...
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen />;
  }

  // Resolve dynamic content to render
  let ActiveComponent: React.ComponentType<any> = () => null;
  if (currentTab === 'help') {
    ActiveComponent = () => (
      <UserManualPanel
        isOpen={true}
        onClose={() => setCurrentTab('dashboard')}
        currentTab="dashboard"
        isInline={true}
      />
    );
  } else {
    const activeModule = featureRegistry.find(m => m.id === currentTab) || featureRegistry[0];
    
    // Support direct loading to Compare/YoY sub-tab when routing through /annual-review
    if (activeModule.id === 'analytics' && typeof window !== 'undefined' && window.location.pathname === '/annual-review') {
      ActiveComponent = (props: any) => {
        const Comp = activeModule.component;
        return <Comp {...props} initialSubTab="compare" />;
      };
    } else {
      ActiveComponent = activeModule.component;
    }
  }

  return (
    <div id="application-container" className="min-h-screen bg-slate-50 dark:bg-transparent text-slate-800 dark:text-slate-100 flex antialiased overflow-x-hidden max-w-full">
      
      {/* PERSISTENT SIDEBAR */}
      <Sidebar />

      {/* RIGHT WORKSPACE PANELS */}
      <div className="flex-grow flex flex-col min-w-0">
        
        {/* HUD HEADER */}
        <Header />

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
                      className="p-1 px-2.5 text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition font-extrabold cursor-pointer"
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
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded-md">🔄 Processed Auto-Debits</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 font-bold">The following payments were charged & logged automatically on their due dates:</p>
                      <ul className="mt-2 text-xs space-y-1.5 list-disc pl-4 font-semibold text-slate-600 dark:text-slate-300">
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
    <AuthProvider>
      <SettingsProvider>
        <FinanceProvider>
          <ThemeProvider>
            <MainApp />
          </ThemeProvider>
        </FinanceProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
