/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React from 'react';
import { CreditCardEmiMaster, CreditCardEmiInstallment, Preferences } from '../types';
import { formatCurrency } from '../utils/formatters';
import { analyzeEmiCost } from '../utils/emiCalculations';
import { 
  X, 
  Calendar, 
  Clock, 
  Percent, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  DollarSign, 
  Receipt,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';

interface CcEmiDetailsModalProps {
  emi: CreditCardEmiMaster;
  preferences: Preferences;
  onClose: () => void;
  onToggleInstallment: (installmentNum: number, currentStatus: 'paid' | 'unpaid') => void;
  onPreClose: () => void;
}

export default function CcEmiDetailsModal({
  emi,
  preferences,
  onClose,
  onToggleInstallment,
  onPreClose,
}: CcEmiDetailsModalProps) {
  const analysis = analyzeEmiCost(emi);

  // Installments list
  const installments = emi.installments || [];
  const paidCount = installments.filter(inst => inst.paidStatus === 'paid').length;
  const progressPercent = Math.round((paidCount / emi.tenure) * 100);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
        
        {/* HEADER BAR */}
        <div className="sticky top-0 bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <div className="text-left">
            <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
              Amortization & Costs Analyzer
            </span>
            <h2 className="text-base font-black text-slate-800 flex items-center gap-1.5 mt-1">
              {emi.expenseName}
              <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${emi.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-550'}`}>
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
          
          {/* ANALYTICS BLOCK: BENTO GRID STYLE */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
            
            {/* ORIGINAL COST CARD */}
            <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-100 flex flex-col justify-between">
              <div>
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">Original Principal</span>
                <h4 className="text-xs font-bold text-slate-700 mt-1">Product Invoice Cost</h4>
              </div>
              <p className="text-xl font-black text-slate-800 font-mono mt-3">
                {formatCurrency(emi.originalAmount, preferences)}
              </p>
            </div>

            {/* INTEREST & FEES CARD */}
            <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-100 flex flex-col justify-between">
              <div>
                <span className="text-[9px] text-rose-500 font-extrabold uppercase tracking-wide">Charges & Interests</span>
                <h4 className="text-xs font-bold text-slate-700 mt-1">Total Bank Costs</h4>
              </div>
              <div>
                <p className="text-xl font-black text-rose-600 font-mono mt-3">
                  {formatCurrency(analysis.totalInterest + analysis.totalProcessingFees + analysis.totalOfferCharges, preferences)}
                </p>
                <div className="text-[9px] text-slate-400 font-medium mt-1 leading-tight">
                  Int: {formatCurrency(analysis.totalInterest, preferences)} | Fees: {formatCurrency(analysis.totalProcessingFees, preferences)}
                </div>
              </div>
            </div>

            {/* GST ACCUMULATED CARD */}
            <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-100 flex flex-col justify-between">
              <div>
                <span className="text-[9px] text-amber-600 font-extrabold uppercase tracking-wide">GST Tax components</span>
                <h4 className="text-xs font-bold text-slate-700 mt-1">GST @{emi.gstRate}% Charged</h4>
              </div>
              <div>
                <p className="text-xl font-black text-amber-600 font-mono mt-3">
                  {formatCurrency(analysis.totalGstOnInterest + analysis.totalGstOnFees + analysis.totalGstOnOfferCharges, preferences)}
                </p>
                <span className="text-[9px] text-slate-400 font-medium tracking-wide">18% on Interest + Fees</span>
              </div>
            </div>

            {/* NET OUTFLOW PAYABLE CARD */}
            <div className="bg-indigo-950 text-white p-4.5 rounded-2xl flex flex-col justify-between shadow-xs">
              <div>
                <span className="text-[9px] text-indigo-300 font-extrabold uppercase tracking-wide">Net Final Cost</span>
                <h4 className="text-xs font-bold text-indigo-100 mt-1">Total Payable Amount</h4>
              </div>
              <div>
                <p className="text-xl font-black font-mono">
                  {formatCurrency(analysis.totalPayable, preferences)}
                </p>
                {emi.emiType === 'no_cost' && (
                  <span className="text-[8.5px] text-teal-350 font-bold mt-1 block tracking-wide">
                    🎉 Save {formatCurrency(emi.merchantDiscount, preferences)} interest up-front!
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ACTIVE PROGRESS BAR */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-left flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                <span>Tenure Payments Progress ({paidCount} of {emi.tenure} complete)</span>
                <span className="font-mono">{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="h-2.5 rounded-full bg-indigo-650 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            {emi.status === 'active' && (
              <button
                onClick={() => {
                  if (confirm("Proceed with EMI Preclosure? This will settle all remaining installments and reduce outstanding liabilities to zero. This ledger update cannot be undone.")) {
                    onPreClose();
                  }
                }}
                className="bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-700 font-bold text-xs py-2.5 px-4 rounded-xl transition shrink-0 cursor-pointer text-center flex items-center gap-1.5 justify-center"
              >
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Pre-Close Account Early
              </button>
            )}
          </div>

          {/* COST METRICS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-1.5 pb-1 border-b border-slate-100">
                <Receipt className="w-4 h-4 text-indigo-500" /> Cost Summary Analysis
              </h3>
              <table className="w-full text-xs text-slate-600 space-y-2.5">
                <tbody>
                  <tr className="flex justify-between py-1.5 border-b border-dashed border-slate-105">
                    <span className="font-medium text-slate-500">Invoice Original Price:</span>
                    <strong className="font-mono text-slate-800 font-bold">{formatCurrency(emi.originalAmount, preferences)}</strong>
                  </tr>
                  {emi.emiType === 'no_cost' && (
                    <>
                      <tr className="flex justify-between py-1.5 border-b border-dashed border-slate-105">
                        <span className="font-extrabold text-teal-650">Merchant Discount (Interest Subsidy):</span>
                        <strong className="font-mono text-teal-600 font-black">-{formatCurrency(emi.merchantDiscount, preferences)}</strong>
                      </tr>
                      <tr className="flex justify-between py-1.5 border-b border-dashed border-slate-105">
                        <span className="font-bold text-slate-600">Financed Principal Blocked:</span>
                        <strong className="font-mono text-slate-800 font-bold">{formatCurrency(emi.financedAmount, preferences)}</strong>
                      </tr>
                    </>
                  )}
                  <tr className="flex justify-between py-1.5 border-b border-dashed border-slate-105">
                    <span className="font-medium text-slate-505">Accumulated reducing Interest:</span>
                    <strong className="font-mono text-rose-600 font-bold">+{formatCurrency(analysis.totalInterest, preferences)}</strong>
                  </tr>
                  <tr className="flex justify-between py-1.5 border-b border-dashed border-slate-105">
                    <span className="font-medium text-slate-505">Processing Fees (1st Month):</span>
                    <strong className="font-mono text-rose-600 font-bold">+{formatCurrency(analysis.totalProcessingFees, preferences)}</strong>
                  </tr>
                  <tr className="flex justify-between py-1.5 border-b border-dashed border-slate-105">
                    <span className="font-medium text-slate-505">GST on Interest Charges:</span>
                    <strong className="font-mono text-rose-500 font-semibold">+{formatCurrency(analysis.totalGstOnInterest, preferences)}</strong>
                  </tr>
                  <tr className="flex justify-between py-1.5 border-b border-dashed border-slate-105">
                    <span className="font-medium text-slate-505">GST on Processing Fees & Offer Charges:</span>
                    <strong className="font-mono text-rose-500 font-semibold">+{formatCurrency(analysis.totalGstOnFees + analysis.totalGstOnOfferCharges, preferences)}</strong>
                  </tr>
                  <tr className="flex justify-between py-2 border-t border-slate-200 mt-2">
                    <span className="font-black text-slate-850 uppercase text-[11px]">Final Payable Outflow:</span>
                    <strong className="font-mono text-indigo-700 font-extrabold text-sm">{formatCurrency(analysis.totalPayable, preferences)}</strong>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* EXPLANATORY ALERT BOX */}
            <div className="bg-indigo-50/30 border border-indigo-100 rounded-2xl p-5 flex flex-col justify-between">
              <div className="space-y-3.5">
                <span className="text-[10px] font-black text-indigo-700 uppercase bg-indigo-100/50 px-2.5 py-0.5 rounded w-fit block">
                  How No-Cost EMI Works Mathematically
                </span>
                <p className="text-[11.5px] text-slate-600 leading-relaxed font-medium">
                  The merchant values a checkout offer where the upfront <strong>Merchant Discount</strong> ({formatCurrency(emi.merchantDiscount, preferences)}) equals your cumulative reducing bank interest.
                </p>
                <p className="text-[11.5px] text-slate-600 leading-relaxed font-semibold">
                  Although the bank charges reducing interest of <strong>{emi.interestRate}% APR</strong> on the financed balance of <strong>{formatCurrency(emi.financedAmount, preferences)}</strong>, the pre-discount perfectly offsets this, keeping base principal payments equal to the original product cost.
                </p>
                <div className="bg-white/70 rounded-xl p-3 border border-indigo-50/60 text-[10px] text-slate-450 space-y-1">
                  <strong>Notes on applicable elements:</strong>
                  <li>18% GST applies strictly onto interest segments monthly.</li>
                  <li>Processing Fees + 18% GST are billed purely in installment #1.</li>
                </div>
              </div>
              <div className="text-[10px] text-indigo-650 font-bold bg-white p-2.5 rounded-xl border border-indigo-50 mt-4">
                Remaining outstanding liability: <span className="font-mono font-black text-xs text-indigo-700">{formatCurrency(analysis.remainingPayable, preferences)}</span>
              </div>
            </div>
          </div>

          {/* AMORTIZATION TABULAR BREAKOUT */}
          <div className="space-y-3 text-left">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest pb-1.5 border-b border-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" /> Chronological Monthly Amortization Schedule
            </h3>
            
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left text-xs text-slate-600 min-w-[750px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4 text-center">Inst</th>
                    <th className="py-3 px-2">Due Date</th>
                    <th className="py-3 px-2 text-right">Principal component</th>
                    <th className="py-3 px-2 text-right">Interest component</th>
                    <th className="py-3 px-2 text-right">GST on Interest</th>
                    <th className="py-3 px-2 text-right">Fees & GST</th>
                    <th className="py-3 px-2 text-right">Net Payable dues</th>
                    <th className="py-3 px-4 text-center">Installment status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {installments.map((inst) => {
                    const feesSum = inst.processingFee + inst.offerCharge;
                    const gstFeesSum = inst.gstOnProcessingFee + inst.gstOnOfferCharge;
                    const combinedFeesDues = feesSum + gstFeesSum;

                    const isPaid = inst.paidStatus === 'paid';

                    return (
                      <tr key={inst.installmentNumber} className={`hover:bg-slate-50/50 ${isPaid ? 'bg-emerald-50/20 text-slate-500 opacity-80' : 'text-slate-700'}`}>
                        {/* NUMBER */}
                        <td className="py-3.5 px-4 text-center font-bold font-mono">
                          #{inst.installmentNumber}
                        </td>

                        {/* DUE DATE */}
                        <td className="py-3.5 px-2 font-mono">
                          {inst.dueDate}
                        </td>

                        {/* PRINCIPAL COMPONENT */}
                        <td className="py-3.5 px-2 text-right font-mono font-bold text-slate-800">
                          {formatCurrency(inst.principalComponent, preferences)}
                        </td>

                        {/* INTEREST COMPONENT */}
                        <td className="py-3.5 px-2 text-right font-mono text-rose-600">
                          {inst.interestComponent > 0 ? `+${formatCurrency(inst.interestComponent, preferences)}` : '—'}
                        </td>

                        {/* GST ON INTEREST */}
                        <td className="py-3.5 px-2 text-right font-mono text-amber-600">
                          {inst.gstOnInterest > 0 ? `+${formatCurrency(inst.gstOnInterest, preferences)}` : '—'}
                        </td>

                        {/* FEES & CHARGES */}
                        <td className="py-3.5 px-2 text-right font-mono text-rose-500">
                          {combinedFeesDues > 0 ? (
                            <div>
                              <span>+{formatCurrency(combinedFeesDues, preferences)}</span>
                              <span className="text-[8px] text-slate-400 block font-normal leading-none mt-0.5">
                                Fee: {formatCurrency(feesSum, preferences)} (GST incl)
                              </span>
                            </div>
                          ) : '—'}
                        </td>

                        {/* NET DU_PAYABLE_DUES */}
                        <td className="py-3.5 px-2 text-right font-mono font-black text-slate-900">
                          {formatCurrency(inst.totalInstallmentAmount, preferences)}
                        </td>

                        {/* PAID TOGGLE OPERATION */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => onToggleInstallment(inst.installmentNumber, inst.paidStatus)}
                            className={`py-1 px-2.5 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition-all ${
                              isPaid 
                                ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' 
                                : 'bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-indigo-650'
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

        {/* BOTTOM STATUS DETAILS ACTION BAR */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 font-sans">
          <div className="text-[11px] text-slate-500 font-bold self-start sm:self-center">
            * Marking installments as paid automatically adjusts outstanding liabilities and increments monthly billing footprints on the card.
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer"
          >
            Finished Audit
          </button>
        </div>
      </div>
    </div>
  );
}
