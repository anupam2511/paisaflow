/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CreditCardEmiMaster, CreditCardEmiInstallment } from '../types';

/**
 * Calculates the Financed Principal for a No-Cost EMI given the Original Purchase Amount,
 * Annual Interest Rate, and Tenure.
 *
 * Formula:
 * Monthly Base payment (M) = Original Price / Tenure
 * Financed Principal (Pf) = M * ((1+r)^Tenure - 1) / (r * (1+r)^Tenure)
 * where r = annualInterestRate / 12 / 100
 */
export function calculateNoCostFinancedPrincipal(
  originalAmount: number,
  annualInterestRate: number,
  tenure: number
): number {
  if (annualInterestRate <= 0 || tenure <= 0) {
    return originalAmount;
  }
  const r = (annualInterestRate / 12) / 100;
  const m = originalAmount / tenure;
  const power = Math.pow(1 + r, tenure);
  const financedPrincipal = m * (power - 1) / (r * power);
  return Math.round(financedPrincipal * 100) / 100;
}

interface GenerateScheduleParams {
  expenseName: string;
  cardId: string;
  originalAmount: number;
  emiType: 'no_cost' | 'regular';
  interestRate: number;
  tenure: number;
  merchantDiscount: number;
  processingFee: number;
  offerCharge: number;
  startDate: string; // YYYY-MM-DD
  gstRate?: number; // default 18
  autoCalculateDiscount?: boolean;
}

/**
 * Generates the Amortization Schedule and EMI Master record
 */
export function generateEmiSchedule(params: GenerateScheduleParams): CreditCardEmiMaster {
  const {
    expenseName,
    cardId,
    originalAmount,
    emiType,
    interestRate,
    tenure,
    processingFee = 0,
    offerCharge = 0,
    startDate,
    gstRate = 18,
    autoCalculateDiscount = false,
  } = params;

  let merchantDiscount = 0;
  let financedAmount = originalAmount;

  if (emiType === 'no_cost') {
    if (autoCalculateDiscount) {
      const Pf = calculateNoCostFinancedPrincipal(originalAmount, interestRate, tenure);
      merchantDiscount = Math.round((originalAmount - Pf) * 100) / 100;
      financedAmount = Pf;
    } else {
      merchantDiscount = params.merchantDiscount || 0;
      financedAmount = Math.round((originalAmount - merchantDiscount) * 100) / 100;
    }
  } else {
    // Regular EMI
    financedAmount = originalAmount;
    merchantDiscount = 0;
  }

  const r = (interestRate / 12) / 100;
  
  // Base Monthly Installment Amount (M) (excluding GST/charges)
  let baseMonthlyEmi = 0;
  if (r > 0) {
    const power = Math.pow(1 + r, tenure);
    baseMonthlyEmi = financedAmount * (r * power) / (power - 1);
  } else {
    baseMonthlyEmi = financedAmount / tenure;
  }
  baseMonthlyEmi = Math.round(baseMonthlyEmi * 100) / 100;

  const installments: CreditCardEmiInstallment[] = [];
  let remainingPrincipal = financedAmount;

  // Let's create dates starting from startDate
  const startYear = parseInt(startDate.substring(0, 4));
  const startMonth = parseInt(startDate.substring(5, 7)) - 1; // 0-indexed month
  const startDay = parseInt(startDate.substring(8, 10)) || 1;

  for (let t = 1; t <= tenure; t++) {
    // Due Date calculation (monthly progression)
    const dueDateObj = new Date(startYear, startMonth + (t - 1), startDay);
    
    // Format due date YYYY-MM-DD
    const pad = (n: number) => String(n).padStart(2, '0');
    const dueDateStr = `${dueDateObj.getFullYear()}-${pad(dueDateObj.getMonth() + 1)}-${pad(dueDateObj.getDate())}`;

    // Interest Component for this installment
    let interestComponent = 0;
    if (interestRate > 0) {
      interestComponent = remainingPrincipal * r;
    }
    interestComponent = Math.round(interestComponent * 100) / 100;

    // Principal Component for this installment
    let principalComponent = 0;
    if (t === tenure) {
      // Last installment adjusts for minor rounding errors
      principalComponent = Math.round(remainingPrincipal * 100) / 100;
      // Recalculate interest to fit the baseMonthlyEmi, or keep it exact based on remaining balance
      interestComponent = Math.max(0, Math.round((baseMonthlyEmi - principalComponent) * 100) / 100);
    } else {
      principalComponent = Math.round((baseMonthlyEmi - interestComponent) * 100) / 100;
    }

    const gstOnInterest = Math.round((interestComponent * (gstRate / 100)) * 100) / 100;

    // First installment other charges
    const currentProcessingFee = t === 1 ? processingFee : 0;
    const gstOnProcessingFee = Math.round((currentProcessingFee * (gstRate / 100)) * 100) / 100;

    const currentOfferCharge = t === 1 ? offerCharge : 0;
    const gstOnOfferCharge = Math.round((currentOfferCharge * (gstRate / 100)) * 100) / 100;

    const totalInstallmentAmount = Math.round(
      (principalComponent +
        interestComponent +
        gstOnInterest +
        currentProcessingFee +
        gstOnProcessingFee +
        currentOfferCharge +
        gstOnOfferCharge) *
        100
    ) / 100;

    installments.push({
      installmentNumber: t,
      dueDate: dueDateStr,
      principalComponent,
      interestComponent,
      gstOnInterest,
      processingFee: currentProcessingFee,
      gstOnProcessingFee,
      offerCharge: currentOfferCharge,
      gstOnOfferCharge,
      totalInstallmentAmount,
      paidStatus: 'unpaid',
    });

    remainingPrincipal -= principalComponent;
  }

  return {
    id: `cc-emi-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    expenseName,
    cardId,
    originalAmount,
    financedAmount,
    emiType,
    interestRate,
    tenure,
    merchantDiscount,
    processingFee,
    offerCharge,
    gstRate,
    startDate,
    outstandingPrincipal: financedAmount,
    status: 'active',
    installments,
  };
}

/**
 * Computes cost analysis summaries for an EMI Master
 */
export interface EmiCostSummary {
  originalAmount: number;
  totalInterest: number;
  totalGstOnInterest: number;
  totalProcessingFees: number;
  totalGstOnFees: number;
  totalOfferCharges: number;
  totalGstOnOfferCharges: number;
  totalPaid: number;
  totalPayable: number;
  remainingInterest: number;
  remainingGst: number;
  remainingPayable: number;
}

export function analyzeEmiCost(emi: CreditCardEmiMaster): EmiCostSummary {
  const sum = (arr: number[]) => Math.round(arr.reduce((a, b) => a + b, 0) * 100) / 100;

  const totalInterest = sum(emi.installments.map(inst => inst.interestComponent));
  const totalGstOnInterest = sum(emi.installments.map(inst => inst.gstOnInterest));
  
  const totalProcessingFees = sum(emi.installments.map(inst => inst.processingFee));
  const totalGstOnFees = sum(emi.installments.map(inst => inst.gstOnProcessingFee));

  const totalOfferCharges = sum(emi.installments.map(inst => inst.offerCharge));
  const totalGstOnOfferCharges = sum(emi.installments.map(inst => inst.gstOnOfferCharge));

  const totalPayable = sum(emi.installments.map(inst => inst.totalInstallmentAmount));

  // Paid items
  const paidInstallments = emi.installments.filter(inst => inst.paidStatus === 'paid');
  const totalPaid = sum(paidInstallments.map(inst => inst.totalInstallmentAmount));

  // Remaining items
  const unpaidInstallments = emi.installments.filter(inst => inst.paidStatus === 'unpaid');
  const remainingInterest = sum(unpaidInstallments.map(inst => inst.interestComponent));
  
  const remainingGst = sum(
    unpaidInstallments.map(inst => inst.gstOnInterest + inst.gstOnProcessingFee + inst.gstOnOfferCharge)
  );
  
  const remainingPayable = sum(unpaidInstallments.map(inst => inst.totalInstallmentAmount));

  return {
    originalAmount: emi.originalAmount,
    totalInterest,
    totalGstOnInterest,
    totalProcessingFees,
    totalGstOnFees,
    totalOfferCharges,
    totalGstOnOfferCharges,
    totalPaid,
    totalPayable,
    remainingInterest,
    remainingGst,
    remainingPayable,
  };
}
