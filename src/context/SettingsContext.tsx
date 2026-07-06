/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const tabToRouteMap: Record<string, string> = {
  dashboard: '/dashboard',
  accounts: '/accounts',
  income: '/income',
  transactions: '/expenses',
  budgets: '/budgets',
  credit_cards: '/credit-cards',
  emis: '/emis',
  investments: '/investments',
  savings: '/goals',
  analytics: '/analytics',
  forecasting: '/forecast',
  settings: '/settings',
  net_worth: '/net-worth',
  subscriptions: '/subscriptions',
  emergency: '/emergency',
  help: '/help'
};

const routeToTabMap: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/accounts': 'accounts',
  '/income': 'income',
  '/expenses': 'transactions',
  '/budgets': 'budgets',
  '/credit-cards': 'credit_cards',
  '/emis': 'emis',
  '/investments': 'investments',
  '/goals': 'savings',
  '/analytics': 'analytics',
  '/forecast': 'forecasting',
  '/annual-review': 'analytics',
  '/settings': 'settings',
  '/net-worth': 'net_worth',
  '/subscriptions': 'subscriptions',
  '/emergency': 'emergency',
  '/help': 'help'
};

export interface SettingsContextType {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isManualOpen: boolean;
  setIsManualOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  autoDebitLogs: string[];
  setAutoDebitLogs: React.Dispatch<React.SetStateAction<string[]>>;
  resetMessage: string;
  setResetMessage: (msg: string) => void;
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const getTabFromPath = (path: string): string => {
    return routeToTabMap[path] || 'dashboard';
  };

  const [currentTab, setCurrentTabState] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      return getTabFromPath(path);
    }
    return 'dashboard';
  });

  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [autoDebitLogs, setAutoDebitLogs] = useState<string[]>([]);
  const [resetMessage, setResetMessage] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Automatically handle clean default redirects
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path === '/' || !routeToTabMap[path]) {
        window.history.replaceState(null, '', '/dashboard');
        setCurrentTabState('dashboard');
      }
    }
  }, []);

  // Listen to browser Back and Forward history events
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const tab = getTabFromPath(path);
      setCurrentTabState(tab);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const setCurrentTab = (tabId: string) => {
    setCurrentTabState(tabId);
    if (typeof window !== 'undefined') {
      const route = tabToRouteMap[tabId] || '/dashboard';
      if (window.location.pathname !== route) {
        window.history.pushState(null, '', route);
      }
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <SettingsContext.Provider
      value={{
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
        setResetMessage,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
