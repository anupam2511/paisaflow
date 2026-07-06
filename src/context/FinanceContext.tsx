/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { FinanceData } from '../types';
import { INITIAL_FINANCE_DATA } from '../data/mockData';
import { processAutoDebits } from '../utils/billing';
import { db } from '../utils/firebase';
import { firestoreService } from '../services/firebase/firestore.service';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';

export type { ToastMessage } from './SettingsContext';

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

  // Backward compatibility check & live self-healing sync
  if (Array.isArray(cleanData.expenses) && Array.isArray(cleanData.ccTransactions)) {
    cleanData.ccTransactions = cleanData.ccTransactions.map(t => {
      const matchingExpense = cleanData.expenses.find(e => {
        const directIdMatch = t.id === `tx_${e.id}` || e.id === t.id.replace(/^tx_/, '');
        if (directIdMatch) return true;

        const isCardMatch = e.accountId === t.cardId;
        const isAmountMatch = Math.abs(e.amount - t.amount) < 0.01;
        const isDescSimilar = e.description.toLowerCase().trim() === t.description.toLowerCase().trim() ||
          e.description.toLowerCase().trim().includes(t.description.toLowerCase().trim()) ||
          t.description.toLowerCase().trim().includes(e.description.toLowerCase().trim());
        const isDateMatch = e.date === t.date;

        return isCardMatch && isAmountMatch && (isDateMatch || isDescSimilar);
      });

      if (matchingExpense) {
        if (
          t.date !== matchingExpense.date ||
          t.description !== matchingExpense.description ||
          t.category !== matchingExpense.category ||
          t.amount !== matchingExpense.amount
        ) {
          return {
            ...t,
            date: matchingExpense.date,
            description: matchingExpense.description,
            category: matchingExpense.category || t.category,
            amount: matchingExpense.amount,
          };
        }
      }
      return t;
    });
  }

  return cleanData;
};

export interface FinanceContextType {
  financeData: FinanceData;
  setFinanceData: React.Dispatch<React.SetStateAction<FinanceData>>;
  isDataLoaded: boolean;
  handleConfirmReset: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const { showToast, setAutoDebitLogs, setCurrentTab, setIsMobileMenuOpen } = useSettings();

  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [financeData, setFinanceData] = useState<FinanceData>(() => {
    return sanitizeFinanceData(JSON.parse(JSON.stringify(INITIAL_FINANCE_DATA)));
  });

  const lastSyncedDataRef = useRef<string>('');
  const isCloudSyncActiveRef = useRef<boolean>(false);

  // Secure Real-Time Data Sync & Fallback Orchestration
  useEffect(() => {
    if (!currentUser) {
      setIsDataLoaded(false);
      isCloudSyncActiveRef.current = false;
      return;
    }

    // Set up a 6-second timeout fallback to prevent infinite loading screens
    const connectionTimeout = setTimeout(() => {
      console.warn("Firestore connection timed out. Falling back to local state.");
      setIsDataLoaded(true);
    }, 6000);

    // Subscribe to Firestore changes in real-time
    let isInitialLoad = true;
    const docRef = doc(db, "user_finance_data", currentUser);
    
    const unsubscribeSnapshot = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        clearTimeout(connectionTimeout);
        isCloudSyncActiveRef.current = true;
        
        const dbData = snapshot.data();
        const dbDataStr = JSON.stringify(dbData);
        
        // Prevent infinite write cycles: only apply update if it originates from external server push or is different
        if (dbDataStr !== lastSyncedDataRef.current) {
          lastSyncedDataRef.current = dbDataStr;
          setFinanceData(sanitizeFinanceData(dbData as any));
          
          if (!isInitialLoad) {
            showToast("Changes saved.", "success");
          }
        }
        isInitialLoad = false;
        setIsDataLoaded(true);
      } else if (!(snapshot as any).metadata?.fromCache) {
        clearTimeout(connectionTimeout);
        isCloudSyncActiveRef.current = true;
        
        // Doc doesn't exist on the Firestore server yet: load default preset and save to Firestore
        const freshClone = JSON.parse(JSON.stringify(INITIAL_FINANCE_DATA));
        const sanitized = sanitizeFinanceData(freshClone);
        setFinanceData(sanitized);
        lastSyncedDataRef.current = JSON.stringify(sanitized);
        firestoreService.saveUserFinanceData(currentUser, sanitized).catch(err => {
          console.warn("Failed to write initial default data to Firestore:", err);
        });
        isInitialLoad = false;
        setIsDataLoaded(true);
      }
    }, (error) => {
      clearTimeout(connectionTimeout);
      console.warn("Firestore real-time subscription error:", error);
      isCloudSyncActiveRef.current = false;
      setIsDataLoaded(true);
      showToast(`Cloud sync offline: ${error.message || error}`, "error");
    });

    return () => {
      clearTimeout(connectionTimeout);
      unsubscribeSnapshot();
    };
  }, [currentUser]);

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

  // Persist schema modifications instantly to Cloud Firestore
  useEffect(() => {
    if (!currentUser || !isDataLoaded) return;
    try {
      const currentDataStr = JSON.stringify(financeData);
      
      // Mirror to Firestore securely and instantly on change
      if (isCloudSyncActiveRef.current && currentDataStr !== lastSyncedDataRef.current) {
        lastSyncedDataRef.current = currentDataStr;
        firestoreService.saveUserFinanceData(currentUser, financeData).catch(err => {
          console.error('Firestore duplex Sync error:', err);
        });
      }
    } catch (e) {
      console.error('Storage sync error:', e);
    }
  }, [financeData, currentUser, isDataLoaded]);

  // Informative Cloud connection listener
  useEffect(() => {
    if (!currentUser || !isDataLoaded) return;
    showToast("Connected to Cloud Firestore", "info");
  }, [currentUser, isDataLoaded]);

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
        isDataLoaded,
        handleConfirmReset,
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

  const auth = useAuth();
  const settings = useSettings();

  return {
    ...context,
    ...auth,
    ...settings,
  };
}
