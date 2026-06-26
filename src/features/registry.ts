/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  PieChart,
  Landmark,
  CreditCard,
  ArrowUpRight,
  Sliders,
  Repeat,
  CalendarClock,
  ArrowDownRight,
  Target,
  Coins,
  TrendingUp,
  ShieldAlert,
  Settings,
  Wallet,
  LucideIcon,
  Award
} from 'lucide-react';

// Component Imports
import Dashboard from '../components/Dashboard';
import NetWorthSection from '../components/NetWorthSection';
import AccountsSection from '../components/AccountsSection';
import CreditCardSection from '../components/CreditCardSection';
import IncomeSection from '../components/IncomeSection';
import BudgetsSection from '../components/BudgetsSection';
import RecurringSpendsSection from '../components/RecurringSpendsSection';
import EmisSection from '../components/EmisSection';
import ExpensesSection from '../components/ExpensesSection';
import SavingsGoalsSection from '../components/SavingsGoalsSection';
import InvestmentsSection from '../components/InvestmentsSection';
import ForecastingSection from '../components/ForecastingSection';
import EmergencyFundSection from '../components/EmergencyFundSection';
import SettingsSection from '../components/SettingsSection';
import AnnualReviewSection from '../components/AnnualReviewSection';

export interface FeatureModule {
  id: string;
  label: string;
  icon: LucideIcon;
  component: React.ComponentType<any>;
}

export const featureRegistry: FeatureModule[] = [
  { id: 'dashboard', label: 'Overview', icon: PieChart, component: Dashboard },
  { id: 'net_worth', label: 'Net Worth', icon: Wallet, component: NetWorthSection },
  { id: 'accounts', label: 'Bank Accounts', icon: Landmark, component: AccountsSection },
  { id: 'credit_cards', label: 'Credit Cards', icon: CreditCard, component: CreditCardSection },
  { id: 'income', label: 'Income Accounts', icon: ArrowUpRight, component: IncomeSection },
  { id: 'budgets', label: 'Budget Caps', icon: Sliders, component: BudgetsSection },
  { id: 'subscriptions', label: 'Subscriptions', icon: Repeat, component: RecurringSpendsSection },
  { id: 'emis', label: 'EMI Trackers', icon: CalendarClock, component: EmisSection },
  { id: 'transactions', label: 'Expense Ledger', icon: ArrowDownRight, component: ExpensesSection },
  { id: 'savings', label: 'Savings Milestones', icon: Target, component: SavingsGoalsSection },
  { id: 'investments', label: 'Investments Portfolio', icon: Coins, component: InvestmentsSection },
  { id: 'forecasting', label: 'Wealth Forecast', icon: TrendingUp, component: ForecastingSection },
  { id: 'emergency', label: 'Emergency Shield', icon: ShieldAlert, component: EmergencyFundSection },
  { id: 'annual_review', label: 'Annual Review', icon: Award, component: AnnualReviewSection },
  { id: 'settings', label: 'System Settings', icon: Settings, component: SettingsSection },
];
