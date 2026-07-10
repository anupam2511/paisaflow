/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { 
  CreditCard, 
  ShieldAlert, 
  CalendarClock, 
  AlertTriangle, 
  Target, 
  Info 
} from 'lucide-react';

import { FinancialInsight } from '../insights/insight.types';

interface InsightsPanelProps {
  insights: FinancialInsight[];
  setCurrentTab: (tab: string) => void;
}

export default function InsightsPanel({ insights, setCurrentTab }: InsightsPanelProps) {
  return (
    <>
      {insights.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {insights.map((alert) => {
            const borderStyle = 
              alert.type === 'critical' 
                ? 'border-rose-100 bg-rose-50/30 dark:border-rose-950/40 dark:bg-rose-950/15' 
                : alert.type === 'warning' 
                  ? 'border-amber-100 bg-amber-50/20 dark:border-amber-950/30 dark:bg-amber-950/10' 
                  : 'border-indigo-100 bg-indigo-50/10 dark:border-indigo-950/30 dark:bg-indigo-950/10';

            const badgeStyle = 
              alert.type === 'critical' 
                ? 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-900/50' 
                : alert.type === 'warning' 
                  ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900/50' 
                  : 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-400 dark:border-indigo-900/50';

            // Dynamic icon resolver
            let iconElement = <Info className="w-5 h-5 text-indigo-500" />;
            let categoryLabel = 'Notification';
            if (alert.category === 'credit') {
              iconElement = <CreditCard className="w-5 h-5 text-amber-500" />;
              categoryLabel = 'Credit Utilisation';
            } else if (alert.category === 'emergency') {
              iconElement = <ShieldAlert className="w-5 h-5 text-rose-500" />;
              categoryLabel = 'Emergency Fund';
            } else if (alert.category === 'debt') {
              iconElement = <CalendarClock className="w-5 h-5 text-indigo-500" />;
              categoryLabel = 'EMI Burden';
            } else if (alert.category === 'budget') {
              iconElement = <AlertTriangle className="w-5 h-5 text-rose-500" />;
              categoryLabel = 'Budget Risk';
            } else if (alert.category === 'savings') {
              iconElement = <Target className="w-5 h-5 text-teal-500" />;
              categoryLabel = 'Savings Trend';
            }

            let impactBg = '';
            let impactText = '';
            let impactBorder = '';

            if (alert.type === 'critical') {
              impactBg = 'bg-rose-50/60 dark:bg-rose-950/25';
              impactText = 'text-rose-800 dark:text-rose-300';
              impactBorder = 'border-rose-100/60 dark:border-rose-900/40';
            } else if (alert.type === 'warning') {
              impactBg = 'bg-amber-50/60 dark:bg-amber-950/20';
              impactText = 'text-amber-800 dark:text-amber-300';
              impactBorder = 'border-amber-100/60 dark:border-amber-900/30';
            } else {
              impactBg = 'bg-indigo-50/50 dark:bg-indigo-950/20';
              impactText = 'text-indigo-800 dark:text-indigo-300';
              impactBorder = 'border-indigo-100/30 dark:border-indigo-900/30';
            }

            return (
              <motion.div 
                key={alert.id}
                whileHover={{ scale: 1.005 }}
                className={`p-4 rounded-xl border flex flex-col justify-between gap-3 shadow-xs ${borderStyle}`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded border ${badgeStyle}`}>
                      {categoryLabel}
                    </span>
                    <div className="p-1.5 bg-white dark:bg-slate-900/60 rounded-lg border border-slate-100 dark:border-slate-800 shadow-2xs">
                      {iconElement}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 leading-tight">{alert.title}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-sans">{alert.description}</p>
                    {alert.impact && (
                      <p className={`text-[11px] mt-2 font-medium p-2 rounded-lg border ${impactText} ${impactBg} ${impactBorder}`}>
                        {alert.impact}
                      </p>
                    )}
                  </div>
                </div>
                {alert.actionLabel && alert.actionTab && (
                  <button 
                    onClick={() => setCurrentTab(alert.actionTab!)}
                    className="w-full text-center text-[10px] font-extrabold text-indigo-700 dark:text-indigo-400 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer"
                  >
                    {alert.actionLabel} &rarr;
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-50/45 dark:bg-slate-900/30 border border-slate-150 dark:border-slate-800/60 rounded-2xl p-6 text-center space-y-2.5">
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto text-lg border border-emerald-100 dark:border-emerald-900/30 shadow-2xs">
            🌟
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs">Your Finances are in Perfect Harmony!</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-0.5 leading-relaxed">
              No high card utilization, overspent category budgets, upcoming overdue installments, or lagging savings goals detected. Excellent job maintaining your ledger!
            </p>
          </div>
        </div>
      )}
    </>
  );
}
