/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface EmiItem {
  id: string;
  name: string;             // e.g. "iPhone 15 Pro Max", "Home Loan Premium"
  amount: number;           // Monthly payment amount (e.g. ₹5,400)
  category: string;         // Spend Category (e.g. "Shopping", "Rent & Utilities")
  accountId: string;        // Connected Card or Bank Account ID
  totalTenure: number;      // Total number of months/installments (e.g. 12, 24, 120)
  installmentsPaid: number; // Number of payments already completed
  startDate: string;        // YYYY-MM-DD or YYYY-MM
  interestRate?: number;    // Interest Rate as a percentage (e.g. 12.5)
  isActive: boolean;
  notes?: string;
}

export interface CreditCardEmiInstallment {
  installmentNumber: number;
  dueDate: string; // YYYY-MM-DD
  principalComponent: number;
  interestComponent: number;
  gstOnInterest: number;
  processingFee: number;
  gstOnProcessingFee: number;
  conversionFee?: number;
  gstOnConversionFee?: number;
  offerCharge: number;
  gstOnOfferCharge: number;
  totalInstallmentAmount: number;
  paidStatus: 'paid' | 'unpaid';
}

export interface CreditCardEmiMaster {
  id: string;
  expenseName: string;
  cardId: string;
  category?: string; // links to a category budget e.g. Electronics, Shopping, etc.
  originalAmount: number;
  financedAmount: number;
  emiType: 'no_cost' | 'regular';
  interestRate: number;
  tenure: number;
  merchantDiscount: number;
  processingFee: number;
  conversionFee?: number;
  offerCharge: number;
  gstRate: number; // e.g. 18
  startDate: string; // YYYY-MM-DD
  purchaseDate?: string; // YYYY-MM-DD
  outstandingPrincipal: number;
  status: 'active' | 'closed' | 'pre_closed';
  installments: CreditCardEmiInstallment[];
  notes?: string;
  convertedFromExpenseId?: string; // ID of the original transaction in the expense ledger, if converted from one
}
