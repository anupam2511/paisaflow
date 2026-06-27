/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { FinanceData } from '../types';
import { INITIAL_FINANCE_DATA } from '../data/mockData';
import { processAutoDebits } from '../utils/billing';
import { auth, signOutUser, getUserFinanceData, saveUserFinanceData } from '../utils/firebase';
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';

const sanitizeFinanceData = (data: FinanceData): FinanceData => {
  if (!data) return data;
  const cleanData = { ...data };
  if (Array.isArray(cleanData.expenses)) {
    const seen = new Set<string>();
    cleanData.expenses = cleanData.expenses.filter(e => {
      if (!e || !e.id) return false;
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });
  }
  if (Array.isArray(cleanData.ccTransactions)) {
    const seen = new Set<string>();
    cleanData.ccTransactions = cleanData.ccTransactions.filter(t => {
      if (!t || !t.id) return false;
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
  }
  return cleanData;
};

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface FinanceContextType {
  financeData: FinanceData;
  setFinanceData: React.Dispatch<React.SetStateAction<FinanceData>>;
  currentUser: string | null;
  userEmail: string | null;
  userDisplayName: string | null;
  authLoading: boolean;
  isDataLoaded: boolean;
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
  handleLogout: () => Promise<void>;
  handleConfirmReset: () => void;
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [financeData, setFinanceData] = useState<FinanceData>(() => {
    return sanitizeFinanceData(JSON.parse(JSON.stringify(INITIAL_FINANCE_DATA)));
  });

  const [currentTab, setCurrentTab] = useState('dashboard');
  const [resetMessage, setResetMessage] = useState('');
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [autoDebitLogs, setAutoDebitLogs] = useState<string[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Handle Firebase Auth listening
  useEffect(() => {
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

        const isForcedOffline = localStorage.getItem('paisaflow_force_offline') === 'true';

        // Load secure data from Firestore
        try {
          if (isForcedOffline) {
            throw new Error("Client is offline (forced offline mode enabled by user settings).");
          }
          const dbData = await getUserFinanceData(user.uid);
          if (dbData) {
            setFinanceData(sanitizeFinanceData(dbData));
          } else {
            // Check legacy local storage fallback
            const legacyKey = `personal_finance_dashboard_data_user_${user.uid.toLowerCase()}`;
            const legacyDataStr = localStorage.getItem(legacyKey);
            if (legacyDataStr) {
              const parsed = JSON.parse(legacyDataStr);
              setFinanceData(sanitizeFinanceData(parsed));
              if (!isForcedOffline) {
                saveUserFinanceData(user.uid, sanitizeFinanceData(parsed)).catch(err => {
                  console.warn("Failed to write initial legacy migration to Firestore:", err);
                });
              }
            } else {
              const freshClone = JSON.parse(JSON.stringify(INITIAL_FINANCE_DATA));
              setFinanceData(sanitizeFinanceData(freshClone));
              if (!isForcedOffline) {
                saveUserFinanceData(user.uid, sanitizeFinanceData(freshClone)).catch(err => {
                  console.warn("Failed to write initial default data to Firestore:", err);
                });
              }
            }
          }
          setIsDataLoaded(true);
        } catch (error: any) {
          const errMsg = error?.message || String(error);
          if (errMsg.toLowerCase().includes("offline") || errMsg.toLowerCase().includes("unavailable") || error?.code === "unavailable") {
            console.warn("Failed to load user data from Firestore (client is offline):", errMsg);
          } else {
            console.error("Failed to load user data from Firestore", error);
          }
          
          // Fallback to local storage backup so the app is always functional
          const legacyKey = `personal_finance_dashboard_data_user_${user.uid.toLowerCase()}`;
          const legacyDataStr = localStorage.getItem(legacyKey);
          if (legacyDataStr) {
            try {
              const parsed = JSON.parse(legacyDataStr);
              setFinanceData(sanitizeFinanceData(parsed));
              showToast("Loaded local storage finance backup (Firestore network offline).", "info");
            } catch (e) {
              console.warn("Error parsing backup local storage data (logged as warning):", e);
              const freshClone = JSON.parse(JSON.stringify(INITIAL_FINANCE_DATA));
              setFinanceData(sanitizeFinanceData(freshClone));
              showToast("Loaded demo financial pools (Firestore offline).", "info");
            }
          } else {
            const freshClone = JSON.parse(JSON.stringify(INITIAL_FINANCE_DATA));
            setFinanceData(sanitizeFinanceData(freshClone));
            showToast("Loaded demo financial pools (Firestore offline).", "info");
          }
          
          setIsDataLoaded(true);
        }
      } else {
        setCurrentUser(null);
        setUserEmail(null);
        setUserDisplayName(null);
        setIsDataLoaded(false);
        localStorage.removeItem('paisaflow_active_user');
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Automatically check and process auto-debits on login & whenever spends or investments load/change
  useEffect(() => {
    if (!currentUser || !isDataLoaded) return;

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
  }, [currentUser, financeData.recurringSpends, financeData.investments, isDataLoaded]);

  // Persist schema modifications instantly per user session
  useEffect(() => {
    if (!currentUser || !isDataLoaded) return;
    try {
      const userKey = `personal_finance_dashboard_data_user_${currentUser.toLowerCase()}`;
      localStorage.setItem(userKey, JSON.stringify(financeData));
      
      // Mirror to Firestore securely if not forced offline
      const isForcedOffline = localStorage.getItem('paisaflow_force_offline') === 'true';
      if (!isForcedOffline) {
        saveUserFinanceData(currentUser, financeData).catch(err => {
          const errMsg = err?.message || String(err);
          if (errMsg.toLowerCase().includes("offline") || errMsg.toLowerCase().includes("unavailable") || err?.code === "unavailable") {
            console.warn('Firestore duplex Sync deferred (client is offline):', errMsg);
          } else {
            console.error('Firestore duplex Sync error:', err);
          }
        });
      }
    } catch (e) {
      console.error('Storage sync error:', e);
    }
  }, [financeData, currentUser, isDataLoaded]);

  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch (e) {
      console.error('Logout error:', e);
    }
    setIsMobileMenuOpen(false);
  };

  const colorPalettes = {
    yellow: {
      '50': '#fefde8', '100': '#fdf9bf', '200': '#faf18f', '300': '#f7e864', '400': '#f4e44f',
      '500': '#f4ca3e', '600': '#d3be2d', '700': '#ae9a1a', '800': '#8a780b', '900': '#706103',
    },
    blue: {
      '50': '#eff6ff', '100': '#dbeafe', '200': '#bfdbfe', '300': '#93c5fd', '400': '#60a5fa',
      '500': '#3b82f6', '600': '#2563eb', '700': '#1d4ed8', '800': '#1e40af', '900': '#1e3a8a',
    },
    emerald: {
      '50': '#ecfdf5', '100': '#d1fae5', '200': '#a7f3d0', '300': '#6ee7b7', '400': '#34d399',
      '500': '#10b981', '600': '#059669', '700': '#047857', '800': '#065f46', '900': '#064e3b',
    },
    rose: {
      '50': '#fff1f2', '100': '#ffe4e6', '200': '#fecdd3', '300': '#fda4af', '400': '#fb7185',
      '500': '#f43f5e', '600': '#e11d48', '700': '#be123c', '800': '#9f1239', '900': '#881337',
    },
    violet: {
      '50': '#f5f3ff', '100': '#ede9fe', '200': '#ddd6fe', '300': '#c4b5fd', '400': '#a78bfa',
      '500': '#8b5cf6', '600': '#7c3aed', '700': '#6d28d9', '800': '#5b21b6', '900': '#4c1d95',
    },
  };

  // Dynamic App Styling and Theme Engine
  useEffect(() => {
    const root = document.documentElement;
    const pref = financeData.preferences;
    const mode = pref.themeMode || 'light';
    const accent = pref.accentColor || 'blue';

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

    const palette = colorPalettes[accent as keyof typeof colorPalettes] || colorPalettes.blue;
    Object.entries(palette).forEach(([shade, hex]) => {
      root.style.setProperty(`--color-indigo-${shade}`, hex);
    });

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

  const handleConfirmReset = () => {
    const freshDeepClone = JSON.parse(JSON.stringify(INITIAL_FINANCE_DATA));
    setFinanceData(freshDeepClone);
    setCurrentTab('dashboard');
    setIsMobileMenuOpen(false);
    showToast('All demo financial pools restored to original preset specs!', 'success');
  };

  return (
    <FinanceContext.Provider
      value={{
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
        setResetMessage,
        handleLogout,
        handleConfirmReset,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
