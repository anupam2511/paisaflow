/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FinanceData, CategoryBudget } from '../types';
import { formatCurrency } from '../utils/formatters';
import { 
  ShieldCheck, 
  Flame, 
  Scale, 
  Plus, 
  AlertTriangle, 
  Sparkles, 
  Sliders, 
  Trash2, 
  CheckCircle,
  FolderPlus
} from 'lucide-react';
import { motion } from 'motion/react';

interface BudgetsSectionProps {
  data: FinanceData;
  setFinanceData: React.Dispatch<React.SetStateAction<FinanceData>>;
}

export default function BudgetsSection({ data, setFinanceData }: BudgetsSectionProps) {
  const { budgets, expenses, recurringSpends, preferences } = data;

  const [selectedCategory, setSelectedCategory] = useState(budgets[0]?.category || '');
  const [newLimit, setNewLimit] = useState(() => {
    const firstCat = budgets[0]?.category;
    if (firstCat) {
      const match = budgets.find(b => b.category.toLowerCase() === firstCat.toLowerCase());
      return (match && match.limit !== undefined && match.limit > 0) ? match.limit.toString() : '';
    }
    return '';
  });
  const [success, setSuccess] = useState('');
  const [budgetError, setBudgetError] = useState('');

  // Synchronise existing category budget when selecting a category or when budgets change
  React.useEffect(() => {
    if (selectedCategory) {
      const match = budgets.find(b => b.category.toLowerCase() === selectedCategory.toLowerCase());
      if (match && match.limit !== undefined && match.limit > 0) {
        setNewLimit(match.limit.toString());
      } else {
        setNewLimit('');
      }
    }
  }, [selectedCategory, budgets]);

  // Custom categories addition
  const [categorySuccess, setCategorySuccess] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const handleUpdateBudget = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');

    if (!selectedCategory) return;
    const limitNum = parseFloat(newLimit);
    if (isNaN(limitNum) || limitNum < 0) {
      setBudgetError('Please enter a valid positive budget limit.');
      setTimeout(() => setBudgetError(''), 4000);
      return;
    }

    const updatedBudgets = budgets.map(b => {
      if (b.category.toLowerCase() === selectedCategory.toLowerCase()) {
        return { ...b, limit: limitNum };
      }
      return b;
    });

    setFinanceData(prev => ({
      ...prev,
      budgets: updatedBudgets,
    }));

    setNewLimit('');
    setSuccess(`Budget limit for "${selectedCategory}" updated to ${formatCurrency(limitNum, preferences)}!`);
    setTimeout(() => setSuccess(''), 4000);
  };



  const handleDeleteCategory = (categoryToDel: string) => {
    if (budgets.length <= 1) {
      setCategoryError('You must have at least one budget category active.');
      setTimeout(() => setCategoryError(''), 4000);
      return;
    }
    setCategoryToDelete(categoryToDel);
  };

  const confirmDeleteCategory = () => {
    if (!categoryToDelete) return;
    const remainingBudgets = budgets.filter(b => b.category.toLowerCase() !== categoryToDelete.toLowerCase());
    setFinanceData(prev => ({
      ...prev,
      budgets: remainingBudgets
    }));
    if (selectedCategory.toLowerCase() === categoryToDelete.toLowerCase()) {
      setSelectedCategory(remainingBudgets[0]?.category || '');
    }
    setCategoryToDelete(null);
  };

  // Detailed spend analysis per category
  const budgetAverages = budgets.map(b => {
    // Collect spent
    const manualSpendsSum = expenses
      .filter(e => e.category.toLowerCase() === b.category.toLowerCase())
      .reduce((sum, e) => sum + e.amount, 0);

    const subscriptionSpendsSum = recurringSpends
      .filter(r => r.isActive && r.category.toLowerCase() === b.category.toLowerCase())
      .reduce((sum, r) => sum + r.amount, 0);

    const totalSpent = manualSpendsSum + subscriptionSpendsSum;
    const remaining = Math.max(0, b.limit - totalSpent);
    const pct = b.limit > 0 ? (totalSpent / b.limit) * 100 : 0;

    return {
      category: b.category,
      limit: b.limit,
      totalSpent,
      remaining,
      pct,
      isOverBudget: totalSpent > b.limit
    };
  });

  const totalAllBudgets = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalAllSpends = budgetAverages.reduce((sum, b) => sum + b.totalSpent, 0);

  return (
    <div id="budgets-root" className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
      
      {/* LEFT COLUMN: CONTROLS */}
      <div className="lg:col-span-4 space-y-4">
        
        {/* SHIELD LIMIT FORM */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm h-fit">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-50 mb-3">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-800 font-sans">Set Budget Boundaries</h2>
          </div>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Calibrate the monthly expenditure limits for your categories. Real-time spend trackers will instantly alert you of near-overdrafts.
          </p>

          <form onSubmit={handleUpdateBudget} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
              >
                {budgets.map(b => (
                  <option key={b.category} value={b.category}>
                    {b.category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Monthly Cost Limit</label>
              <div className="relative">
                <span className="absolute left-2.5 top-2.5 text-xs text-slate-400 font-bold">{preferences.currencySymbol}</span>
                <input
                  type="number"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 pl-6 bg-slate-50 focus:outline-none focus:border-indigo-500 font-bold text-slate-800"
                />
              </div>
            </div>

            {success && (
              <p className="text-[10px] font-semibold text-teal-600 bg-teal-50 p-2 rounded-lg border border-teal-100">
                ✔️ {success}
              </p>
            )}
            {budgetError && (
              <p className="text-[10px] font-semibold text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-100">
                ⚠️ {budgetError}
              </p>
            )}

            <button
              type="submit"
              className="w-full text-xs bg-indigo-600 hover:bg-indigo-700 transition text-white font-extrabold py-3 rounded-xl shadow-sm cursor-pointer"
            >
              Update Category Limit
            </button>
          </form>
        </div>



        {/* OVERALL CAP STATEMENT */}
        <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white p-6 md:p-8 rounded-3xl border border-slate-200/60 dark:border-slate-800 relative overflow-hidden shadow-xs dark:shadow-sm">
          <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-indigo-600 rounded-full opacity-10 dark:opacity-25 pointer-events-none"></div>
          <div className="relative z-10 flex justify-between items-start">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500 dark:text-slate-400">Total Monthly budget shield</span>
            <Scale className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="relative z-10 text-xl font-bold mt-2 text-slate-900 dark:text-white">{formatCurrency(totalAllSpends, preferences)} <span className="text-sm font-normal text-slate-500 dark:text-slate-400 font-sans">spent of {formatCurrency(totalAllBudgets, preferences)}</span></p>
          <div className="relative z-10 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div 
              className={`h-1.5 rounded-full ${totalAllSpends > totalAllBudgets ? 'bg-rose-500' : 'bg-emerald-400'}`}
              style={{ width: `${Math.min(100, totalAllBudgets > 0 ? (totalAllSpends / totalAllBudgets) * 100 : 0)}%` }}
            ></div>
          </div>
          <p className="relative z-10 text-[10px] text-slate-500 dark:text-slate-400 mt-2.5 font-semibold leading-relaxed font-sans">
            Overall budget utilization is at {(((totalAllBudgets > 0 ? totalAllSpends / totalAllBudgets : 0) * 100)).toFixed(0)}%. Maintain below 85% for positive savings growth capacity.
          </p>
        </div>
      </div>

      {/* DETAILED CATEGORICAL PROGRESS LIST */}
      <div className="lg:col-span-8 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Categorical expenditure checkmarks</h2>
          <p className="text-slate-500 text-sm mt-0.5">Real-time status comparison of logged expenses against stated budget caps.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgetAverages.map(item => {
            const isWarn = item.pct >= 75 && item.pct <= 100;
            const isOver = item.pct > 100;
            
            // Dynamic color flags based on progress alerts
            let barColorClass = 'bg-emerald-500';
            let textColorClass = 'text-emerald-700 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-900/40 dark:text-emerald-400';
            let outlineClass = 'border-slate-100 dark:border-slate-800';

            if (isOver) {
              barColorClass = 'bg-rose-500';
              textColorClass = 'text-rose-700 bg-rose-50 border-rose-100 dark:bg-rose-950/40 dark:border-rose-900/40 dark:text-rose-400';
              outlineClass = 'border-rose-100 dark:border-rose-900/30 bg-rose-50/10 dark:bg-rose-950/10';
            } else if (isWarn) {
              barColorClass = 'bg-amber-500';
              textColorClass = 'text-amber-700 bg-amber-50 border-amber-100 dark:bg-amber-950/40 dark:border-amber-900/40 dark:text-amber-400';
              outlineClass = 'border-amber-100 dark:border-amber-900/20';
            }

            return (
              <div
                key={item.category}
                className={`p-5 bg-white rounded-3xl border transition-all shadow-xs relative flex flex-col justify-between ${outlineClass}`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div className="truncate pr-4">
                      <h3 className="text-sm font-bold text-slate-800 truncate" title={item.category}>{item.category}</h3>
                      <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Spent: {formatCurrency(item.totalSpent, preferences)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${textColorClass}`}>
                        {isOver ? 'Spent Over' : isWarn ? 'Nearing Cap' : 'In Safety'}
                      </span>
                      <button
                        onClick={() => handleDeleteCategory(item.category)}
                        className="p-1 hover:bg-slate-100 text-slate-300 hover:text-rose-500 rounded-md transition"
                        title={`Delete Custom Category "${item.category}"`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1 font-semibold">
                      <span>Utilization Rate ({item.pct.toFixed(0)}%)</span>
                      <span>Cap: {formatCurrency(item.limit, preferences)}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${barColorClass}`}
                        style={{ width: `${Math.min(100, item.pct)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400">
                  {isOver ? (
                    <span className="text-rose-600 font-bold flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 shrink-0 animate-bounce" /> Exceeded boundary by {formatCurrency(item.totalSpent - item.limit, preferences)}!
                    </span>
                  ) : (
                    <span className="text-slate-500 font-semibold">
                      Remaining Safe: {formatCurrency(item.remaining, preferences)}
                    </span>
                  )}
                  {item.limit === 0 && (
                    <span className="text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded">No limit set</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {budgets.length === 0 && (
          <div className="text-center p-12 bg-white dark:bg-slate-900/30 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs animate-fade-in">
            <Sliders className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-750 dark:text-slate-300 mt-3">No categories configured</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">Please register custom categories using the option on the left sidebar.</p>
          </div>
        )}
      </div>

      {/* CUSTOM CONFIRMATION DELETION MODAL */}
      {categoryToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-xl border border-slate-100/80 animate-scale-up">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4 border border-rose-100">
              <Trash2 className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-sans tracking-tight">Remove Budget Category?</h3>
            <p className="text-xs text-slate-500 mt-2.5 leading-relaxed font-medium">
              Are you sure you want to delete the budget category <span className="font-bold text-slate-1060">"{categoryToDelete}"</span>? 
              This category will be immediately unmapped from charts, but logged expenses will keep this label.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={confirmDeleteCategory}
                className="flex-1 text-xs bg-rose-600 hover:bg-rose-700 transition duration-150 text-white font-extrabold py-3 px-4 rounded-xl cursor-pointer shadow-sm hover:shadow-rose-600/10 active:scale-[0.98]"
              >
                Yes, Delete Category
              </button>
              <button
                onClick={() => setCategoryToDelete(null)}
                className="flex-1 text-xs bg-slate-150 hover:bg-slate-200 text-slate-705 font-bold py-3 px-4 rounded-xl transition duration-150 cursor-pointer active:scale-[0.98]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
