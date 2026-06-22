# PaisaFlow Technical Context & Reference Manual

PaisaFlow is a responsive, feature-rich, modular personal finance and wealth management platform built using **React 18**, **Vite**, **TypeScript**, and **Tailwind CSS**. It enables end-users to manage their accounts, budget envelopes, incomes, recurring subscriptions, investments, Equated Monthly Installments (EMIs), custom savings goals, and transaction details from a highly polished, unified workspace client.

---

## 🏗️ Architecture & Component Layout

PaisaFlow follows a modular single-page-application (SPA) architecture designed to remain performance-conscious, durable, and clean.

### 🌟 Workspace Configuration Files
- **`/index.html`**: Entry point loaded by the browser. Customizes the client viewport metadata and renders the document tab name: `<title>PaisaFlow</title>`.
- **`/metadata.json`**: Controls core app manifest records, metadata, frames, permissions, and major platform capabilities.
  ```json
  {
    "name": "PaisaFlow",
    "description": "An interactive, visual personal finance dashboard for tracking accounts, credit cards, incomes, category budgets, recurring subscriptions, and custom savings goals.",
    "requestFramePermissions": [],
    "majorCapabilities": ["MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"]
  }
  ```
- **`/package.json`**: Manages all runtime modules and execution scripts (`dev`, `build`, `lint`).
- **`/src/main.tsx`**: Mounts the main React system.
- **`/src/index.css`**: Configures the comprehensive global typography and styling directives via standard Tailwind CSS annotations.

---

## 🗄️ State Persistence & Schema Registry

Core application data is managed dynamically via React state and persisted reliably inside the client's `localStorage` engine sandbox using user-partitioned keys: `personal_finance_dashboard_data_user_{username}`.

The primary configuration objects and structures are defined strictly in `/src/types.ts`:

### 1. Financial Accounts (`FinancialAccount`)
Maintains bank accounts and credit cards current balances and limits:
```typescript
export interface FinancialAccount {
  id: string;
  name: string;        // e.g. "Primary Savings", "Cash Back Visa"
  type: 'bank' | 'credit_card';
  institution: string; // e.g. "HDFC Bank", "ICICI", "SBI"
  balance: number;     // Current balance (positive for cash, outstanding debt for credit cards)
  color: string;       // Tailwind hex color identifier
  limit?: number;      // Credit limit for credit cards
  linkedGroupId?: string;
  isMainCard?: boolean;
  billingCycleStartDay?: number; // Billing statement start date identifier (1-31)
}
```

### 2. Savings Goals (`SavingGoal`)
Supports dynamic visual indicators, targeted date milestones, and installment tracking modes:
```typescript
export interface SavingGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  category: string;
  goalType?: 'flexible' | 'fixed' | 'investment';
  installmentAmount?: number;
  totalInstallments?: number;
  paidInstallments?: number;
  startDate?: string; // YYYY-MM-DD
}
```

### 3. Expenses & Incomes
```typescript
export interface Income {
  id: string;
  source: string;
  amount: number;
  frequency: 'monthly' | 'one-time';
  date: string; // YYYY-MM-DD
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string; // e.g., "Rent & Utilities", "Food & Dining", etc.
  date: string; // YYYY-MM-DD
  accountId: string; // Connected card or bank account ID
  isRecurring: boolean;
  recurringId?: string;
  savingGoalId?: string;
}
```

### 4. Recurring Subscriptions (`RecurringSpend`)
Includes toggles for auto-debit triggers and variable schedule billing mechanics:
```typescript
export interface RecurringSpend {
  id: string;
  name: string;
  amount: number;
  category: string;
  accountId: string;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  billingDay: number;
  billingMonth?: number;
  nextBillingDate: string;
  isActive: boolean;
  isVariableDate?: boolean;
  isAutoDebit?: boolean;
}
```

### 5. EMIs (`EmiItem`)
```typescript
export interface EmiItem {
  id: string;
  name: string;
  amount: number;
  category: string;
  accountId: string;
  totalTenure: number;
  installmentsPaid: number;
  startDate: string;
  interestRate?: number;
  isActive: boolean;
  notes?: string;
}
```

### 6. Investments (`Investment`)
Integrates custom asset class labels and SIP recurring automation options:
```typescript
export interface Investment {
  id: string;
  name: string;
  type: string; // Mutual Funds, Equity, Gold, Alternative Assets
  investmentType: 'recurring' | 'spot';
  amount: number;
  frequency?: 'monthly' | 'quarterly' | 'yearly';
  hasEndDate: boolean;
  endDate?: string;
  startDate: string;
  totalInvested: number;
  accountId: string;
  notes?: string;
  isAutoDebit?: boolean;
  billingDay?: number;
  nextBillingDate?: string;
}
```

---

## ⚡ Key Dashboard & Visual Features

### 📈 Dynamic Expenditure Line Chart
Features a high-performance **Recharts AreaChart** showcasing cash flow cycles over custom period resolutions.
- **Auto-Scale Formatting**: Avoids vertical axis clipping by applying `formatCompactCurrency(...)` formatting logic on numbers larger than standard thresholds, substituting zeros with visual Indian format notation suffixes (**k** for thousands, **L** for Lakhs, **Cr** for Crores) ensuring responsive alignment.
- **Multi-Filter Dimensions**: Supports filtering visual curves by payment category, individual bank accounts, or credit card models.

### 🏧 Automated Billing Engine (`/src/utils/billing.ts`)
Executes check patterns sequentially upon user entry:
- Captures active recurring subscriptions or SIP investments scheduled for auto-debit.
- Creates matching expense entries in the transaction logs.
- Advances the next schedule date based on the config model periodicity (monthly, quarterly, or yearly) automatically.
- Offloads pending balances onto credit cards or deducts from liquid cash accounts.

### 🪙 Multi-Type Savings Goals Contribution
Supports both installment-driven and structural customized lump-sum savings contributions. Goal updates adjust installment progress dynamically while leaving manual add-ons structurally isolated.

---

## 🧩 Modularity Blueprint

The user interface workspace layout is isolated into dedicated files to ensure clean boundaries, prevent infinite React re-renders, and ensure maintainability:

| View Panel | Component Location | Purpose |
| :--- | :--- | :--- |
| **Login System** | `/src/components/LoginScreen.tsx` | Secure local profile routing |
| **Comprehensive Overview** | `/src/components/Dashboard.tsx` | Real-time totals, Recharts curves, quick action inputs, budgets progress, and notification logs |
| **Account Portfolios** | `/src/components/AccountsSection.tsx` | Main bank and credit card creation, billing cycles and credit ceiling configuration |
| **Budget Allocations** | `/src/components/BudgetsSection.tsx` | Expense envelope configuration |
| **Recurring Subscriptions** | `/src/components/RecurringSpendsSection.tsx` | Subscriptions registry and auto-debit configs |
| **Fixed Cost EMIs** | `/src/components/EmisSection.tsx` | Amortization trackers and installment tallies |
| **Investment Portfolio** | `/src/components/InvestmentsSection.tsx` | Mutual Funds and custom assets registry |
| **Income Loggers** | `/src/components/IncomeSection.tsx` | Liquid inflow capture systems |
| **Expense Record Center** | `/src/components/ExpensesSection.tsx` | Deep table ledger with multi-column filtering |
| **User Manual Panel** | `/src/components/UserManualPanel.tsx` | Help system overlay describing workflows |

---

## 🧮 Utility formatters (`/src/utils/formatters.ts`)

- `formatCurrency(amount, preferences)`: Renders user's standard configured symbol (e.g., `₹`) alongside locale-compliant decimal digits.
- `formatCompactCurrency(amount, preferences)`: Resolves large numbers into simplified visual notations (**k**, **L**, **Cr**).
- `getDaysRemaining(targetDate)`: Calculates remaining countdowns for target visual goals.
