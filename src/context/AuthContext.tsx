/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../utils/firebase';
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { authService } from '../services/firebase/auth.service';

export interface AuthContextType {
  currentUser: string | null;
  userEmail: string | null;
  userDisplayName: string | null;
  authLoading: boolean;
  handleLogout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

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

  const handleLogout = async () => {
    try {
      await authService.signOut();
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userEmail,
        userDisplayName,
        authLoading,
        handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
