/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'underline' | 'pills';
  className?: string;
  id?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  className = '',
  id,
}: TabsProps) {
  const containerId = id || `tabs_${Math.random().toString(36).substring(2, 9)}`;

  const tabListStyles = variant === 'pills'
    ? 'flex space-x-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg'
    : 'flex space-x-6 border-b border-slate-100 dark:border-slate-800 w-full';

  return (
    <div id={containerId} className={`w-full ${className}`}>
      <nav className={tabListStyles} aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          
          let tabStyles = '';
          if (variant === 'pills') {
            tabStyles = `flex items-center space-x-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150
              ${isActive 
                ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-400' 
                : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-200'}`;
          } else {
            tabStyles = `flex items-center space-x-2 py-3 px-1 border-b-2 text-sm font-medium transition-all duration-150 -mb-px
              ${isActive 
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'}`;
          }

          return (
            <button
              key={tab.id}
              id={`${containerId}_tab_${tab.id}`}
              type="button"
              onClick={() => onChange(tab.id)}
              className={tabStyles}
              aria-selected={isActive}
              role="tab"
            >
              {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full font-bold
                  ${isActive 
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300' 
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-850 dark:text-slate-400'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
