/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect } from 'react';
import { useFinance } from './FinanceContext';

export interface ThemeContextType {
  colorPalettes: typeof colorPalettes;
}

const colorPalettes = {
  yellow: {
    '50': '#fefde8', '100': '#fdf9bf', '200': '#faf18f', '300': '#f7e864', '400': '#f4e44f',
    '500': '#f4ca3e', '600': '#d3be2d', '700': '#ae9a1a', '800': '#8a780b', '900': '#706103',
  },
  blue: {
    '50': '#eff6ff', '100': '#dbeafe', '200': '#bfdbfe', '300': '#93c5fd', '400': '#60a5fa',
    '505': '#3b82f6', '500': '#3b82f6', '600': '#2563eb', '700': '#1d4ed8', '800': '#1e40af', '900': '#1e3a8a',
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

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { financeData } = useFinance();
  const pref = financeData?.preferences || { themeMode: 'light', accentColor: 'blue' };
  const mode = pref.themeMode || 'light';
  const accent = pref.accentColor || 'blue';

  // Apply Theme Mode and Color Palette
  useEffect(() => {
    const root = document.documentElement;

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
  }, [mode, accent]);

  return (
    <ThemeContext.Provider value={{ colorPalettes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
