/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CreditCardEmiMaster, CreditCardEmiInstallment, Preferences, FinancialAccount } from '../types';
import { formatCurrency } from '../utils/formatters';
import { analyzeEmiCost } from '../utils/emiCalculations';
import { 
  X, 
  Calendar, 
  Clock, 
  Percent, 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  Receipt,
  RotateCcw,
  AlertTriangle,
  Lock,
  Unlock,
  ShieldAlert,
  ArrowUpRight,
  TrendingDown,
  Info
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid } from 'recharts';

interface CcEmiDetailsModalProps {
  emi: CreditCardEmiMaster;
  card?: FinancialAccount;
  preferences: Preferences;
  onClose: () => void;
  onToggleInstallment: (installmentNum: number, currentStatus: 'paid' | 'unpaid') => void;
  onPreClose: () => void;
}

export default function CcEmiDetailsModal({
  emi,
  card,
  preferences,
  onClose,
  onToggleInstallment,
  onPreClose,
}: CcEmiDetailsModalProps) {
  const analysis = analyzeEmiCost(emi);

  const installments = emi.installments || [];
  const [sortField, setSortField] = React.useState<'dueDate' | 'principal' | 'interest' | 'gstOnInterest' | 'fees' | 'gstOnFees' | 'totalInstallmentAmount' | null>(null);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');

  const handleSort = (field: 'dueDate' | 'principal' | 'interest' | 'gstOnInterest' | 'fees' | 'gstOnFees' | 'totalInstallmentAmount') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedInstallments = React.useMemo(() => {
    const list = [...installments];
    if (!sortField) return list;
    return list.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;
      if (sortField === 'dueDate') {
        valA = a.dueDate;
        valB = b.dueDate;
      } else if (sortField === 'principal') {
        valA = a.principalComponent;
        valB = b.principalComponent;
      } else if (sortField === 'interest') {
        valA = a.interestComponent;
        valB = b.interestComponent;
      } else if (sortField === 'gstOnInterest') {
        valA = a.gstOnInterest;
        valB = b.gstOnInterest;
      } else if (sortField === 'fees') {
        valA = a.processingFee + (a.conversionFee || 0) + a.offerCharge;
        valB = b.processingFee + (b.conversionFee || 0) + b.offerCharge;
      } else if (sortField === 'gstOnFees') {
        valA = a.gstOnProcessingFee + (a.gstOnConversionFee || 0) + a.gstOnOfferCharge;
        valB = b.gstOnProcessingFee + (b.gstOnConversionFee || 0) + b.gstOnOfferCharge;
      } else if (sortField === 'totalInstallmentAmount') {
        valA = a.totalInstallmentAmount;
        valB = b.totalInstallmentAmount;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [installments, sortField, sortDirection]);

  const totalInstallments = installments.length;
  const paidCount = installments.filter(inst => inst.paidStatus === 'paid').length;
  const remainingTenure = totalInstallments - paidCount;
  const progressPercent = Math.round((paidCount / emi.tenure) * 100);

  // Show requirements:
  // - Principal blocked: Blocked Principal = Outstanding Principal!
  const principalBlocked = emi.status === 'pre_closed' ? 0 : emi.outstandingPrincipal;
  // - Principal released: Released Principal = Financed Amount - Outstanding Principal!
  const principalReleased = emi.status === 'pre_closed' 
    ? emi.financedAmount 
    : Math.max(0, Math.round((emi.financedAmount - emi.outstandingPrincipal) * 100) / 100);

  // Calculate: Monthly bill impacts
  // - Month 1 Bill Impact: Installment 1 total amount (which includes principal + interest + GST + processing fee + conversion fee + offer charge + GST on fees)
  const month1Installment = installments.find(inst => inst.installmentNumber === 1);
  const month1BillImpact = month1Installment ? month1Installment.totalInstallmentAmount : 0;

  // - Month 2+ Bill Impact: Standard regular installment amount
  const month2Installment = installments.find(inst => inst.installmentNumber === 2) || month1Installment;
  const regularBillImpact = month2Installment ? (month2Installment.principalComponent + month2Installment.interestComponent + month2Installment.gstOnInterest) : 0;

  // Next bill impact: Amount of the next unpaid installment
  const nextUnpaidInstallment = installments.find(inst => inst.paidStatus === 'unpaid');
  const nextBillImpact = nextUnpaidInstallment ? nextUnpaidInstallment.totalInstallmentAmount : 0;

  // Generate: Future Liability Projection Chart Data
  // We compute the remaining cumulative payable amount after each monthly payment is scheduled
  const chartData = [
    {
      month: 'Start',
      liability: Math.round(analysis.totalPayable),
      blocked: Math.round(emi.financedAmount),
    },
    ...installments.map((inst, idx) => {
      const remainingPayableAfterThis = installments
        .slice(idx + 1)
        .reduce((sum, item) => sum + item.totalInstallmentAmount, 0);
      const remainingBlockedAfterThis = installments
        .slice(idx + 1)
        .reduce((sum, item) => sum + item.principalComponent, 0);
      return {
        month: `M${inst.installmentNumber}`,
        liability: Math.round(remainingPayableAfterThis),
        blocked: Math.round(remainingBlockedAfterThis),
        status: inst.paidStatus === 'paid' ? 'Paid' : 'Unpaid'
      };
    })
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-850 shadow-lg text-[11px] font-sans">
          <p className="font-extrabold text-slate-300">{payload[0].payload.month === 'Start' ? 'Initial Liability' : `End of Month ${payload[0].payload.month.replace('M', '')}`}</p>
          <div className="space-y-1 mt-1 font-mono">
            <p className="text-indigo-300">
              Future Liability: <strong className="text-white">{formatCurrency(payload[0].value, preferences)}</strong>
            </p>
            <p className="text-emerald-400">
              Blocked Limit: <strong className="text-white">{formatCurrency(payload[1].value, preferences)}</strong>
            </p>
          </div>
          {payload[0].payload.status && (
            <span className={`inline-block mt-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${payload[0].payload.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
              Installment: {payload[0].payload.status}
            </span>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[92vh] overflow-hidden shadow-2xl border border-slate-100 flex flex-col font-sans text-left">
        
        {/* HEADER BAR */}
        <div className="sticky top-0 bg-slate-50 border-b border-slate-150 px-6 py-4 flex items-center justify-between z-10">
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                Advanced EMI Engine & Ledger Analyzer
              </span>
              {emi.emiType === 'no_cost' ? (
                <span className="text-[9px] font-black text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" /> No-Cost EMI Flag
                </span>
              ) : (
                <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                  Regular Interest EMI
                </span>
              )}
            </div>
            <h2 className="text-base font-black text-slate-800 flex flex-wrap items-center gap-2 mt-1">
              {emi.expenseName}
              <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${emi.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                {emi.status.replace('_', ' ')}
              </span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200/70 rounded-full text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTAINER SCROLL */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* THREE COLUMN DETAILS SUMMARY */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/50 dark:bg-slate-900/30 p-5 rounded-2xl border border-slate-150/70 dark:border-slate-800/80">
            {/* Purchase & Card Details */}
            <div className="space-y-3 border-b md:border-b-0 md:border-r border-slate-150 pb-4 md:pb-0 md:pr-6">
              <h4 className="text-[10px] font-black text-slate-450 uppercase tracking-widest">Purchase Info & Card</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {card ? (
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: card.color }} />
                      <span className="text-xs font-black text-slate-850">{card.institution} - {card.name}</span>
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-slate-500">Unspecified Credit Card</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] font-semibold block">Purchase Date</span>
                    <strong className="text-slate-700 font-mono flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {emi.purchaseDate || 'Not Stored'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] font-semibold block">First Due Date</span>
                    <strong className="text-slate-700 font-mono flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-indigo-400" />
                      {emi.startDate}
                    </strong>
                  </div>
                </div>
                <div className="pt-1.5 border-t border-slate-100">
                  <span className="text-slate-450 text-[10px] font-semibold block uppercase tracking-wide">EMI Parameters</span>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed font-semibold">
                    Purchase Amt: <strong className="font-mono text-slate-800">{formatCurrency(emi.originalAmount, preferences)}</strong> @ <strong className="text-indigo-600">{emi.interestRate}% APR</strong> for <strong className="text-slate-850">{emi.tenure} Months</strong> tenure.
                  </p>
                </div>
              </div>
            </div>

            {/* Calculations and Fees breakdown */}
            <div className="space-y-2.5 border-b md:border-b-0 md:border-r border-slate-150 pb-4 md:pb-0 md:pr-6">
              <h4 className="text-[10px] font-black text-slate-450 uppercase tracking-widest">Fees & GST Calculations</h4>
              <div className="text-xs space-y-1.5 font-medium text-slate-600">
                <div className="flex justify-between">
                  <span>Processing Fee:</span>
                  <span className="font-mono text-slate-800">{formatCurrency(emi.processingFee, preferences)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Conversion Fee:</span>
                  <span className="font-mono text-slate-800">{formatCurrency(emi.conversionFee || 0, preferences)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Offer Redemption Fee:</span>
                  <span className="font-mono text-slate-800">{formatCurrency(emi.offerCharge, preferences)}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>Cumulative GST on Fees (@{emi.gstRate}%):</span>
                  <span className="font-mono font-bold">
                    +{formatCurrency(analysis.totalGstOnFees + (analysis.totalGstOnConversionFees || 0) + analysis.totalGstOnOfferCharges, preferences)}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-100 font-semibold">
                  <span>Total Tax & Fees Cost:</span>
                  <span className="font-mono text-slate-900">
                    {formatCurrency(
                      emi.processingFee + (emi.conversionFee || 0) + emi.offerCharge + 
                      analysis.totalGstOnFees + (analysis.totalGstOnConversionFees || 0) + analysis.totalGstOnOfferCharges, 
                      preferences
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Monthly Bill impact */}
            <div className="space-y-2.5">
              <h4 className="text-[10px] font-black text-slate-450 uppercase tracking-widest">Monthly Statement Bill Impact</h4>
              <div className="space-y-2 text-xs">
                <div className="bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100/50">
                  <div className="flex justify-between items-center text-[10px] font-bold text-indigo-700">
                    <span>Month 1 Billed Outflow</span>
                    <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded text-[8px] font-mono font-black uppercase">Higher Impact</span>
                  </div>
                  <div className="text-lg font-black font-mono text-indigo-900 mt-1">
                    {formatCurrency(month1BillImpact, preferences)}
                  </div>
                  <p className="text-[9.5px] text-slate-500 font-medium leading-tight mt-0.5">
                    Includes EMI + GST + Processing, Conversion, & Offer fees with GST taxes.
                  </p>
                </div>

                <div className="bg-slate-100/50 p-2 rounded-lg text-[10px] text-slate-650 flex justify-between font-semibold">
                  <span>Regular Month 2+ Bill Impact:</span>
                  <span className="font-mono text-slate-800 font-extrabold">
                    {formatCurrency(regularBillImpact, preferences)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ADVANCED LIVE METRICS - SHOW BLOCKED VS RELEASED AND REMAINING TENURE */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            {/* PRINCIPAL BLOCKED CARD */}
            <div className="bg-amber-50/40 p-4.5 rounded-2xl border border-amber-100 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] font-extrabold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  Credit Limit Blocked
                </span>
                <p className="text-lg font-black text-slate-800 font-mono">
                  {formatCurrency(principalBlocked, preferences)}
                </p>
                <span className="text-[9.5px] text-slate-500 font-medium block">Outstanding base principal on card</span>
              </div>
              <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl">
                <Lock className="w-5 h-5 animate-pulse" />
              </div>
            </div>

            {/* PRINCIPAL RELEASED CARD */}
            <div className="bg-emerald-50/40 p-4.5 rounded-2xl border border-emerald-100 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] font-extrabold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                  <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                  Credit Limit Released
                </span>
                <p className="text-lg font-black text-slate-800 font-mono">
                  {formatCurrency(principalReleased, preferences)}
                </p>
                <span className="text-[9.5px] text-slate-500 font-medium block">Principal paid and restored to limit</span>
              </div>
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                <Unlock className="w-5 h-5" />
              </div>
            </div>

            {/* REMAINING TENURE CARD */}
            <div className="bg-indigo-50/40 p-4.5 rounded-2xl border border-indigo-100 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] font-extrabold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  Remaining Tenure
                </span>
                <p className="text-lg font-black text-slate-800 font-mono">
                  {remainingTenure} of {totalInstallments} Months
                </p>
                <span className="text-[9.5px] text-slate-500 font-medium block">Payments completed: {paidCount} ({progressPercent}%)</span>
              </div>
              <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* TWO PANEL ANALYTICS & VISUALIZATION (FUTURE LIABILITY CHART & METRICS) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LIABILITY REDUCTION / PROJECTION CHART (2 COLS) */}
            <div className="lg:col-span-2 bg-slate-50/40 dark:bg-slate-900/30 p-5 rounded-2xl border border-slate-150 dark:border-slate-800/60 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-1">
                  <TrendingDown className="w-4 h-4 text-indigo-600" />
                  Future Liability & Blocked Limit Projection
                </h3>
                <p className="text-[10px] text-slate-450 font-semibold mb-4 leading-tight">
                  Visualizes remaining cumulative debt and blocked credit limit decrease month-by-month over the tenure progression.
                </p>
              </div>
              
              <div className="w-full h-56 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorLiability" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.01}/>
                      </linearGradient>
                      <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.01}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 9, fontWeight: 600, fill: '#64748b' }}
                      tickFormatter={(v) => `${preferences.currencySymbol}${v}`}
                      axisLine={false}
                      tickLine={false}
                    />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Area 
                      name="Future Liability"
                      type="monotone" 
                      dataKey="liability" 
                      stroke="#6366f1" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#colorLiability)" 
                    />
                    <Area 
                      name="Principal Blocked"
                      type="monotone" 
                      dataKey="blocked" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      fillOpacity={1} 
                      fill="url(#colorBlocked)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-450 font-bold border-t border-slate-150/60 pt-3 mt-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full inline-block"></span>
                  Remaining Payable Outflow
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block"></span>
                  Outstanding Blocked Principal
                </span>
                <span className="text-[10px] text-indigo-750 font-black font-mono">
                  Current Net Remaining: {formatCurrency(analysis.remainingPayable, preferences)}
                </span>
              </div>
            </div>

            {/* DETAILED COST STATS SUMMARY (1 COL) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-150 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-1.5 border-b border-slate-100 pb-1.5">
                  <Receipt className="w-4 h-4 text-emerald-550" />
                  Aggregate Bank Ledger
                </h3>
                <div className="text-xs space-y-2 font-medium text-slate-600 mt-2">
                  <div className="flex justify-between border-b border-dashed border-slate-100 py-1">
                    <span className="text-slate-450">Base Purchase Cost:</span>
                    <strong className="font-mono text-slate-700">{formatCurrency(emi.originalAmount, preferences)}</strong>
                  </div>
                  {emi.emiType === 'no_cost' && (
                    <div className="flex justify-between border-b border-dashed border-slate-100 py-1">
                      <span className="text-teal-650 font-bold">Upfront Merchant Discount:</span>
                      <strong className="font-mono text-teal-650 font-black">-{formatCurrency(emi.merchantDiscount, preferences)}</strong>
                    </div>
                  )}
                  <div className="flex justify-between border-b border-dashed border-slate-100 py-1">
                    <span className="text-slate-450">Financed Base Principal:</span>
                    <strong className="font-mono text-slate-800">{formatCurrency(emi.financedAmount, preferences)}</strong>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-slate-100 py-1">
                    <span className="text-slate-450">Aggregate Reducing Interest:</span>
                    <strong className="font-mono text-rose-600 font-bold">+{formatCurrency(analysis.totalInterest, preferences)}</strong>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-slate-100 py-1">
                    <span className="text-slate-450">Aggregate Base Fees:</span>
                    <strong className="font-mono text-rose-500">
                      +{formatCurrency(emi.processingFee + (emi.conversionFee || 0) + emi.offerCharge, preferences)}
                    </strong>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-slate-100 py-1">
                    <span className="text-slate-450">Aggregate GST (18% on Int+Fees):</span>
                    <strong className="font-mono text-rose-500">
                      +{formatCurrency(
                        analysis.totalGstOnInterest + analysis.totalGstOnFees + (analysis.totalGstOnConversionFees || 0) + analysis.totalGstOnOfferCharges,
                        preferences
                      )}
                    </strong>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 mt-2 font-extrabold text-slate-800">
                    <span className="uppercase text-[10px] tracking-wide">Total Payable Liability:</span>
                    <span className="font-mono text-indigo-750 text-sm font-black">{formatCurrency(analysis.totalPayable, preferences)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50/30 p-3 rounded-xl border border-indigo-100/50 mt-4 text-[10px] space-y-1.5 leading-tight text-slate-500">
                <div className="flex items-center gap-1 text-indigo-800 font-bold uppercase tracking-wider">
                  <Info className="w-3.5 h-3.5" />
                  Payments Audit
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Settled To-date:</span>
                  <span className="font-mono text-emerald-650 font-black">{formatCurrency(analysis.totalPaid, preferences)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t border-slate-150/40 pt-1">
                  <span>O/S Remaining Liability:</span>
                  <span className="font-mono text-indigo-700 font-black">{formatCurrency(analysis.remainingPayable, preferences)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* CHRONOLOGICAL MONTHLY AMORTIZATION SCHEDULE TABLE */}
          <div className="space-y-3 text-left">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest pb-1 border-b border-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" /> Chronological Monthly Amortization Schedule
            </h3>
            
            <div className="overflow-x-auto rounded-2xl border border-slate-150 shadow-xs">
              <table className="w-full text-left text-xs text-slate-600 min-w-[850px] border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-black text-slate-450 uppercase tracking-wider">
                    <th className="py-3 px-4 text-center">Month</th>
                    <th className="py-3 px-2 cursor-pointer select-none hover:bg-slate-100 transition duration-150" onClick={() => handleSort('dueDate')}>
                      <div className="flex items-center gap-1">
                        Due Date {sortField === 'dueDate' ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
                      </div>
                    </th>
                    <th className="py-3 px-2 text-right cursor-pointer select-none hover:bg-slate-100 transition duration-150" onClick={() => handleSort('principal')}>
                      <div className="flex items-center gap-1 justify-end">
                        Principal component {sortField === 'principal' ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
                      </div>
                    </th>
                    <th className="py-3 px-2 text-right cursor-pointer select-none hover:bg-slate-100 transition duration-150" onClick={() => handleSort('interest')}>
                      <div className="flex items-center gap-1 justify-end">
                        Interest component {sortField === 'interest' ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
                      </div>
                    </th>
                    <th className="py-3 px-2 text-right cursor-pointer select-none hover:bg-slate-100 transition duration-150" onClick={() => handleSort('gstOnInterest')}>
                      <div className="flex items-center gap-1 justify-end">
                        GST on Interest {sortField === 'gstOnInterest' ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
                      </div>
                    </th>
                    <th className="py-3 px-2 text-right cursor-pointer select-none hover:bg-slate-100 transition duration-150" onClick={() => handleSort('fees')}>
                      <div className="flex items-center gap-1 justify-end">
                        Fees Added (Month 1) {sortField === 'fees' ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
                      </div>
                    </th>
                    <th className="py-3 px-2 text-right cursor-pointer select-none hover:bg-slate-100 transition duration-150" onClick={() => handleSort('gstOnFees')}>
                      <div className="flex items-center gap-1 justify-end">
                        GST on Fees {sortField === 'gstOnFees' ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
                      </div>
                    </th>
                    <th className="py-3 px-2 text-right cursor-pointer select-none hover:bg-slate-100 transition duration-150" onClick={() => handleSort('totalInstallmentAmount')}>
                      <div className="flex items-center gap-1 justify-end">
                        Net Billed dues {sortField === 'totalInstallmentAmount' ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
                      </div>
                    </th>
                    <th className="py-3 px-4 text-center">Installment status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {sortedInstallments.map((inst) => {
                    const feesSum = inst.processingFee + (inst.conversionFee || 0) + inst.offerCharge;
                    const gstFeesSum = inst.gstOnProcessingFee + (inst.gstOnConversionFee || 0) + inst.gstOnOfferCharge;
                    const isPaid = inst.paidStatus === 'paid';

                    return (
                      <tr key={inst.installmentNumber} className={`hover:bg-slate-50/50 transition-colors ${isPaid ? 'bg-emerald-50/20 text-slate-450 opacity-80' : 'text-slate-700'}`}>
                        {/* MONTH */}
                        <td className="py-3 px-4 text-center font-bold font-mono">
                          #{inst.installmentNumber}
                        </td>

                        {/* DUE DATE */}
                        <td className="py-3 px-2 font-mono text-[11px]">
                          {inst.dueDate}
                        </td>

                        {/* PRINCIPAL */}
                        <td className="py-3 px-2 text-right font-mono font-bold text-slate-800">
                          {formatCurrency(inst.principalComponent, preferences)}
                        </td>

                        {/* INTEREST */}
                        <td className="py-3 px-2 text-right font-mono text-rose-600">
                          {inst.interestComponent > 0 ? `+${formatCurrency(inst.interestComponent, preferences)}` : '—'}
                        </td>

                        {/* GST ON INTEREST */}
                        <td className="py-3 px-2 text-right font-mono text-amber-600">
                          {inst.gstOnInterest > 0 ? `+${formatCurrency(inst.gstOnInterest, preferences)}` : '—'}
                        </td>

                        {/* FEES */}
                        <td className="py-3 px-2 text-right font-mono text-rose-500">
                          {feesSum > 0 ? `+${formatCurrency(feesSum, preferences)}` : '—'}
                        </td>

                        {/* GST ON FEES */}
                        <td className="py-3 px-2 text-right font-mono text-amber-600">
                          {gstFeesSum > 0 ? `+${formatCurrency(gstFeesSum, preferences)}` : '—'}
                        </td>

                        {/* NET COMPONENT DU_PAYABLE_DUES */}
                        <td className="py-3 px-2 text-right font-mono font-black text-slate-900">
                          {formatCurrency(inst.totalInstallmentAmount, preferences)}
                        </td>

                        {/* PAID TOGGLE OPERATION */}
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => onToggleInstallment(inst.installmentNumber, inst.paidStatus)}
                            className={`py-1 px-2.5 rounded-lg text-[10px] font-black inline-flex items-center gap-1 cursor-pointer transition-all ${
                              isPaid 
                                ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' 
                                : 'bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-indigo-600 dark:text-indigo-400'
                            }`}
                          >
                            {isPaid ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Paid
                              </>
                            ) : (
                              <>
                                <RotateCcw className="w-3.5 h-3.5 text-indigo-500" />
                                Mark Paid
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-150 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 font-sans">
          <div className="text-[10px] text-slate-450 font-bold self-start sm:self-center leading-normal">
            * Blocked limit represents outstanding base principal on the card, and is released upon installment settlements. GST is applied at {emi.gstRate}% standard rates.
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
            {emi.status === 'active' && (
              <button
                onClick={() => {
                  if (confirm(`Proceed with CC EMI Pre-closure? This will settle all remaining installments and reduce outstanding liabilities to zero. This ledger update cannot be undone.`)) {
                    onPreClose();
                  }
                }}
                className="w-full sm:w-auto bg-rose-50 hover:bg-rose-100 border border-rose-150 text-rose-700 font-extrabold text-[11px] py-2.5 px-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Pre-Close Account Early
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-550 text-white font-extrabold text-[11px] px-5 py-2.5 rounded-xl transition cursor-pointer text-center"
            >
              Finished Audit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
