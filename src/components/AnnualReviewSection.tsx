/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { FinanceData } from '../types';
import { formatCurrency, formatCompactCurrency } from '../utils/formatters';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  Award, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  PieChart as PieIcon, 
  DollarSign, 
  CreditCard, 
  Percent, 
  ShieldCheck, 
  Sparkles, 
  Share2, 
  Copy, 
  Check, 
  Target, 
  Coins, 
  Wallet, 
  Info, 
  Briefcase,
  Layers,
  ChevronRight,
  TrendingDown,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';

interface AnnualReviewSectionProps {
  data: FinanceData;
  setCurrentTab: (tab: string) => void;
}

export default function AnnualReviewSection({ data, setCurrentTab }: AnnualReviewSectionProps) {
  const { 
    preferences, 
    accounts = [], 
    incomes = [], 
    expenses = [], 
    investments = [], 
    emis = [], 
    ccEmis = [],
    savingGoals = []
  } = data;

  // Extract all unique years with logged data
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    
    // Scan expenses
    expenses.forEach(exp => {
      if (exp.date) {
        const year = exp.date.split('-')[0];
        if (year && year.length === 4) yearsSet.add(year);
      }
    });

    // Scan incomes
    incomes.forEach(inc => {
      if (inc.date) {
        const year = inc.date.split('-')[0];
        if (year && year.length === 4) yearsSet.add(year);
      }
    });

    // Fallbacks if no data exists yet
    if (yearsSet.size === 0) {
      yearsSet.add('2026');
      yearsSet.add('2025');
    }

    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [expenses, incomes]);

  // Selected Year for review
  const [selectedYear, setSelectedYear] = useState<string>(availableYears[0] || '2026');

  // Copy success feedback state
  const [copySuccess, setCopySuccess] = useState(false);

  // Filter incomes and expenses for the selected year
  const yearIncomes = useMemo(() => {
    return incomes.filter(inc => inc.date && inc.date.startsWith(selectedYear));
  }, [incomes, selectedYear]);

  const yearExpenses = useMemo(() => {
    return expenses.filter(exp => exp.date && exp.date.startsWith(selectedYear));
  }, [expenses, selectedYear]);

  // Calculations for selected year
  const totalIncome = useMemo(() => {
    return yearIncomes.reduce((sum, inc) => sum + inc.amount, 0);
  }, [yearIncomes]);

  const totalExpenses = useMemo(() => {
    return yearExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [yearExpenses]);

  const savingsRate = useMemo(() => {
    if (totalIncome <= 0) return 0;
    const rate = ((totalIncome - totalExpenses) / totalIncome) * 100;
    return rate;
  }, [totalIncome, totalExpenses]);

  // Credit utilization metrics
  const creditUtilizationInfo = useMemo(() => {
    const cards = accounts.filter(a => a.type === 'credit_card');
    const totalLimit = cards.reduce((sum, a) => sum + (a.limit || 0), 0);
    const totalBalance = cards.reduce((sum, a) => sum + a.balance, 0);
    const utilizationRate = totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;
    
    return {
      totalLimit,
      totalBalance,
      rate: utilizationRate,
      cardsCount: cards.length
    };
  }, [accounts]);

  // EMI and Loan commitments (Annual & Monthly)
  const emiInfo = useMemo(() => {
    // Standard active loans monthly amount
    const activeEmisMonthly = (emis || [])
      .filter(e => e.isActive)
      .reduce((sum, e) => sum + e.amount, 0);

    // Active CC EMI monthly installment payments
    const activeCcEmisMonthly = (ccEmis || [])
      .filter(e => e.status === 'active')
      .reduce((sum, e) => {
        const nextUnpaid = e.installments.find(inst => inst.paidStatus === 'unpaid');
        return sum + (nextUnpaid ? nextUnpaid.totalInstallmentAmount : (e.financedAmount / e.tenure));
      }, 0);

    const totalMonthlyEmiCommitment = activeEmisMonthly + activeCcEmisMonthly;
    const estimatedAnnualEmiCommitment = totalMonthlyEmiCommitment * 12;

    // EMI to Income ratio
    const emiToIncomeRatio = totalIncome > 0 ? (estimatedAnnualEmiCommitment / totalIncome) * 100 : 0;

    return {
      monthly: totalMonthlyEmiCommitment,
      annual: estimatedAnnualEmiCommitment,
      ratio: emiToIncomeRatio,
      hasActiveEmis: emis.length > 0 || ccEmis.length > 0
    };
  }, [emis, ccEmis, totalIncome]);

  // Historical Net Worth backtracking for Jan 1st and Dec 31st of selected year
  const evaluateHistoricalNetWorthOnDate = (targetDate: Date) => {
    const targetTime = targetDate.getTime();
    const nowTime = new Date().getTime();
    const today = new Date();
    
    // Get difference in months from today back to the target date
    const monthsDiff = (today.getFullYear() - targetDate.getFullYear()) * 12 + (today.getMonth() - targetDate.getMonth());

    // Backtrack Bank accounts balance
    let bankBase = accounts.filter(a => a.type === 'bank').reduce((sum, a) => sum + a.balance, 0);
    const pastExpenses = expenses.filter(e => {
      const t = new Date(e.date).getTime();
      return t > targetTime && t <= nowTime;
    });
    const pastIncomes = incomes.filter(i => {
      const t = new Date(i.date).getTime();
      return t > targetTime && t <= nowTime;
    });
    const backtrackBank = Math.max(0, bankBase + pastExpenses.reduce((sum, e) => sum + e.amount, 0) - pastIncomes.reduce((sum, i) => sum + i.amount, 0));

    // Backtrack Credit Cards outstanding
    let creditBase = accounts.filter(a => a.type === 'credit_card').reduce((sum, a) => sum + a.balance, 0);
    const pastCcExpenses = expenses.filter(e => {
      const isCard = accounts.find(a => a.id === e.accountId)?.type === 'credit_card';
      const t = new Date(e.date).getTime();
      return isCard && t > targetTime && t <= nowTime;
    });
    const backtrackCredit = Math.max(0, creditBase - pastCcExpenses.reduce((sum, e) => sum + e.amount, 0));

    // Configure/retrieve active categories list
    const activeCategories = preferences.netWorthSettings?.categories || [
      { key: 'bank_accounts', label: 'Bank accounts', isManual: false, manualValue: 0 },
      { key: 'cash', label: 'Cash', isManual: true, manualValue: 15000 },
      { key: 'mutual_funds', label: 'Mutual funds', isManual: false, manualValue: 0 },
      { key: 'stocks', label: 'Stocks', isManual: false, manualValue: 0 },
      { key: 'ppf', label: 'PPF', isManual: false, manualValue: 0 },
      { key: 'nps', label: 'NPS', isManual: true, manualValue: 50000 },
      { key: 'gold', label: 'Gold', isManual: false, manualValue: 0 },
      { key: 'epf', label: 'EPF', isManual: true, manualValue: 180000 },
      { key: 'ssy', label: 'SSY', isManual: true, manualValue: 0 },
      { key: 'fixed_deposits', label: 'Fixed deposits', isManual: true, manualValue: 100000 },
      { key: 'credit_cards', label: 'Credit card outstanding', isManual: false, manualValue: 0 },
      { key: 'emis', label: 'EMIs', isManual: false, manualValue: 0 },
      { key: 'loans', label: 'Loans', isManual: false, manualValue: 0 }
    ];

    let assetSum = 0;
    let liabilitySum = 0;

    activeCategories.forEach(cat => {
      const isAsset = ['bank_accounts', 'cash', 'mutual_funds', 'stocks', 'ppf', 'nps', 'gold', 'epf', 'ssy', 'fixed_deposits'].includes(cat.key);
      
      if (isAsset) {
        if (cat.key === 'bank_accounts') {
          assetSum += backtrackBank;
        } else if (cat.isManual || cat.key === 'cash') {
          assetSum += cat.manualValue * Math.pow(1 - 0.005, Math.max(0, monthsDiff));
        } else {
          let invCatSum = 0;
          investments.forEach(inv => {
            const isMatch = (
              (cat.key === 'mutual_funds' && (inv.type.toLowerCase().includes('mutual') || inv.type === 'mutual_fund' || inv.type === 'Mutual Funds')) ||
              (cat.key === 'stocks' && (inv.type.toLowerCase().includes('stock') || inv.type.toLowerCase().includes('equit') || inv.type === 'Stocks & Equities')) ||
              (cat.key === 'ppf' && (inv.name.toLowerCase().includes('ppf') || inv.type.toLowerCase().includes('ppf') || inv.type === 'Government Schemes')) ||
              (cat.key === 'nps' && (inv.name.toLowerCase().includes('nps') || inv.type.toLowerCase().includes('nps'))) ||
              (cat.key === 'gold' && (inv.type.toLowerCase().includes('gold') || inv.type === 'Gold Investment')) ||
              (cat.key === 'epf' && (inv.name.toLowerCase().includes('epf') || inv.type.toLowerCase().includes('epf'))) ||
              (cat.key === 'ssy' && (inv.name.toLowerCase().includes('ssy') || inv.type.toLowerCase().includes('ssy'))) ||
              (cat.key === 'fixed_deposits' && (inv.type.toLowerCase().includes('fixed') || inv.type.toLowerCase().includes('deposit') || inv.type === 'Fixed Deposits'))
            );

            if (isMatch) {
              if (targetDate < new Date(inv.startDate)) return;
              invCatSum += inv.totalInvested * Math.pow(1 - 0.008, Math.max(0, monthsDiff));
            }
          });
          assetSum += invCatSum;
        }
      } else {
        if (cat.key === 'credit_cards') {
          liabilitySum += backtrackCredit;
        } else if (cat.isManual) {
          liabilitySum += cat.manualValue * Math.pow(1 - 0.003, Math.max(0, monthsDiff));
        } else if (cat.key === 'emis') {
          let ccEmiSum = 0;
          ccEmis.forEach(emi => {
            if (emi.status === 'active') {
              if (targetDate < new Date(emi.startDate)) return;
              const estPaidBackwards = (emi.financedAmount / emi.tenure) * monthsDiff;
              ccEmiSum += Math.min(emi.financedAmount, emi.outstandingPrincipal + estPaidBackwards);
            }
          });
          liabilitySum += ccEmiSum;
        } else if (cat.key === 'loans') {
          let loanSum = 0;
          emis.forEach(emi => {
            if (emi.isActive) {
              const emiStart = new Date(emi.startDate + '-01');
              if (targetDate < emiStart) return;
              const remaining = Math.max(0, emi.totalTenure - emi.installmentsPaid);
              const pastRemaining = Math.min(emi.totalTenure, remaining + monthsDiff);
              loanSum += emi.amount * pastRemaining;
            }
          });
          liabilitySum += loanSum;
        }
      }
    });

    return {
      assets: Math.round(assetSum),
      liabilities: Math.round(liabilitySum),
      netWorth: Math.round(assetSum - liabilitySum)
    };
  };

  // Compile Net Worth growth & Investment Growth for the selected year
  const annualGrowthMetrics = useMemo(() => {
    // Beginning of year: Jan 1st of Selected Year
    const startOfYearDate = new Date(`${selectedYear}-01-01`);
    const startPoint = evaluateHistoricalNetWorthOnDate(startOfYearDate);

    // End of year: Dec 31st of Selected Year (or Today if current year)
    const isCurrentYear = selectedYear === new Date().getFullYear().toString();
    const endOfYearDate = isCurrentYear ? new Date() : new Date(`${selectedYear}-12-31`);
    const endPoint = evaluateHistoricalNetWorthOnDate(endOfYearDate);

    const netWorthJan1 = startPoint.netWorth;
    const netWorthDec31 = endPoint.netWorth;
    const nwDelta = netWorthDec31 - netWorthJan1;
    const nwPercent = netWorthJan1 !== 0 ? (nwDelta / Math.abs(netWorthJan1)) * 100 : 0;

    // Investment Portfolio Values
    const startInvestments = (investments || []).reduce((sum, inv) => {
      const startT = new Date(inv.startDate).getTime();
      if (startT > startOfYearDate.getTime()) return sum; // didn't exist yet
      
      const monthsBack = (new Date().getFullYear() - parseInt(selectedYear)) * 12 + (new Date().getMonth() - 0);
      return sum + (inv.totalInvested * Math.pow(1 - 0.008, monthsBack));
    }, 0);

    const endInvestments = (investments || []).reduce((sum, inv) => {
      const startT = new Date(inv.startDate).getTime();
      if (startT > endOfYearDate.getTime()) return sum;
      
      let monthsBack = 0;
      if (!isCurrentYear) {
        monthsBack = (new Date().getFullYear() - parseInt(selectedYear) - 1) * 12 + (new Date().getMonth() - 11);
      }
      return sum + (inv.totalInvested * Math.pow(1 - 0.008, monthsBack));
    }, 0);

    const investmentDelta = endInvestments - startInvestments;
    const investmentPercent = startInvestments > 0 ? (investmentDelta / startInvestments) * 100 : 0;

    return {
      netWorthStart: netWorthJan1,
      netWorthEnd: netWorthDec31,
      netWorthDelta: nwDelta,
      netWorthGrowthRate: nwPercent,
      investmentStart: startInvestments,
      investmentEnd: endInvestments,
      investmentDelta: investmentDelta,
      investmentGrowthRate: investmentPercent,
    };
  }, [selectedYear, accounts, investments, ccEmis, emis, expenses, incomes, preferences]);

  // Top Spending Categories
  const topCategories = useMemo(() => {
    const categoryTotals: { [cat: string]: number } = {};
    yearExpenses.forEach(exp => {
      if (exp.category) {
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
      }
    });

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [yearExpenses]);

  // Largest Purchases
  const largestPurchases = useMemo(() => {
    return [...yearExpenses]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [yearExpenses]);

  // Financial Goals Progress
  const annualGoalProgress = useMemo(() => {
    // Filter goals scheduled or active in this year
    return savingGoals.map(goal => {
      const targetYear = goal.targetDate.split('-')[0];
      const isInYear = targetYear === selectedYear;
      const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
      return {
        ...goal,
        isInYear,
        progress
      };
    });
  }, [savingGoals, selectedYear]);

  // Dynamic Milestones Achieved List
  const milestones = useMemo(() => {
    const list = [];

    // Milestone 1: Emergency shield
    const emergencyGoal = savingGoals.find(g => g.name.toLowerCase().includes('emergency'));
    const isEmergencySafe = emergencyGoal && (emergencyGoal.currentAmount / emergencyGoal.targetAmount) >= 1;
    if (isEmergencySafe) {
      list.push({
        id: 'ms-emergency',
        title: 'Emergency Shield Activated',
        desc: 'Fully funded security vault to safeguard your family against market shocks.',
        icon: ShieldCheck,
        color: 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
      });
    }

    // Milestone 2: High savings velocity
    if (savingsRate >= 35) {
      list.push({
        id: 'ms-saver',
        title: 'High-Velocity Wealth Creator',
        desc: `Earned elite status by pocketing ${savingsRate.toFixed(1)}% of your yearly inflows!`,
        icon: Sparkles,
        color: 'border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400'
      });
    }

    // Milestone 3: Net Worth Breakthrough
    if (annualGrowthMetrics.netWorthGrowthRate >= 12) {
      list.push({
        id: 'ms-networth',
        title: 'Aggressive Wealth Multiplier',
        desc: `Pushed your absolute ledger assets up by ${annualGrowthMetrics.netWorthGrowthRate.toFixed(1)}% this year!`,
        icon: TrendingUp,
        color: 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
      });
    }

    // Milestone 4: Debt discipline
    if (creditUtilizationInfo.rate < 30 && accounts.filter(a => a.type === 'credit_card').length > 0) {
      list.push({
        id: 'ms-credit',
        title: 'Stellar Credit Sentinel',
        desc: `Maintained conservative card utilization (${creditUtilizationInfo.rate.toFixed(1)}%), optimal for CIBIL ratings.`,
        icon: CreditCard,
        color: 'border-sky-200 dark:border-sky-900 bg-sky-50/50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400'
      });
    }

    // Milestone 5: Investment Shield
    const totalSIPCommitment = investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    if (totalSIPCommitment > 15000) {
      list.push({
        id: 'ms-investor',
        title: 'Automatic Compounder Elite',
        desc: 'Maintained a strong systematic investment framework to compound wealth off-market.',
        icon: Coins,
        color: 'border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400'
      });
    }

    // Fallback milestone if none achieved
    if (list.length === 0) {
      list.push({
        id: 'ms-onboarding',
        title: 'Fiscal Health Architect',
        desc: 'Successfully logging assets, credit lines, and systematic EMIs in PaisaFlow!',
        icon: Award,
        color: 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400'
      });
    }

    return list;
  }, [savingGoals, savingsRate, annualGrowthMetrics, creditUtilizationInfo, accounts, investments]);

  // Overall Financial Grade calculation
  const financialGrade = useMemo(() => {
    let score = 0;

    // Savings Rate (Max 40 points)
    if (savingsRate >= 40) score += 40;
    else if (savingsRate >= 25) score += 30;
    else if (savingsRate >= 10) score += 20;
    else if (savingsRate > 0) score += 10;

    // Credit Utilization (Max 30 points)
    if (creditUtilizationInfo.rate < 25) score += 30;
    else if (creditUtilizationInfo.rate < 40) score += 20;
    else if (creditUtilizationInfo.rate < 60) score += 10;

    // EMI Burden (Max 30 points)
    if (emiInfo.ratio < 15) score += 30;
    else if (emiInfo.ratio < 35) score += 20;
    else if (emiInfo.ratio < 50) score += 10;

    if (score >= 90) return { grade: 'A+', label: 'Elite Fiscal Champion', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30' };
    if (score >= 75) return { grade: 'A', label: 'Healthy Compounder', color: 'text-indigo-650 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30' };
    if (score >= 55) return { grade: 'B', label: 'Balanced Budgeter', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/30' };
    return { grade: 'C', label: 'Leveraged Exposure Warning', color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/30' };
  }, [savingsRate, creditUtilizationInfo, emiInfo]);

  // Copy share card text
  const handleCopySummaryCard = () => {
    const formattedText = `📊 PaisaFlow ${selectedYear} Annual Financial Review 📊
━━━━━━━━━━━━━━━━━━━━━━━
👤 Report Card: ${data.preferences.currencySymbol === '₹' ? 'Indian Rupee' : 'Global Wallet'} Dashboard
🏆 Overall Rating: ${financialGrade.grade} (${financialGrade.label})

💰 YEARLY METRICS SUMMARY:
• Annual Cash Inflows: ${formatCurrency(totalIncome, preferences, 0)}
• Annual Expenditures: ${formatCurrency(totalExpenses, preferences, 0)}
• Net Liquid Savings: ${formatCurrency(totalIncome - totalExpenses, preferences, 0)}
• Annualized Savings Rate: ${savingsRate.toFixed(1)}%

📈 WEALTH ACCUMULATION:
• Starting Net Worth: ${formatCurrency(annualGrowthMetrics.netWorthStart, preferences, 0)}
• Closing Net Worth: ${formatCurrency(annualGrowthMetrics.netWorthEnd, preferences, 0)}
• Absolute Net Worth Growth: ${formatCurrency(annualGrowthMetrics.netWorthDelta, preferences, 0)} (${annualGrowthMetrics.netWorthGrowthRate.toFixed(1)}%)
• Portfolio Additions / Gains: ${formatCurrency(annualGrowthMetrics.investmentDelta, preferences, 0)} (${annualGrowthMetrics.investmentGrowthRate.toFixed(1)}%)

💳 DEBT & RISK EXPOSURE:
• EMI to Income leverage: ${emiInfo.ratio.toFixed(1)}%
• Cards Utilization Index: ${creditUtilizationInfo.rate.toFixed(1)}%

🏆 TOP MILESTONES SECURED:
${milestones.map(ms => `• ${ms.title}`).join('\n')}

Generated using PaisaFlow Smart FinTech Ledger ✨`;

    navigator.clipboard.writeText(formattedText).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  // Recharts color palette
  const colorsList = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444'];

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            <Award className="w-5.5 h-5.5 text-indigo-600 shrink-0" />
            Annual Financial Review Report
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Audit your cumulative yearly performance cashflows, wealth balance sheets, debt burdens, and financial health grades.
          </p>
        </div>

        {/* YEAR SELECTION CONTROL */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Review Period:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="text-xs font-bold py-1.5 px-3 bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer text-slate-700 dark:text-slate-200"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year} Calendar Year</option>
            ))}
          </select>
        </div>
      </div>

      {/* CORE PERFORMANCE STATEMENT & SHARE CARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left 8 Columns: Main Review Overview */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* TOP SUMMARY STRIP: CASH INFLOWS, OUTFLOWS & NET SAVINGS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="bg-white dark:bg-[#0b1329] p-4.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-extrabold tracking-wider block">Cumulative Yearly Inflow</span>
                <span className="text-xl sm:text-2xl font-black font-mono block mt-2 text-indigo-600 dark:text-indigo-400 tracking-tight">
                  {formatCurrency(totalIncome, preferences, 0)}
                </span>
              </div>
              <div className="text-[9.5px] font-semibold text-slate-400 mt-3 border-t border-slate-50 dark:border-slate-800/40 pt-2">
                Logged income streams in {selectedYear}
              </div>
            </div>

            <div className="bg-white dark:bg-[#0b1329] p-4.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-extrabold tracking-wider block">Cumulative Yearly Expense</span>
                <span className="text-xl sm:text-2xl font-black font-mono block mt-2 text-rose-600 dark:text-rose-455 tracking-tight">
                  {formatCurrency(totalExpenses, preferences, 0)}
                </span>
              </div>
              <div className="text-[9.5px] font-semibold text-slate-400 mt-3 border-t border-slate-50 dark:border-slate-800/40 pt-2">
                Including purchases and automated outlays
              </div>
            </div>

            <div className="bg-white dark:bg-[#0b1329] p-4.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-extrabold tracking-wider block">Absolute Cash Saved</span>
                <span className={`text-xl sm:text-2xl font-black font-mono block mt-2 tracking-tight ${totalIncome - totalExpenses >= 0 ? 'text-emerald-650 dark:text-emerald-400' : 'text-rose-600'}`}>
                  {formatCurrency(totalIncome - totalExpenses, preferences, 0)}
                </span>
              </div>
              <div className="text-[9.5px] font-semibold text-slate-400 mt-3 border-t border-slate-50 dark:border-slate-800/40 pt-2 flex justify-between items-center">
                <span>Savings Velocity</span>
                <span className={`font-bold font-mono px-1.5 py-0.5 rounded ${savingsRate >= 20 ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600' : 'bg-slate-50 dark:bg-slate-900 text-slate-550'}`}>
                  {savingsRate.toFixed(1)}%
                </span>
              </div>
            </div>

          </div>

          {/* SECONDARY METRICS ROW: NET WORTH AND INVESTMENT PROGRESS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Wealth Accrual Stat */}
            <div className="bg-white dark:bg-[#0b1329] p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl"></div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-extrabold tracking-wider block">Net Worth Growth</span>
              
              <div className="flex items-baseline gap-2 mt-2">
                <span className={`text-2xl font-black font-mono ${annualGrowthMetrics.netWorthDelta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                  {annualGrowthMetrics.netWorthDelta >= 0 ? '+' : ''}{formatCurrency(annualGrowthMetrics.netWorthDelta, preferences, 0)}
                </span>
                <span className={`text-xs font-black font-mono px-1.5 py-0.5 rounded ${annualGrowthMetrics.netWorthDelta >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600' : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600'}`}>
                  {annualGrowthMetrics.netWorthDelta >= 0 ? '▲' : '▼'} {annualGrowthMetrics.netWorthGrowthRate.toFixed(1)}%
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800/30 flex justify-between text-xs font-semibold text-slate-500">
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-extrabold">Starting NW</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 mt-0.5 block">{formatCurrency(annualGrowthMetrics.netWorthStart, preferences, 0)}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-extrabold">Closing NW</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 mt-0.5 block">{formatCurrency(annualGrowthMetrics.netWorthEnd, preferences, 0)}</span>
                </div>
              </div>
            </div>

            {/* Systematic Investment Portfolio Stat */}
            <div className="bg-white dark:bg-[#0b1329] p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl"></div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-extrabold tracking-wider block">Systematic Investment Growth</span>
              
              <div className="flex items-baseline gap-2 mt-2">
                <span className={`text-2xl font-black font-mono ${annualGrowthMetrics.investmentDelta >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600'}`}>
                  {annualGrowthMetrics.investmentDelta >= 0 ? '+' : ''}{formatCurrency(annualGrowthMetrics.investmentDelta, preferences, 0)}
                </span>
                <span className={`text-xs font-black font-mono px-1.5 py-0.5 rounded ${annualGrowthMetrics.investmentDelta >= 0 ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600' : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600'}`}>
                  {annualGrowthMetrics.investmentDelta >= 0 ? '▲' : '▼'} {annualGrowthMetrics.investmentGrowthRate.toFixed(1)}%
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800/30 flex justify-between text-xs font-semibold text-slate-500">
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-extrabold">Jan 1 Holdings</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 mt-0.5 block">{formatCurrency(annualGrowthMetrics.investmentStart, preferences, 0)}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-extrabold">Dec 31 Holdings</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 mt-0.5 block">{formatCurrency(annualGrowthMetrics.investmentEnd, preferences, 0)}</span>
                </div>
              </div>
            </div>

          </div>

          {/* THIRD ROW: DEBT EXPOSURE & RISK SHIELDS (EMI BURDEN + CREDIT CARD UTILIZATION) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Cards Credit Utilization Meter */}
            <div className="bg-white dark:bg-[#0b1329] p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-extrabold tracking-wider block">Cards Credit Utilization Index</span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-2xl font-black font-mono tracking-tight text-slate-800 dark:text-white">
                    {creditUtilizationInfo.rate.toFixed(1)}%
                  </span>
                  <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded ${
                    creditUtilizationInfo.rate < 30 
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600' 
                      : creditUtilizationInfo.rate < 50 
                      ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600' 
                      : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600'
                  }`}>
                    {creditUtilizationInfo.rate < 30 ? 'Optimal' : creditUtilizationInfo.rate < 50 ? 'Moderate' : 'Risk Exposure Alert'}
                  </span>
                </div>
                
                {/* Visual horizontal gauge bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      creditUtilizationInfo.rate < 30 ? 'bg-emerald-500' : creditUtilizationInfo.rate < 50 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, creditUtilizationInfo.rate)}%` }}
                  />
                </div>
              </div>

              <div className="text-[10px] font-semibold text-slate-400 mt-4 pt-2.5 border-t border-slate-50 dark:border-slate-800/30 flex justify-between">
                <span>Total Cards Dues: <strong>{formatCurrency(creditUtilizationInfo.totalBalance, preferences, 0)}</strong></span>
                <span>Combined Limit: <strong>{formatCompactCurrency(creditUtilizationInfo.totalLimit, preferences)}</strong></span>
              </div>
            </div>

            {/* EMI Burden Stat */}
            <div className="bg-white dark:bg-[#0b1329] p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-extrabold tracking-wider block">EMI & Term Loan Income Burden</span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-2xl font-black font-mono tracking-tight text-slate-800 dark:text-white">
                    {emiInfo.ratio.toFixed(1)}%
                  </span>
                  <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded ${
                    emiInfo.ratio < 15 
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600' 
                      : emiInfo.ratio < 35 
                      ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600' 
                      : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600'
                  }`}>
                    {emiInfo.ratio < 15 ? 'Highly Conservative' : emiInfo.ratio < 35 ? 'Moderate' : 'Highly Leveraged'}
                  </span>
                </div>

                {/* Visual progress bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      emiInfo.ratio < 15 ? 'bg-emerald-500' : emiInfo.ratio < 35 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, emiInfo.ratio)}%` }}
                  />
                </div>
              </div>

              <div className="text-[10px] font-semibold text-slate-400 mt-4 pt-2.5 border-t border-slate-50 dark:border-slate-800/30 flex justify-between">
                <span>Monthly EMIs: <strong>{formatCurrency(emiInfo.monthly, preferences, 0)}</strong></span>
                <span>Yearly EMIs: <strong>{formatCurrency(emiInfo.annual, preferences, 0)}</strong></span>
              </div>
            </div>

          </div>

          {/* SPENDING INSIGHTS: TOP CATEGORIES & LARGEST TRANSACTIONS CHART */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Top Categories list */}
            <div className="bg-white dark:bg-[#0b1329] p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5 mb-4">
                <PieIcon className="w-4 h-4 text-indigo-500" /> Top Spending Outlays
              </span>

              {topCategories.length > 0 ? (
                <div className="space-y-3.5">
                  {topCategories.slice(0, 5).map((cat, idx) => {
                    const pct = totalExpenses > 0 ? (cat.value / totalExpenses) * 100 : 0;
                    return (
                      <div key={cat.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-350">
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colorsList[idx % colorsList.length] }}></span>
                            {cat.name}
                          </span>
                          <span className="font-mono">{formatCurrency(cat.value, preferences, 0)} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800/60 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="h-1.5 rounded-full"
                            style={{ 
                              width: `${pct}%`,
                              backgroundColor: colorsList[idx % colorsList.length]
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Info className="w-8 h-8 text-slate-300 mx-auto mb-2 animate-pulse" />
                  <p className="text-xs font-bold text-slate-450">No expenses logged for this year period.</p>
                </div>
              )}
            </div>

            {/* Largest Purchases of the selected year */}
            <div className="bg-white dark:bg-[#0b1329] p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5 mb-4">
                <Layers className="w-4 h-4 text-rose-500" /> Largest Transactions
              </span>

              {largestPurchases.length > 0 ? (
                <div className="space-y-3">
                  {largestPurchases.map((exp, idx) => {
                    const card = accounts.find(a => a.id === exp.accountId);
                    return (
                      <div key={exp.id} className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800/40 pb-2.5 last:border-b-0 last:pb-0">
                        <div className="min-w-0 pr-3">
                          <span className="font-bold text-xs text-slate-750 dark:text-slate-200 block truncate" title={exp.description}>
                            {exp.description}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-semibold mt-0.5">
                            {exp.category} • {new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-black font-mono text-slate-800 dark:text-slate-100 block">
                            {formatCurrency(exp.amount, preferences, 0)}
                          </span>
                          <span className="text-[8px] px-1 py-0.2 bg-slate-100 dark:bg-slate-800 rounded font-bold text-slate-500 uppercase mt-0.5 inline-block">
                            {card ? card.institution : 'Cash'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Info className="w-8 h-8 text-slate-300 mx-auto mb-2 animate-pulse" />
                  <p className="text-xs font-bold text-slate-450">No transactions recorded.</p>
                </div>
              )}
            </div>

          </div>

          {/* ACTIVE GOALS PERFORMANCE CHECKLIST */}
          <div className="bg-white dark:bg-[#0b1329] p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5 mb-4">
              <Target className="w-4 h-4 text-emerald-500" /> Fiscal Goal Achievements
            </span>

            {annualGoalProgress.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {annualGoalProgress.map(goal => (
                  <div key={goal.id} className="border border-slate-100 dark:border-slate-800 p-3.5 rounded-xl space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">{goal.name}</span>
                        <span className="text-[9px] text-slate-400 uppercase font-black block tracking-wider mt-0.5">{goal.category}</span>
                      </div>
                      <span className={`text-[10px] font-black font-mono ${goal.progress >= 100 ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {goal.progress.toFixed(0)}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-800/70 h-1 rounded-full overflow-hidden">
                      <div 
                        className={`h-1 rounded-full ${goal.progress >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                        style={{ width: `${Math.min(100, goal.progress)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-semibold text-slate-400">
                      <span>Funded: {formatCompactCurrency(goal.currentAmount, preferences)}</span>
                      <span>Target: {formatCompactCurrency(goal.targetAmount, preferences)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs font-bold text-slate-400">No active savings goals found.</p>
                <button 
                  onClick={() => setCurrentTab('savings')} 
                  className="text-[10px] text-indigo-600 hover:underline font-extrabold mt-1 uppercase"
                >
                  Create Savings Milestone
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Right 4 Columns: Shareable Report Card / Infographic & Milestones Panel */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* VISUAL SHAREABLE INFOGRAPHIC CERTIFICATE */}
          <div className="bg-[#0b1329] border border-indigo-950 rounded-2xl shadow-xl overflow-hidden p-6 relative text-slate-200 text-left">
            {/* Ambient aesthetic gradients inside card */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none"></div>

            {/* Card Content */}
            <div className="space-y-6 relative z-10">
              
              {/* Card Header branding */}
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] bg-indigo-950 border border-indigo-900 text-indigo-400 font-black px-2 py-0.5 rounded-md tracking-wider uppercase">
                    PaisaFlow Report Card
                  </span>
                  <h3 className="text-lg font-black tracking-tight text-white mt-1.5 flex items-center gap-1.5">
                    {selectedYear} Financial Audit
                  </h3>
                </div>
                {/* Visual Badge representing Overall Grade */}
                <div className={`w-12 h-12 rounded-full flex flex-col justify-center items-center shadow-md border ${
                  financialGrade.grade.includes('A') 
                    ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400' 
                    : 'bg-indigo-950/40 border-indigo-500 text-indigo-400'
                }`}>
                  <span className="text-lg font-black leading-none">{financialGrade.grade}</span>
                </div>
              </div>

              {/* Status bar description */}
              <div className="bg-slate-900/50 border border-slate-800/40 p-2 rounded-xl text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Class Status: {financialGrade.label}</span>
              </div>

              {/* Core metrics readout list */}
              <div className="space-y-3.5 border-t border-slate-800/80 pt-4 font-mono">
                
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-indigo-400" /> Cash Saved:
                  </span>
                  <span className="font-bold text-white text-right">
                    {formatCurrency(totalIncome - totalExpenses, preferences, 0)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5 text-emerald-400" /> Savings Rate:
                  </span>
                  <span className="font-bold text-emerald-400 text-right">
                    {savingsRate.toFixed(1)}%
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Net Worth:
                  </span>
                  <span className="font-bold text-white text-right">
                    {annualGrowthMetrics.netWorthDelta >= 0 ? '▲' : '▼'} {annualGrowthMetrics.netWorthGrowthRate.toFixed(1)}%
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-indigo-400" /> Cards Index:
                  </span>
                  <span className="font-bold text-white text-right">
                    {creditUtilizationInfo.rate.toFixed(1)}%
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-rose-400" /> Debt Burden:
                  </span>
                  <span className="font-bold text-rose-400 text-right">
                    {emiInfo.ratio.toFixed(1)}%
                  </span>
                </div>

              </div>

              {/* Achievements visual display inside card */}
              <div className="border-t border-slate-800/80 pt-4 space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-widest block">Top Achievements Secured</span>
                <div className="space-y-1.5">
                  {milestones.slice(0, 3).map(ms => (
                    <div key={ms.id} className="flex items-center gap-2 text-[10px] font-bold text-slate-300">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="truncate">{ms.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CARD SHARE ACTIONS */}
              <div className="pt-3 border-t border-slate-800/60 flex flex-col gap-2">
                <button
                  onClick={handleCopySummaryCard}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  {copySuccess ? (
                    <>
                      <Check className="w-4 h-4" /> Copied Review Text!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Copy Review Summary
                    </>
                  )}
                </button>
                <p className="text-[9px] text-slate-500 font-bold text-center">
                  Copy formatted markdown/text ready to share with friends, advisors, or on social handles.
                </p>
              </div>

            </div>
          </div>

          {/* SECURED MILESTONES FULL SHOWCASE PANEL */}
          <div className="bg-white dark:bg-[#0b1329] border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs space-y-4">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-indigo-550" /> Secured Milestones
            </span>

            <div className="space-y-3">
              {milestones.map(ms => (
                <div key={ms.id} className={`p-3 rounded-xl border flex items-start gap-3 text-left ${ms.color}`}>
                  <ms.icon className="w-5 h-5 mt-0.5 shrink-0" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs block">{ms.title}</span>
                    <p className="text-[10px] leading-relaxed font-semibold opacity-90">{ms.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
