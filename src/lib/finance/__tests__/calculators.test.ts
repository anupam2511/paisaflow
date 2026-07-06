/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  calculateStandardEmi,
  calculateLoanForeclosure,
  getEmiItemSummary,
  calculateMonthlyLoanEmiOutflow,
  calculateTotalLoanEmiOutstanding,
  calculateTotalLoanEmiSunk
} from '../emiCalculator';
import {
  calculateNoCostFinancedPrincipal,
  generateEmiSchedule,
  analyzeEmiCost
} from '../noCostEmiCalculator';
import {
  calculateCardMetrics,
  calculateOverallMetrics
} from '../creditUtilization';
import {
  calculateMonthlyCashFlowSummary
} from '../cashFlowCalculator';
import {
  analyzeEmergencyFund
} from '../emergencyFundCalculator';
import {
  calculateGoalProgress,
  calculateDurationToGoal,
  getMonthsRemaining,
  getDaysRemaining
} from '../goalProjection';
import {
  calculateLumpsumFutureValue,
  calculateSipFutureValue,
  calculateCAGR,
  projectPortfolioGrowth
} from '../investmentReturns';
import {
  analyzeNetWorth
} from '../netWorthCalculator';
import {
  generateWealthProjection
} from '../wealthForecast';

describe('EMI Calculator (emiCalculator)', () => {
  it('should calculate standard EMI correctly for ₹1,00,000, 12% annual interest, 12 months', () => {
    // Principal: 100,000, Interest: 12%, Tenure: 12 months
    const emi = calculateStandardEmi(100000, 12, 12);
    // Standard EMI formula value is exactly 8884.88
    expect(emi).toBeCloseTo(8884.88, 2);
  });

  it('should handle 0% interest on standard EMI', () => {
    const emi = calculateStandardEmi(120000, 0, 12);
    expect(emi).toBe(10000); // 120000 / 12 = 10000
  });

  it('should handle 1-month EMI tenure', () => {
    const emi = calculateStandardEmi(100000, 12, 1);
    expect(emi).toBe(101000); // 100000 + 1% monthly interest (1000) = 101000
  });

  it('should calculate foreclosure breakdown correctly with penalty and GST', () => {
    // Foreclosure: 50,000 outstanding, 3% penalty fee, 18% GST on penalty fee
    const foreclosure = calculateLoanForeclosure(50000, 3, 18);
    expect(foreclosure.outstandingPrincipal).toBe(50000);
    expect(foreclosure.penaltyAmount).toBe(1500); // 3% of 50000
    expect(foreclosure.gstOnPenalty).toBe(270); // 18% of 1500
    expect(foreclosure.totalForeclosureCharge).toBe(51770); // 50000 + 1500 + 270
  });

  it('should calculate EmiItemSummary, monthly loan outflow, total outstanding, and sunk costs', () => {
    const mockEmis = [
      {
        id: 'emi1',
        name: 'Car Loan',
        amount: 5000,
        totalTenure: 12,
        installmentsPaid: 4,
        isActive: true
      },
      {
        id: 'emi2',
        name: 'Home Loan',
        amount: 20000,
        totalTenure: 240,
        installmentsPaid: 10,
        isActive: false // inactive
      }
    ] as any;

    const summary = getEmiItemSummary(mockEmis[0]);
    expect(summary.progressPercentage).toBe(33); // Math.round((4/12)*100) = 33
    expect(summary.remainingTenure).toBe(8);
    expect(summary.sunkCost).toBe(20000);
    expect(summary.outstandingBalance).toBe(40000);

    const monthlyOutflow = calculateMonthlyLoanEmiOutflow(mockEmis);
    expect(monthlyOutflow).toBe(5000); // Only active EMI1

    const totalOutstanding = calculateTotalLoanEmiOutstanding(mockEmis);
    expect(totalOutstanding).toBe(40000); // Only active outstanding (5000 * 8)

    const totalSunk = calculateTotalLoanEmiSunk(mockEmis);
    expect(totalSunk).toBe(220000); // Includes all (5000*4 + 20000*10 = 220000)
  });
});

describe('No-Cost EMI Calculator (noCostEmiCalculator)', () => {
  it('should calculate financed principal correctly (no-cost EMI discount)', () => {
    // Original amount: 1,00,000, 12% interest, 12 months
    const principal = calculateNoCostFinancedPrincipal(100000, 12, 12);
    // 12 payments of 8333.33 discounted by 1% monthly interest (12% annual / 12 months)
    expect(principal).toBeCloseTo(93792.31, 2);
  });

  it('should generate EMI schedule with processing fees and GST correctly', () => {
    const params = {
      expenseName: 'iPhone 15 Pro',
      cardId: 'card1',
      originalAmount: 100000,
      emiType: 'no_cost' as const,
      interestRate: 12,
      tenure: 12,
      merchantDiscount: 6209.38,
      processingFee: 199,
      offerCharge: 0,
      startDate: '2026-07-01',
      gstRate: 18,
      autoCalculateDiscount: false
    };

    const schedule = generateEmiSchedule(params as any);
    expect(schedule.financedAmount).toBe(93790.62); // 100000 - 6209.38
    expect(schedule.installments.length).toBe(12);

    // First installment should have processing fee and GST on it
    const firstInst = schedule.installments[0];
    expect(firstInst.processingFee).toBe(199);
    expect(firstInst.gstOnProcessingFee).toBe(35.82); // 18% of 199

    const analysis = analyzeEmiCost(schedule);
    expect(analysis.totalProcessingFees).toBe(199);
    expect(analysis.totalGstOnFees).toBe(35.82);
  });

  it('should handle 0% interest and zero fees/offer charges in No-Cost EMI', () => {
    const params = {
      expenseName: 'Zero Interest TV',
      cardId: 'card1',
      originalAmount: 12000,
      emiType: 'no_cost' as const,
      interestRate: 0,
      tenure: 12,
      merchantDiscount: 0,
      processingFee: 0,
      offerCharge: 0,
      startDate: '2026-07-01',
      gstRate: 18,
      autoCalculateDiscount: true
    };

    const schedule = generateEmiSchedule(params as any);
    expect(schedule.financedAmount).toBe(12000);
    expect(schedule.installments[0].interestComponent).toBe(0);
    expect(schedule.installments[0].gstOnInterest).toBe(0);
  });
});

describe('Credit Utilization Calculator (creditUtilization)', () => {
  const mockCard = {
    id: 'card-1',
    name: 'Rewards Visa',
    type: 'credit_card' as const,
    institution: 'HDFC',
    balance: 10000,
    limit: 50000,
    color: '#000',
    billingCycleStartDay: 15,
  };

  it('should calculate utilization percent and metrics correctly under normal usage', () => {
    const metrics = calculateCardMetrics({
      card: mockCard as any,
      creditCards: [mockCard] as any,
      transactions: [],
      ccEmis: []
    });

    expect(metrics.creditLimit).toBe(50000);
    expect(metrics.utilized).toBe(10000);
    expect(metrics.available).toBe(40000);
    expect(metrics.utilizationPercent).toBe(20); // (10000/50000) * 100
  });

  it('should handle zero credit limit gracefully without dividing by zero', () => {
    const zeroLimitCard = { ...mockCard, limit: 0 };
    const metrics = calculateCardMetrics({
      card: zeroLimitCard as any,
      creditCards: [zeroLimitCard] as any,
      transactions: [],
      ccEmis: []
    });

    expect(metrics.creditLimit).toBe(0);
    expect(metrics.utilizationPercent).toBe(0);
  });

  it('should handle over-limit credit card gracefully without breaking', () => {
    const overLimitCard = { ...mockCard, balance: 60000, limit: 50000 };
    const metrics = calculateCardMetrics({
      card: overLimitCard as any,
      creditCards: [overLimitCard] as any,
      transactions: [],
      ccEmis: []
    });

    // utilization percentage is capped at 100% in returned structure
    expect(metrics.utilizationPercent).toBe(100);
    expect(metrics.utilized).toBe(60000);
    expect(metrics.available).toBe(0); // Math.max(0, limit - utilized)
  });

  it('should calculate overall metrics across multiple cards', () => {
    const mockCards = [
      {
        id: 'card-1',
        name: 'Rewards Visa',
        type: 'credit_card' as const,
        institution: 'HDFC',
        balance: 10000,
        limit: 50000,
        color: '#000',
      },
      {
        id: 'card-2',
        name: 'Cashback Mastercard',
        type: 'credit_card' as const,
        institution: 'ICICI',
        balance: 20000,
        limit: 100000,
        color: '#fff',
      }
    ];

    const overall = calculateOverallMetrics({
      creditCards: mockCards as any,
      transactions: [],
      ccEmis: []
    });

    expect(overall.totalLimit).toBe(150000);
    expect(overall.totalUtilized).toBe(30000);
    expect(overall.overallPercent).toBe(20); // (30000/150000)*100
  });
});

describe('Cash Flow Calculator (cashFlowCalculator)', () => {
  it('should evaluate net monthly cash flow, incomes, investments, and savings rates', () => {
    const incomes = [
      { id: 'i1', source: 'Salary', amount: 150000, frequency: 'monthly' as const, date: '2026-07-01' },
      { id: 'i2', source: 'Freelance', amount: 50000, frequency: 'monthly' as const, date: '2026-07-01' }
    ];
    const recurringSpends = [
      { id: 's1', name: 'Netflix', amount: 799, isActive: true, category: 'Entertainment', accountId: 'a1', billingCycle: 'monthly' as const, billingDay: 1, nextBillingDate: '2026-08-01' },
      { id: 's2', name: 'Spotify', amount: 119, isActive: false, category: 'Entertainment', accountId: 'a1', billingCycle: 'monthly' as const, billingDay: 1, nextBillingDate: '2026-08-01' }
    ];
    const emis = [
      { id: 'e1', name: 'Car', amount: 15000, totalTenure: 12, installmentsPaid: 2, isActive: true, category: 'Auto', accountId: 'a1', startDate: '2026-05-01' }
    ];
    const investments = [
      {
        id: 'v1',
        name: 'Mutual Fund SIP',
        amount: 20000,
        frequency: 'monthly' as const,
        investmentType: 'sip' as const,
        type: 'Mutual Funds',
        totalInvested: 20000,
        date: '2026-07-01',
        hasEndDate: false,
        startDate: '2026-01-01',
        accountId: 'a1'
      }
    ];

    const summary = calculateMonthlyCashFlowSummary({
      incomes: incomes as any,
      recurringSpends: recurringSpends as any,
      emis: emis as any,
      investments: investments as any,
      averageVariableExpenses: 30000
    });

    expect(summary.totalInflow).toBe(200000);
    // Outflows: 799 (sub) + 15000 (emi) + 20000 (SIP) + 30000 (variable) = 65799
    expect(summary.totalOutflow).toBe(65799);
    expect(summary.netSurplus).toBe(134201);
    expect(summary.savingsRate).toBeCloseTo((134201 / 200000) * 100, 2);
  });

  it('should handle negative cash flow edge cases', () => {
    const incomes = [
      { id: 'i1', source: 'Part-time', amount: 20000, frequency: 'monthly' as const, date: '2026-07-01' }
    ];
    const recurringSpends = [
      { id: 's1', name: 'Rent', amount: 25000, isActive: true, category: 'Housing', accountId: 'a1', billingCycle: 'monthly' as const, billingDay: 1, nextBillingDate: '2026-08-01' }
    ];

    const summary = calculateMonthlyCashFlowSummary({
      incomes: incomes as any,
      recurringSpends: recurringSpends as any,
      emis: [],
      investments: [],
      averageVariableExpenses: 10000
    });

    expect(summary.netSurplus).toBe(-15000); // 20000 - 35000 = -15000
    expect(summary.savingsRate).toBeLessThan(0);
  });

  it('should handle no investments case gracefully', () => {
    const summary = calculateMonthlyCashFlowSummary({
      incomes: [{ id: 'i1', source: 'Salary', amount: 100000, frequency: 'monthly' as const, date: '2026-07-01' }] as any,
      recurringSpends: [],
      emis: [],
      investments: [],
      averageVariableExpenses: 20000
    });

    expect(summary.totalOutflow).toBe(20000);
    expect(summary.netSurplus).toBe(80000);
    expect(summary.savingsRate).toBe(80);
  });
});

describe('Emergency Fund Calculator (emergencyFundCalculator)', () => {
  it('should analyze emergency fund progress, buffer targets, and safety status', () => {
    const accounts = [
      { id: 'a1', name: 'Savings Account', type: 'bank' as const, balance: 150000, institution: 'HDFC', color: '#000' }
    ];
    const expenses = [
      { id: 'e1', amount: 30000, description: 'Groceries', category: 'Food', date: '2026-07-01', accountId: 'a1', isRecurring: false }
    ];
    const recurringSpends = [
      { id: 's1', name: 'Gym', amount: 2000, isActive: true, category: 'Health', accountId: 'a1', billingCycle: 'monthly' as const, billingDay: 1, nextBillingDate: '2026-08-01' }
    ];
    const emis = [
      { id: 'm1', name: 'EMI', amount: 8000, totalTenure: 12, installmentsPaid: 5, isActive: true, category: 'Loan', accountId: 'a1', startDate: '2026-01-01' }
    ];

    const analysis = analyzeEmergencyFund({
      accounts: accounts as any,
      expenses: expenses as any,
      recurringSpends: recurringSpends as any,
      emis: emis as any,
      coverageMultiplier: 6,
      customAuxiliary: 10000
    });

    // baseMonthlyExpenses calculation: 30000 / 3 = 10000
    // baseSubscriptions = 2000
    // baseEmis = 8000
    // monthlyOutflowEssentials = 10000 + 2000 + 8000 = 20000
    expect(analysis.monthlyOutflowEssentials).toBe(20000);
    expect(analysis.targetBuffer).toBe(20000 * 6 + 10000); // 130000
    expect(analysis.progressPercent).toBe(100); // balance (150000) >= buffer (130000)
    expect(analysis.remainingDeficit).toBe(0);
    expect(analysis.monthsCoveredEstimate).toBe(7.5); // 150000 / 20000 = 7.5
    expect(analysis.safetyStatus).toBe('healthy');
  });

  it('should handle critical safety status with insufficient emergency funds', () => {
    const accounts = [
      { id: 'a1', name: 'Savings', type: 'bank' as const, balance: 10000, institution: 'SBI', color: '#000' }
    ];

    const analysis = analyzeEmergencyFund({
      accounts: accounts as any,
      expenses: [],
      recurringSpends: [],
      emis: [],
      coverageMultiplier: 6,
      customAuxiliary: 0
    });

    // Falls back to essential baseline of 25000 when expenses are empty
    expect(analysis.monthlyOutflowEssentials).toBe(25000);
    expect(analysis.monthsCoveredEstimate).toBe(0.4); // 10000 / 25000 = 0.4
    expect(analysis.safetyStatus).toBe('critical');
  });
});

describe('Goal Projection Calculator (goalProjection)', () => {
  it('should calculate days and months remaining until target date', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 90); // 90 days in future
    const dateStr = futureDate.toISOString().substring(0, 10);

    const days = getDaysRemaining(dateStr);
    expect(days).toBe(90);

    const months = getMonthsRemaining(dateStr);
    expect(months).toBe(3); // Math.ceil(90 / 30.437) = 3
  });

  it('should handle goal dates that have already passed gracefully', () => {
    const pastDateStr = '2020-01-01';
    const days = getDaysRemaining(pastDateStr);
    expect(days).toBe(0);

    const months = getMonthsRemaining(pastDateStr);
    expect(months).toBe(1); // falls back to min 1 month to prevent division by zero
  });

  it('should calculate goal progress metrics and monthly contribution required', () => {
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 10);
    const targetDateStr = futureDate.toISOString().substring(0, 10);

    const mockGoal = {
      id: 'g1',
      name: 'House Downpayment',
      targetAmount: 500000,
      currentAmount: 100000,
      targetDate: targetDateStr,
      goalType: 'flexible' as const,
      color: '#000',
      category: 'Property'
    };

    const progress = calculateGoalProgress(mockGoal as any);
    expect(progress.targetAmount).toBe(500000);
    expect(progress.savedAmount).toBe(100000);
    expect(progress.remainingToSave).toBe(400000);
    expect(progress.progressPercent).toBe(20);
    expect(progress.monthsRemaining).toBeGreaterThanOrEqual(9);
    expect(progress.monthlyContributionRequired).toBeCloseTo(400000 / progress.monthsRemaining, 0);
  });

  it('should calculate exact duration to goal under linear and compounded models', () => {
    // Linear model (0% return rate)
    const linear = calculateDurationToGoal({
      currentAmount: 10000,
      targetAmount: 50000,
      monthlyContribution: 2000,
      annualReturnRate: 0
    });
    expect(linear.monthsRequired).toBe(20); // (50000 - 10000) / 2000 = 20

    // Compounded model (12% returns)
    const compounded = calculateDurationToGoal({
      currentAmount: 10000,
      targetAmount: 50000,
      monthlyContribution: 2000,
      annualReturnRate: 12
    });
    expect(compounded.monthsRequired).toBeLessThan(20); // compounding accelerates savings
  });

  it('should handle zero monthly contribution edge case gracefully to avoid infinite loops', () => {
    const duration = calculateDurationToGoal({
      currentAmount: 10000,
      targetAmount: 50000,
      monthlyContribution: 0,
      annualReturnRate: 12
    });

    expect(duration.monthsRequired).toBe(Infinity);
    expect(duration.yearsRequired).toBe(Infinity);
  });
});

describe('Investment Returns Calculator (investmentReturns)', () => {
  it('should calculate lumpsum future value correctly', () => {
    // FV = 10000 * (1 + 0.12)^5 = 17623.42
    const fv = calculateLumpsumFutureValue(10000, 12, 5);
    expect(fv).toBeCloseTo(17623.42, 2);
  });

  it('should calculate SIP future value correctly', () => {
    // SIP = 5000 monthly, 12% annual, 36 months (3 years)
    const fv = calculateSipFutureValue(5000, 12, 36);
    expect(fv).toBeCloseTo(217538.24, 2);
  });

  it('should calculate CAGR correctly', () => {
    const cagr = calculateCAGR(10000, 15000, 3);
    expect(cagr).toBeCloseTo(14.47, 1);
  });

  it('should compile year-by-year growth table for a mixed portfolio', () => {
    const projection = projectPortfolioGrowth({
      initialLumpsum: 10000,
      monthlySip: 1000,
      annualReturnRate: 12,
      years: 5
    });

    expect(projection.length).toBe(5);
    expect(projection[0].year).toBe(1);
    expect(projection[4].year).toBe(5);
    expect(projection[0].investedCapital).toBe(22000); // 10000 + 12000
    expect(projection[0].totalValuation).toBeGreaterThan(22000);
  });

  it('should handle no investments (zero SIP and lumpsum) correctly', () => {
    const fvLumpsum = calculateLumpsumFutureValue(0, 12, 5);
    expect(fvLumpsum).toBe(0);

    const fvSip = calculateSipFutureValue(0, 12, 12);
    expect(fvSip).toBe(0);
  });
});

describe('Net Worth Calculator (netWorthCalculator)', () => {
  it('should perform a comprehensive net worth analysis across assets and liabilities', () => {
    const categories = [
      { key: 'bank_accounts', label: 'Bank', isManual: false, manualValue: 0 },
      { key: 'cash', label: 'Cash', isManual: true, manualValue: 5000 },
      { key: 'mutual_funds', label: 'Mutual Funds', isManual: false, manualValue: 0 },
      { key: 'credit_cards', label: 'Credit Cards', isManual: false, manualValue: 0 },
      { key: 'loans', label: 'Loans', isManual: false, manualValue: 0 }
    ];

    const accounts = [
      { id: 'a1', name: 'HDFC', type: 'bank' as const, balance: 100000, institution: 'HDFC', color: '#000' },
      { id: 'a2', name: 'Amazon Pay', type: 'credit_card' as const, balance: 15000, limit: 100000, institution: 'ICICI', color: '#000' }
    ];

    const investments = [
      {
        id: 'v1',
        name: 'Quant Active',
        amount: 50000,
        frequency: 'monthly' as const,
        investmentType: 'sip' as const,
        type: 'Mutual Funds',
        totalInvested: 50000,
        date: '2026-07-01',
        hasEndDate: false,
        startDate: '2026-01-01',
        accountId: 'a1'
      }
    ];

    const emis = [
      { id: 'e1', name: 'Personal Loan', amount: 10000, totalTenure: 12, installmentsPaid: 6, isActive: true, category: 'Personal', accountId: 'a1', startDate: '2026-01-01' }
    ];

    const analysis = analyzeNetWorth({
      categories,
      accounts: accounts as any,
      investments: investments as any,
      ccEmis: [],
      emis: emis as any
    });

    expect(analysis.totalAssetsValue).toBe(155000); // bank(100000) + cash(5000) + mutual_funds(50000)
    expect(analysis.totalLiabilitiesValue).toBe(75000); // credit_cards(15000) + loans(10000 * 6 = 60000)
    expect(analysis.currentNetWorth).toBe(80000);
    expect(analysis.liabilityRatio).toBeCloseTo((75000 / 155000) * 100, 2);
  });
});

describe('Wealth Forecast Calculator (wealthForecast)', () => {
  it('should generate monthly projection trajectories correctly', () => {
    const params = {
      currentLiquid: 100000,
      currentDebt: 20000,
      currentInvestmentsValue: 500000,
      expectedIncome: 120000,
      expectedExpenses: 80000,
      expectedSip: 20000,
      expectedRoi: 12,
      projectionPeriods: 12,
      liquidGrowthRate: 4
    };

    const projection = generateWealthProjection(params);
    expect(projection.length).toBe(13); // month 0 to 12 inclusive
    expect(projection[0].monthIndex).toBe(0);
    expect(projection[0].CashReserves).toBe(80000); // 100000 - 20000
    expect(projection[0]['Balanced Net Worth']).toBe(580000); // 80000 + 500000

    expect(projection[12].monthIndex).toBe(12);
    expect(projection[12].CashReserves).toBeGreaterThan(80000);
    expect(projection[12].InvestmentShares).toBeGreaterThan(500000);
  });
});
