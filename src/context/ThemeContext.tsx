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
    '505': '#f43f5e', '500': '#f43f5e', '600': '#e11d48', '700': '#be123c', '800': '#9f1239', '900': '#881337',
  },
  violet: {
    '50': '#f5f3ff', '100': '#ede9fe', '200': '#ddd6fe', '300': '#c4b5fd', '400': '#a78bfa',
    '505': '#8b5cf6', '500': '#8b5cf6', '600': '#7c3aed', '700': '#6d28d9', '800': '#5b21b6', '900': '#4c1d95',
  },
  silver: {
    '50': '#f8f9fa', '100': '#f1f3f5', '200': '#e9ecef', '300': '#D9DADB', '400': '#ced4da',
    '505': '#adb5bd', '500': '#adb5bd', '600': '#868e96', '700': '#495057', '800': '#343a40', '900': '#212529',
  },
  purple: {
    '50': '#fbf0ff', '100': '#f6d6ff', '200': '#efaeff', '300': '#e677ff', '400': '#da30ff',
    '505': '#B100CD', '500': '#B100CD', '600': '#9300ab', '700': '#760089', '800': '#5a006a', '900': '#41004d',
  },
  pink: {
    '50': '#fff5fa', '100': '#ffe6f4', '200': '#ffcce9', '300': '#ffa3da', '400': '#ff79c9',
    '505': '#FF6EC7', '500': '#FF6EC7', '600': '#db48a2', '700': '#b32c7e', '800': '#8c1d5f', '900': '#661143',
  },
  neon_green: {
    '50': '#f4fff2', '100': '#e3ffd9', '200': '#beffab', '300': '#8eff70', '400': '#5cff33',
    '505': '#2CFF05', '500': '#2CFF05', '600': '#1ec700', '700': '#149400', '800': '#0d6900', '900': '#074500',
  },
  sky_blue: {
    '50': '#f0faff', '100': '#daf2fe', '200': '#bde8fd', '300': '#9bdcfe', '400': '#8FD9FB',
    '505': '#4ec0f8', '500': '#4ec0f8', '600': '#1da7ea', '700': '#0f85c3', '800': '#116da1', '900': '#145a82',
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
