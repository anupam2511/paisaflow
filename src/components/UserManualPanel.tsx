/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CreditCard,
  Sliders,
  Repeat,
  CalendarClock,
  Coins,
  Target,
  ArrowUpRight,
  Info,
  CheckCircle2,
  HelpCircle,
  BookOpen,
  Search,
  Scale,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Settings,
  ArrowDownRight,
  TrendingUp,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Printer,
  ArrowUp,
  Bookmark,
  DollarSign,
  AlertTriangle,
  Lightbulb,
  FileText,
  ShieldAlert
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

interface UserManualPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: string;
}

// Structured Guide Page definitions
interface GuideSection {
  title: string;
  type: 'text' | 'list' | 'callout' | 'example' | 'faq' | 'glossary';
  calloutType?: 'tip' | 'warning' | 'info' | 'best_practice';
  content: string | string[];
}

interface GuidePage {
  id: string;
  category: 'Welcome' | 'Quick Start' | 'Feature Guides' | 'FAQs' | 'Finance Tips' | 'Glossary';
  title: string;
  icon: React.ComponentType<any>;
  description: string;
  sections: GuideSection[];
  relatedIds?: string[];
}

export default function UserManualPanel({ isOpen, onClose, currentTab }: UserManualPanelProps) {
  const { preferences, showToast } = useFinance();
  const [searchQuery, setSearchQuery] = useState('');
  const [activePageId, setActivePageId] = useState('welcome');
  const [isMaximized, setIsMaximized] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [copiedSectionId, setCopiedSectionId] = useState<string | null>(null);
  
  // Local active FAQ accordion tracking
  const [expandedFaqs, setExpandedFaqs] = useState<Record<number, boolean>>({});
  // Local active Glossary tracking
  const [expandedGlossary, setExpandedGlossary] = useState<Record<string, boolean>>({});
  // Track recently viewed guides
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(['welcome']);

  const mainScrollRef = useRef<HTMLDivElement>(null);

  // Update Recently Viewed whenever activePageId changes
  useEffect(() => {
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((id) => id !== activePageId);
      return [activePageId, ...filtered].slice(0, 4);
    });
    // Scroll to top of article
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activePageId]);

  // Sync active page with current app tab context on open
  useEffect(() => {
    if (isOpen) {
      const tabToPageMap: Record<string, string> = {
        dashboard: 'dashboard_guide',
        accounts: 'accounts_guide',
        income: 'income_guide',
        budgets: 'budgets_guide',
        subscriptions: 'subscriptions_guide',
        emis: 'emis_guide',
        transactions: 'ledger_guide',
        savings: 'savings_guide',
        investments: 'investments_guide',
        forecasting: 'forecasting_guide',
        emergency: 'emergency_guide',
        annual_review: 'annual_review_guide',
        settings: 'settings_guide',
      };
      const targetPageId = tabToPageMap[currentTab];
      if (targetPageId) {
        setActivePageId(targetPageId);
      }
    }
  }, [currentTab, isOpen]);

  if (!isOpen) return null;

  // Comprehensive SaaS documentation content definition
  const guidePages: GuidePage[] = [
    {
      id: 'welcome',
      category: 'Welcome',
      title: 'Welcome to PaisaFlow',
      icon: Sparkles,
      description: 'Get introduced to the core philosophy and financial vision of PaisaFlow.',
      relatedIds: ['quick_start', 'dashboard_guide', 'net_worth_guide'],
      sections: [
        {
          title: 'What is PaisaFlow?',
          type: 'text',
          content: 'PaisaFlow is a premium, full-stack personal finance and capital command center specifically calibrated for Indian households. Unlike traditional expense loggers that merely categorise past transactions, PaisaFlow functions as an forward-looking engine designed to bridge current cash flows, credit liabilities, active debt amortisation, and multi-asset wealth compounding in real time.'
        },
        {
          title: 'The Core Philosophy',
          type: 'text',
          content: 'True financial freedom is not about clipping coupons; it is about absolute awareness of capital velocity and structure. PaisaFlow coordinates five pillars of personal liquidity to achieve this:'
        },
        {
          title: 'Key Tenets of PaisaFlow Architecture',
          type: 'list',
          content: [
            'Track True Net Worth: Real-time balance calculations offsetting liquid bank assets directly against credit liabilities and outstanding EMIs.',
            'Precision Cash Flow: Differentiate between disposable income and fixed commitments (subscriptions, bill payments, loan interest).',
            'SaaS Debt Optimization: Real-time interest amortization simulations with live prepayment savings calculations.',
            'Emergency Shield Architecture: Visualise cash liquidity specifically secured and fenced away from daily shopping pools.',
            'Compound Horizons Forecasting: Predict net worth evolution 12 to 240 months in advance using customizable CAGR parameters.'
          ]
        },
        {
          title: 'Who is PaisaFlow For?',
          type: 'text',
          content: 'PaisaFlow is engineered for working professionals, freelancers, multi-income households, and passive investors in India. Whether you are balancing HDFC credit card statements, tracking mutual fund SIPs, or optimizing prepayment schedules for an SBI home loan, PaisaFlow synthesizes your financial picture into a singular, beautiful command console.'
        },
        {
          title: 'Architecture Guardrails',
          type: 'callout',
          calloutType: 'info',
          content: 'PaisaFlow is fully client-side cached and synchronized securely via Firebase Firestore, ensuring zero data exposure to third-party advertising brokers. Your net worth metrics remain strictly confidential and cryptographically shielded.'
        }
      ]
    },
    {
      id: 'quick_start',
      category: 'Quick Start',
      title: 'PaisaFlow Setup Blueprint',
      icon: Sliders,
      description: 'Follow this 12-step blueprint to construct your capital command center.',
      relatedIds: ['welcome', 'accounts_guide', 'budgets_guide'],
      sections: [
        {
          title: 'The 12-Step Setup Path',
          type: 'list',
          content: [
            '1. Bank Assets First: Go to "Bank Accounts" and add your primary active checking and savings pools (e.g. SBI Savings, HDFC Salary Account).',
            '2. Credit Liabilities Setup: Log your active credit cards (e.g. ICICI Amazon Pay, Amex Gold) alongside their actual credit limits and billing cycle start dates.',
            '3. Core Inflow Registry: Define regular salary, freelance paychecks, or passive rental inflows in "Income Streams".',
            '4. Establish Spending Caps: Click "Budget Caps" to define maximum monthly envelopes for categories like Groceries, Utilities, Dine-out, and Transport.',
            '5. Sync Historical Expenses: Input past transactions in the Expense Ledger to seed your spend-ratio dashboards.',
            '6. Automate Subscriptions: Link fixed commitments like Netflix, Prime, and Health Insurance in the Subscriptions module.',
            '7. Leverage EMI Trackers: Register long-term loans or no-cost EMIs with correct tenures, interest rates, and processing fees.',
            '8. Anchor Investments: Log your portfolio assets, spanning Mutual Funds, Equity Shares, PPF, NPS, or Sovereign Gold Bonds.',
            '9. Create Savings Targets: Set milestones with clear monetary bounds (e.g. Emergency Fund, New Laptop, Wedding Fund).',
            '10. Lock the Emergency Shield: Designate a coverage period (e.g., 6 months of essential survival costs) to establish your secure financial buffer.',
            '11. Audit Wealth Forecast: Navigate to the Forecasting tab to see where your trajectory leads in 5, 10, or 20 years.',
            '12. Review the Annual Recap: Explore your annual compounding summaries, true savings rates, and milestone accomplishments.'
          ]
        },
        {
          title: 'Approximate Setup Duration',
          type: 'callout',
          calloutType: 'best_practice',
          content: '⏱️ Target Setup Time: 12 - 15 minutes. To maximize accuracy, gather your net banking portals and active credit card statement emails before starting the setup flow.'
        }
      ]
    },
    {
      id: 'dashboard_guide',
      category: 'Feature Guides',
      title: 'Overview Dashboard HUD',
      icon: TrendingUp,
      description: 'Understanding dynamic stats screens, net health indicators, and cash position readouts.',
      relatedIds: ['welcome', 'net_worth_guide'],
      sections: [
        {
          title: 'Capital Overview Heads-Up Display',
          type: 'text',
          content: 'The Dashboard serves as the central command screen, providing an instantaneous high-altitude readout of your financial position. Key indicators include:'
        },
        {
          title: 'Dashboard Metrics Breakdown',
          type: 'list',
          content: [
            'Cash Reserves: Cumulative sum of all positive balances in checking, savings, and physical wallets.',
            'Outstanding Credits: Aggregated debt currently owed across all credit card liabilities.',
            'Net Worth Summary: Calculated live as [Total Bank Reserves] - [Total Credit Card Debt]. A positive figure is highlighted in emerald green, indicating capital solvency.',
            'Spend Distribution: Visual interactive charts showcasing real-time category ratios in a 30-day window.',
            'System Alerts: Real-time warnings highlighting overspent budget caps, credit utilization crossing 30%, or upcoming subscriptions due within 48 hours.'
          ]
        },
        {
          title: 'Interactive Widgets',
          type: 'text',
          content: 'Use the quick-action panel to immediately commit savings contributions from active bank accounts, or toggle visual dimensions between category-wise and account-wise spend ratios.'
        }
      ]
    },
    {
      id: 'net_worth_guide',
      category: 'Feature Guides',
      title: 'Net Worth',
      icon: Scale,
      description: 'Assets, liabilities, net worth calculations, and asset allocation strategies.',
      relatedIds: ['dashboard_guide', 'accounts_guide'],
      sections: [
        {
          title: 'The Real Measure of Solvency',
          type: 'text',
          content: 'Your wealth is not defined by monthly salary; it is defined by Net Worth. It is the ultimate metric representing the total capital remaining if you liquidated all assets to pay off all outstanding liabilities immediately.'
        },
        {
          title: 'The Calculation Model',
          type: 'example',
          content: 'Net Worth = (Bank Balances + Cash On Hand + Current Investments Market Value) - (Credit Card Debts + EMI Principal Outstanding).'
        },
        {
          title: 'Strategic Asset Allocation',
          type: 'callout',
          calloutType: 'tip',
          content: '💡 Key Metric: Aim for a Net Worth growth rate of at least 15% year-on-year. PaisaFlow categorizes assets into Liquid Reserves (checking/savings) and Compounding Assets (mutual funds/equities) to ensure an optimal balance between liquidity and long-term compounding growth.'
        }
      ]
    },
    {
      id: 'accounts_guide',
      category: 'Feature Guides',
      title: 'Bank Accounts',
      icon: Coins,
      description: 'Adding liquid accounts, balance tracking, transfer bookkeeping, and checking options.',
      relatedIds: ['net_worth_guide', 'credit_cards_guide'],
      sections: [
        {
          title: 'Liquid Reserve Channels',
          type: 'text',
          content: 'Bank Accounts represent your checking, savings, or physical cash holdings. To keep books highly organized, separate your capital into three distinct types:'
        },
        {
          title: 'Account Types Supported',
          type: 'list',
          content: [
            'Salary Checking: Active accounts directly receiving monthly payroll credits. These act as your primary operational hubs.',
            'Interest-Bearing Savings: Yielding accounts (e.g. SBI, Kotak, HDFC savings) holding secondary reserves.',
            'Physical Wallet / Liquid Cash: Unchecked physical currency used for localized offline grocery or transport cash transactions.'
          ]
        },
        {
          title: 'Maintaining Precision',
          type: 'callout',
          calloutType: 'best_practice',
          content: '✅ Best Practice: Audit bank accounts weekly. If you transfer money between checking and savings, utilize the "Transfer" category in the Expense Ledger. This guarantees that your net wealth is unaffected, simply shifting liquidity between accounts without registering false expenditures.'
        }
      ]
    },
    {
      id: 'credit_cards_guide',
      category: 'Feature Guides',
      title: 'Credit Cards',
      icon: CreditCard,
      description: 'Credit limits, utilization ratios, billing cycles, statement tracking, and bill payments.',
      relatedIds: ['accounts_guide', 'ledger_guide'],
      sections: [
        {
          title: 'Liabilities Management & Statement Billing Cycles',
          type: 'text',
          content: 'In PaisaFlow, credit cards are treated as short-term liability lines. Rather than drawing money directly from your bank checking account, credit spending accumulates debt on the card, which you must offset at the end of the statement cycle.'
        },
        {
          title: 'Key Terms Explained',
          type: 'list',
          content: [
            'Credit Limit: Total borrowing capacity allocated by the issuing bank (e.g., ₹2,50,000).',
            'Outstanding Amount: Total accumulated charges currently owed on the card.',
            'Credit Utilization Ratio (CUR): The proportion of credit used (e.g., ₹50,000 spent / ₹2,00,000 limit = 25%). Keep this below 30% to protect your credit score.',
            'Billing Cycle Start Day: The day of the month when your statement is generated (e.g., 15th of every month).'
          ]
        },
        {
          title: 'Worked Credit Statement Example',
          type: 'example',
          content: 'Suppose your HDFC Millennia card has a ₹2,00,000 credit limit and your Billing Cycle starts on the 10th of every month. The statement cycle runs from Jan 10 to Feb 9. On Feb 10, a bill is generated for all transactions in this cycle. The payment due date is typically March 2 (20 days later). PaisaFlow dynamically isolates statement cycles based on this billing start day so you can track precisely how much billable spending you have accumulated.'
        },
        {
          title: 'Bill Clearance Procedure',
          type: 'callout',
          calloutType: 'warning',
          content: '⚠️ Warning: Never pay only the "Minimum Amount Due" on your credit card. Doing so triggers astronomical interest charges ranging from 36% to 48% per annum, compounded daily, along with interest levied on all subsequent purchases.'
        }
      ]
    },
    {
      id: 'income_guide',
      category: 'Feature Guides',
      title: 'Income Streams',
      icon: ArrowUpRight,
      description: 'Structuring regular salaries, dividends, gig earnings, and other capital inflows.',
      relatedIds: ['accounts_guide', 'budgets_guide'],
      sections: [
        {
          title: 'Inflow Management',
          type: 'text',
          content: 'Income streams define your positive financial cash flow. Tracking separate categories of income allows you to analyze your dependency on active employment and helps plan diversified streams over time.'
        },
        {
          title: 'Income Sources',
          type: 'list',
          content: [
            'Salary / Primary Wages: Monthly fixed employment paychecks.',
            'Freelance / Gig Contracts: Variable payouts with irregular timelines.',
            'Rental / Real Estate: Passive monthly inflows from owned properties.',
            'Other Inflows: Intermittent gains such as capital dividends, gift rewards, tax refunds, or interest payouts.'
          ]
        },
        {
          title: 'Capital Velocity Impact',
          type: 'text',
          content: 'When an income credit date arrives, PaisaFlow automatically increases the balance of your selected receiving account. This provides fresh disposable capital, lowering credit utilization indexes and lifting overall Net Worth.'
        }
      ]
    },
    {
      id: 'budgets_guide',
      category: 'Feature Guides',
      title: 'Budget Caps',
      icon: Sliders,
      description: 'Defining monthly budgets, category-wise caps, utilization metrics, and alerts.',
      relatedIds: ['income_guide', 'ledger_guide'],
      sections: [
        {
          title: 'Spend Bounds & Discipline Envelopes',
          type: 'text',
          content: 'Budgets define your spending boundaries. PaisaFlow employs a classic category-envelope method, letting you cap maximum monthly outlays across critical channels like Groceries, Dining Out, Entertainment, Utilities, Transport, and Healthcare.'
        },
        {
          title: 'Alert Thresholds',
          type: 'list',
          content: [
            '🟢 Safe State (Under 80%): The progress indicator remains soft slate-indigo, indicating comfortable spending velocity.',
            '🟡 Warning State (80% - 99%): The progress bar transitions to amber-orange, warning you that you are near your budget ceiling.',
            '🔴 Overdraft State (100%+): The bar triggers a crimson red alert, signifying an immediate budget overrun and warning you to halt non-essential spending.'
          ]
        },
        {
          title: 'Dynamic Adjustment Strategy',
          type: 'callout',
          calloutType: 'best_practice',
          content: '✅ Best Practice: Follow the 50/30/20 Rule: Allocate 50% of your income to Needs (Bills, Groceries), 30% to Wants (Dine Out, Subscriptions), and at least 20% directly to Savings & Investments. Calibrate your PaisaFlow budget caps to reflect these exact ratios.'
        }
      ]
    },
    {
      id: 'subscriptions_guide',
      category: 'Feature Guides',
      title: 'Subscriptions',
      icon: Repeat,
      description: 'Tracking recurring subscriptions, monthly bills, commitments, and payment reminders.',
      relatedIds: ['budgets_guide', 'ledger_guide'],
      sections: [
        {
          title: 'Automating Recurring Commitments',
          type: 'text',
          content: 'Subscriptions and recurring bills represent your passive, locked-in spending velocity. These automatic outlays drain capital if left unchecked, making a dedicated tracking module vital.'
        },
        {
          title: 'Supported Commitments',
          type: 'list',
          content: [
            'Fixed Schedules: Monthly commitments with predictable billing dates and values (e.g., Netflix Premium at ₹649, Spotify Premium at ₹119).',
            'Variable Schedules: Recurring payments where the amount or date may vary slightly (e.g., monthly electricity bills, utility pipelines).',
            'Annual Premiums: Once-a-year outlays that often catch households off guard (e.g., HDFC Ergo health cover premium of ₹18,000).'
          ]
        },
        {
          title: 'One-Click Recording',
          type: 'text',
          content: 'To prevent repetitive input, PaisaFlow includes a one-click payment recorder on each subscription card. Clicking "Record Month\'s Pay" instantly deducts the cash from the linked account, logs a professional transaction in the Expense Ledger, and automatically increments the card\'s next billing date by one month.'
        }
      ]
    },
    {
      id: 'emis_guide',
      category: 'Feature Guides',
      title: 'EMI Trackers & Amortization',
      icon: CalendarClock,
      description: 'Standard, interest-bearing, and no-cost EMIs, worked calculation models, and prepayment simulations.',
      relatedIds: ['net_worth_guide', 'emergency_guide'],
      sections: [
        {
          title: 'The Reality of EMIs',
          type: 'text',
          content: 'Equated Monthly Installments (EMIs) are a double-edged sword. While they facilitate large, immediate purchases (e.g., electronics, vehicles, homes), they lock up your monthly disposable cash flow and introduce complex interest overheads.'
        },
        {
          title: 'Types of EMIs Demystified',
          type: 'list',
          content: [
            'Standard EMI: Traditional interest-bearing loan where you pay back the principal alongside a set annual interest rate (e.g., personal loans at 12-16% p.a.).',
            'No-Cost EMI: A marketing discount structure where the online merchant gives you an upfront discount equal to the interest charged by the partner bank, making the net payable equal to the cash price. However, you must still pay 18% GST on the interest component, making "No-Cost" slightly interest-bearing in practice!',
            'Bank Processing Fees & GST: A one-time processing fee (usually ₹199 to ₹999 + 18% GST) is always added to your first credit card statement, along with a 18% GST charge on the interest portion of every monthly installment.'
          ]
        },
        {
          title: 'Worked EMI Statement Example',
          type: 'example',
          content: 'Suppose you purchase an Apple iPhone on Amazon costing ₹60,000 using your credit card under a 12-month Interest-Bearing EMI at 15% p.a.\n\n- Purchase Principal: ₹60,000\n- Monthly Interest: 1.25% (15% / 12)\n- Monthly EMI = [P x r x (1+r)^n] / [(1+r)^n - 1] = ₹5,417 per month.\n- Total Paid over 12 months = ₹65,004 (Total interest: ₹5,004).\n- Processing Fee: ₹199 + 18% GST = ₹234.82 (billed on statement month 1).\n- First Statement Impact: ₹5,417 (EMI) + ₹235 (Processing Fee) = ₹5,652. Subsequent statements will show ₹5,417.'
        },
        {
          title: 'Prepayment & Debt foreclosure',
          type: 'callout',
          calloutType: 'best_practice',
          content: '✅ Prepayment Strategy: Use PaisaFlow\'s Debt Prepayment Simulator to calculate interest and tenure savings. Prepaying a lump sum (even equivalent to just 1 extra EMI per year) directly reduces the core principal outstanding, instantly skipping multiple months of outstanding tenure and saving thousands in compounded bank interest.'
        },
        {
          title: 'Things to Remember',
          type: 'callout',
          calloutType: 'warning',
          content: '⚠️ Warning: Unsecured EMIs (e.g., consumer durable loans, personal loans) often carry hefty preclosure penalties (typically 2% to 4% of the remaining principal). Conversely, RBI regulations prohibit banks from charging foreclosure penalties on individual floating-rate home loans.'
        }
      ]
    },
    {
      id: 'ledger_guide',
      category: 'Feature Guides',
      title: 'Expense Ledger',
      icon: ArrowDownRight,
      description: 'Tracking everyday transactions, custom search fields, and advanced statement cycle filters.',
      relatedIds: ['budgets_guide', 'credit_cards_guide'],
      sections: [
        {
          title: 'The Core Transaction Database',
          type: 'text',
          content: 'The Expense Ledger serves as the primary transaction database of PaisaFlow. Every individual manual expense, income credit, subscription deduction, or card swipe is documented here to establish clean cash-velocity records.'
        },
        {
          title: 'Advanced Filter Operations',
          type: 'list',
          content: [
            'Search Query: Real-time full-text indexing across descriptions (e.g., typing "uber" instantly isolates all matching commute charges).',
            'Category Filters: Quick toggles to review specific envelopes (e.g. Dining Out only).',
            'Billing Statement Range: Select any active credit card to automatically adjust the ledger start and end dates matching that specific card\'s billing statement cycle (e.g. Jan 10 to Feb 9).',
            'High-Spend Indicators: Transactions exceeding your customizable "High-Spend Threshold" (configured in settings, default ₹5,000) are flagged with an orange warning indicator to facilitate quick auditing.'
          ]
        },
        {
          title: 'Operational Guidelines',
          type: 'callout',
          calloutType: 'best_practice',
          content: '✅ Best Practice: Avoid "untracked leakages" by logging small transactions immediately. A ₹50 tea (chai) purchase, if repeated daily without being tracked, adds up to ₹1,500 of unaccounted monthly outlays.'
        }
      ]
    },
    {
      id: 'savings_guide',
      category: 'Feature Guides',
      title: 'Savings Milestones',
      icon: Target,
      description: 'Creating goals, tracking progression rates, and target date configurations.',
      relatedIds: ['emergency_guide', 'forecasting_guide'],
      sections: [
        {
          title: 'Goal-Oriented Capital Allocation',
          type: 'text',
          content: 'Saving without a goal is directionless. PaisaFlow enables you to create structured, target-driven milestones for your capital. Common examples include home down payments, vehicle purchases, vacation booking, or custom tech upgrades.'
        },
        {
          title: 'Configuring Milestones',
          type: 'list',
          content: [
            'Target Name: Descriptive name (e.g., "Leh Ladakh Trip 2027").',
            'Target Amount: Total capital required (e.g., ₹75,000).',
            'Target Date: Expected month/year of purchase, which helps calculate your required monthly installment contributions automatically.',
            'Current Accumulated: Live ledger showing cash specifically allocated to this milestone.'
          ]
        },
        {
          title: 'Allocations Accounting',
          type: 'callout',
          calloutType: 'info',
          content: 'ℹ️ Information: Contributing cash to a savings milestone is an internal balance reallocation. It reduces your general "disposable" bank account balance on the dashboard to prevent impulsive spending, while keeping your overarching Net Worth perfectly stable.'
        }
      ]
    },
    {
      id: 'investments_guide',
      category: 'Feature Guides',
      title: 'Investments Portfolio',
      icon: Coins,
      description: 'Tracking SIPs, FDs, mutual funds, equities, gold, pension funds, and performance indicators.',
      relatedIds: ['net_worth_guide', 'forecasting_guide'],
      sections: [
        {
          title: 'The Compounding Growth Engine',
          type: 'text',
          content: 'Your savings protect you today, but your investments secure your tomorrow. PaisaFlow provides standard support to track ten distinct asset classes to manage your wealth portfolio:'
        },
        {
          title: 'Ten Supported Investment Vehicles',
          type: 'list',
          content: [
            '1. Mutual Funds (Equity/Debt): Pooled capital managed by professional fund houses, tracked via Units and Net Asset Value (NAV).',
            '2. Systematic Investment Plans (SIPs): Monthly recurring automated investments. PaisaFlow tracks historical SIP frequency and performance CAGR.',
            '3. Equity Shares (Stocks): Direct company ownership tracked by buy-average and current market prices.',
            '4. Sovereign Gold Bonds (SGB) & Gold: Sovereign-backed papers or physical gold bullion tracking commodity market indexes.',
            '5. Public Provident Fund (PPF): Low-risk, tax-free sovereign savings scheme compounded annually (currently at 7.1% p.a., 15-year lock-in).',
            '6. National Pension System (NPS): Long-term retirement vehicle with additional tax breaks under Section 80CCD(1B).',
            '7. Sukanya Samriddhi Yojana (SSY): High-yielding debt scheme specifically dedicated for the girl child\'s future corpus.',
            '8. Fixed Deposits (FDs): Term deposits with maturity tracking, interest rates, and remaining tenure.',
            '9. Unit Linked Insurance Plans (ULIPs): Hybrid instruments blending tax-free life cover with market-linked mutual fund assets.',
            '10. Lump Sum Mutual Fund Investments: One-time manual capital infusions tracking capital gains.'
          ]
        },
        {
          title: 'Maturity Tracking for Term Certificates',
          type: 'example',
          content: 'When adding a Fixed Deposit, PaisaFlow calculates your exact maturity timeline and remaining days (e.g. "214 Days Remaining") so you can visualize upcoming liquid asset cash-in events directly in your planning HUD.'
        },
        {
          title: 'Tracking Strategy',
          type: 'callout',
          calloutType: 'best_practice',
          content: '✅ Best Practice: Update your investment market valuations at least once a month (e.g., on the last Sunday of the month) to ensure your Net Worth and Asset Allocation graphs reflect real market dynamics.'
        }
      ]
    },
    {
      id: 'forecasting_guide',
      category: 'Feature Guides',
      title: 'Wealth Forecast Engine',
      icon: TrendingUp,
      description: 'Simulating compounding growth, inflation indices, and future wealth scenarios.',
      relatedIds: ['investments_guide', 'annual_review_guide'],
      sections: [
        {
          title: 'Predictive Wealth Projection',
          type: 'text',
          content: 'The Wealth Forecast Engine is an advanced compound simulation model. Using your current cash reserves, outstanding credit debt, and investments, it projects your prospective wealth path over a 10-year horizon.'
        },
        {
          title: 'Key Input Parameters',
          type: 'list',
          content: [
            'Expected Annual ROI: Projected investment returns (typically 12% to 15% for long-term equity SIPs, 6% to 7% for secure debt/FDs).',
            'Expected Inflation Rate: Yearly cost-of-living increase (historically 5% to 7% in India), which discounts the future value of your money.',
            'Monthly Savings Volume: Capital added to liquid reserves or investments each month.'
          ]
        },
        {
          title: 'Simulating Three Trajectories',
          type: 'example',
          content: 'PaisaFlow projects three outcomes in the timeline graph:\n1. Balanced Forecast: The standard projection utilizing your exact ROI inputs.\n2. Optimistic Outlook: Calculates standard projection with an added +3% ROI premium, simulating robust market cycles.\n3. Conservative Outlook: Calculates Standard projection with a -3% ROI penalty, preparing you for prolonged market consolidations.'
        },
        {
          title: 'Projections Disclaimer',
          type: 'callout',
          calloutType: 'warning',
          content: '⚠️ Disclaimer: Wealth projections are mathematical estimations based on static assumptions. Actual market performance, variable interest rates, and unexpected capital outlays can significantly alter long-term trajectories.'
        }
      ]
    },
    {
      id: 'emergency_guide',
      category: 'Feature Guides',
      title: 'Emergency Shield Guard',
      icon: ShieldAlert,
      description: 'Buffering essential survival costs from daily expenditure pools.',
      relatedIds: ['savings_guide', 'emis_guide'],
      sections: [
        {
          title: 'The Ultimate Financial Firebreak',
          type: 'text',
          content: 'An Emergency Fund is your ultimate safety net. It prevents you from having to liquidate compounding stock portfolios at a loss or take on high-interest personal loans during sudden job losses, medical crises, or business halts.'
        },
        {
          title: 'Dynamic Cost Calculation',
          type: 'text',
          content: 'PaisaFlow does not use generic arbitrary numbers. The Emergency Shield dynamically scans your active subscriptions, average monthly utility outlays, and monthly EMI commitments to calculate your "Dynamic Monthly Essentials Outflow".'
        },
        {
          title: 'Recommended Cushions',
          type: 'list',
          content: [
            '3 Months (Minimum): Suited for salaried employees in stable government or large corporate jobs.',
            '6 Months (Optimal): Recommended standard for private-sector employees and single-earner households.',
            '12 Months (Secure): Vital for freelancers, startup founders, business owners, and gig contractors experiencing highly volatile monthly incomes.'
          ]
        },
        {
          title: 'Shield State Indicators',
          type: 'callout',
          calloutType: 'best_practice',
          content: '✅ Shield Levels: \n- Critical (0-30% of target met): High danger. Direct all spare monthly cash flow here first.\n- Vulnerable (30-80%): Moderately buffered but exposed to deep crises.\n- Active (80%+): Fully secured. You have successfully established your structural financial firebreak.'
        }
      ]
    },
    {
      id: 'annual_review_guide',
      category: 'Feature Guides',
      title: 'Annual Review',
      icon: Scale,
      description: 'Year-on-year analysis, true savings rates, and milestone achievements.',
      relatedIds: ['forecasting_guide', 'settings_guide'],
      sections: [
        {
          title: 'The Retrospective Financial Ledger',
          type: 'text',
          content: 'The Annual Review provides a comprehensive retrospective look at your financial performance over the past calendar year. It helps you assess your habits, track progress, and adjust your parameters for the upcoming year.'
        },
        {
          title: 'Key Metrics Analyzed',
          type: 'list',
          content: [
            'Total Annual Income: Aggregated inflows from salary, freelance, rental, and investment credits.',
            'True Savings Rate: Calculated strictly as: (Total Annual Income - Total Annual Expenses) / Total Annual Income. Aim for a savings rate of 30% or higher.',
            'Compounding Growth: Percentage expansion of your investment portfolio and asset holdings over the year.',
            'Top Spending Categories: Ranks your biggest capital outlays to identify where your budget experienced leakages.'
          ]
        },
        {
          title: 'Review Strategy',
          type: 'callout',
          calloutType: 'tip',
          content: '💡 Tip: Use the Annual Review on the first week of January to run a personal financial audit, adjust your budget caps for inflation, and set clear compounding targets for the new year.'
        }
      ]
    },
    {
      id: 'settings_guide',
      category: 'Feature Guides',
      title: 'System Settings',
      icon: Settings,
      description: 'Customizing currencies, theme accents, data backups, and security configurations.',
      relatedIds: ['welcome', 'quick_start'],
      sections: [
        {
          title: 'Tailoring Your Workspace',
          type: 'text',
          content: 'System Settings let you adapt PaisaFlow to your precise operating preferences. Key parameters include:'
        },
        {
          title: 'Preferences Highlight',
          type: 'list',
          content: [
            'Global Currency: Switch symbols (₹, $, €, £) instantly. Balances and histories adapt immediately.',
            'High-Spend Threshold: Set the trigger value (default ₹5,000) that flags large transactions in your ledger for easy auditing.',
            'Theme Accents: Change primary visual colors (Sapphire, Emerald, Gold, Ruby, Violet) and switch light/dark mode.',
            'Backup & Restore: Export your complete database schema into a portable JSON file, or restore existing archives with a single click.'
          ]
        },
        {
          title: 'Double-Confirmation Reset Lock',
          type: 'callout',
          calloutType: 'warning',
          content: '⚠️ Warning: Performing a "Data Reset" clears all custom bank accounts, transactions, investments, and settings, reverting the system to the initial preset specs. If you have active user-created datasets, PaisaFlow enforces an extra double-step check with required tick boxes to prevent accidental data loss.'
        }
      ]
    },
    {
      id: 'faqs',
      category: 'FAQs',
      title: 'Frequently Asked Questions',
      icon: HelpCircle,
      description: 'At least 25 answers to critical queries about accounts, cards, and data management.',
      relatedIds: ['welcome', 'quick_start'],
      sections: [
        {
          title: 'SaaS Help Center Frequently Asked Questions',
          type: 'faq',
          content: [] // Rendered dynamically via react state below
        }
      ]
    },
    {
      id: 'tips',
      category: 'Finance Tips',
      title: 'Personal Finance Tips',
      icon: Lightbulb,
      description: 'Actionable guidelines to establish financial health and wealth compounding.',
      relatedIds: ['welcome', 'quick_start', 'emergency_guide'],
      sections: [
        {
          title: 'Actionable Financial Guidelines',
          type: 'list',
          content: [
            '1. Secure your Shield: Always maintain an emergency fund covering 6 to 12 months of vital living costs before aggressively purchasing highly volatile stocks or locking capital in real estate.',
            '2. Optimize Credit: Keep your credit utilization ratio (CUR) strictly under 30% across all credit card liability lines to maintain a high credit score.',
            '3. Pay Statements in Full: Always pay credit card statements in full before the due date. Never carry over balances or rely on minimum payment traps.',
            '4. Keep Books Weekly: Commit 10 minutes every Sunday to audit your accounts, clear subscription payments, and log any cash outlays in the Expense Ledger.',
            '5. Maintain a 30% Savings Rate: Prioritize savings and investments. Aim to invest at least 30% of your take-home pay, treating savings as a fixed obligation rather than a residual afterthought.',
            '6. Automate Your SIPs: Set up automated Systematic Investment Plans (SIPs) in diversified equity index funds immediately after your salary paycheck hits your account.',
            '7. Avoid Consumer EMIs: Restrict purchases of depreciating assets (e.g., clothes, luxury watches) using consumer EMIs. If you cannot buy it twice in cash, you cannot afford it.',
            '8. Increase Savings with Raises: Whenever you receive a salary increment or bonus, direct at least 50% of the increase straight into your investment portfolio (avoiding lifestyle creep).',
            '9. Review Net Worth Monthly: Monitor your Net Worth growth monthly to keep yourself accountable to long-term goals and compounding trajectories.'
          ]
        },
        {
          title: 'The Golden Rule of Wealth',
          type: 'callout',
          calloutType: 'best_practice',
          content: '✅ Wealth is what you save, not what you spend. Focus on increasing the gap between your income and expenditure, and let compound interest do the heavy lifting.'
        }
      ]
    },
    {
      id: 'glossary',
      category: 'Glossary',
      title: 'Financial Glossary',
      icon: FileText,
      description: 'A 20-term financial dictionary defining critical terminology.',
      relatedIds: ['welcome', 'quick_start'],
      sections: [
        {
          title: 'PaisaFlow Financial Dictionary',
          type: 'glossary',
          content: [] // Rendered dynamically via state below
        }
      ]
    }
  ];

  const faqsData = [
    {
      q: 'How does PaisaFlow calculate my Net Worth?',
      a: 'PaisaFlow calculates Net Worth in real time as the cumulative sum of positive bank accounts, physical cash on hand, and current investment holdings, minus outstanding credit card debts and unpaid loan EMI principals.'
    },
    {
      q: 'What is Credit Utilization Ratio, and why is it highlighted in red?',
      a: 'It is the percentage of your credit card limit being used (e.g., ₹30,000 spent on a ₹1,00,000 card limit = 30%). Utilization above 30% indicates credit distress to credit bureaus and lowers your credit score; PaisaFlow highlights CURs above 30% in red to prompt bill payment.'
    },
    {
      q: 'How does a transfer between bank accounts affect my ledger?',
      a: 'A transfer represents moving capital between internal reserves. By utilizing the "Transfer" category, PaisaFlow registers a debit in one account and an equal credit in another. This keeps your overall Net Worth stable, ensuring your cash flow reports do not count transfers as actual spending or income.'
    },
    {
      q: 'Why does my bank account balance change when I log an expense?',
      a: 'When you log a transaction in the Expense Ledger, PaisaFlow automatically updates the balance of the linked bank account to ensure your cash balances reflect real-world liquidity.'
    },
    {
      q: 'How do credit card expenses differ from debit/cash expenses?',
      a: 'An expense charged to a bank account immediately deducts cash from your positive balance. A credit card transaction increases your outstanding liability balance, accumulating debt that remains on the card until you clear the statement bill.'
    },
    {
      q: 'What is a Credit Card Billing Cycle?',
      a: 'It is the monthly window (usually 30 days) during which your purchases are tracked. At the end of the cycle, your statement is generated. You are then given a grace period (usually 20 days) to pay off the outstanding balance.'
    },
    {
      q: 'How do I log a credit card bill payment?',
      a: 'To record a bill payment, log a transaction in the Expense Ledger, selecting "Transfer" or "Bill Payment" as the category. The source account should be your bank account (funds outflow), and the target account must be the credit card (funds credit), which reduces its outstanding debt.'
    },
    {
      q: 'What is a "No-Cost EMI", and is it really free?',
      a: 'No-Cost EMI is a marketing discount structure where the online merchant gives you an upfront discount equal to the interest charged by the bank. However, you must still pay 18% GST on the interest component billed every month, making "No-Cost" slightly interest-bearing in practice.'
    },
    {
      q: 'Why should I track processing fees and GST in EMIs?',
      a: 'Banks charge a one-time processing fee (usually ₹199 to ₹999 + 18% GST) on your first statement, along with a 18% GST charge on the interest portion of every monthly installment. Tracking these helps you see the actual cost of borrowing.'
    },
    {
      q: 'What is a prepayment, and how does it save interest?',
      a: 'Prepayment is paying a lump sum towards your loan principal before the tenure ends. By directly reducing the principal outstanding, you avoid paying compounded interest on that amount over the remaining tenure, which can save thousands in interest.'
    },
    {
      q: 'How does PaisaFlow estimate my Emergency Shield requirements?',
      a: 'PaisaFlow dynamically scans your active subscriptions, average monthly utility outlays, and monthly EMI commitments to calculate your "Dynamic Monthly Essentials Outflow". It then multiplies this by your chosen coverage period (e.g. 6 months) to determine your target Emergency Fund.'
    },
    {
      q: 'What is the "Emergency Fund Lock"?',
      a: 'It is a conceptual lock that earmarks a portion of your bank checking savings as a secure emergency buffer, ensuring you do not accidentally spend it on everyday items.'
    },
    {
      q: 'How often should I update my investment valuations?',
      a: 'Aim to update market values at least once a month (e.g., on the last Sunday of the month) to ensure your Net Worth and Asset Allocation graphs reflect real market dynamics.'
    },
    {
      q: 'What is PPF, and why is it recommended?',
      a: 'Public Provident Fund (PPF) is a sovereign-backed long-term savings scheme in India. It offers tax-free returns (currently 7.1% p.a., compounded annually) with a 15-year lock-in, making it a highly secure, tax-exempt debt asset.'
    },
    {
      q: 'What is the difference between SIP and Lump Sum mutual funds?',
      a: 'Systematic Investment Plans (SIP) involve investing a fixed amount at regular intervals (e.g., monthly), which helps average out market volatility. Lump Sum involves making a single, one-time investment, which relies more on market timing.'
    },
    {
      q: 'How does the Wealth Forecast Engine predict my future wealth?',
      a: 'The Forecast Engine uses your current cash reserves, credit debts, and investments, and projects them over a 10-year sliding monthly timeline based on your expected annual ROI, expected inflation rate, and monthly savings volume.'
    },
    {
      q: 'Is my financial data in PaisaFlow secure?',
      a: 'Yes, your data is automatically synchronized and backed up securely in the cloud via Firebase Authentication and Firestore Cloud Database, with offline caching for reliable persistent storage.'
    },
    {
      q: 'How does PaisaFlow handle high-spend transactions?',
      a: 'PaisaFlow flags transactions exceeding your customizable "High-Spend Threshold" (configured in settings, default ₹5,000) with an orange warning indicator in your ledger logs, making it easy to identify large outlays for auditing.'
    },
    {
      q: 'What is the difference between fixed and variable subscriptions?',
      a: 'Fixed subscriptions are predictable and recurring (e.g., Netflix at ₹649/month). Variable subscriptions represent recurring commitments where the amount or date may vary slightly (e.g., monthly electricity bills).'
    },
    {
      q: 'How do budget caps prevent overspending?',
      a: 'PaisaFlow displays progress bars for each category. Spending below 80% is green/blue, crossing 80% turns the bar orange (Warning), and exceeding 100% turns the bar red (Overspent), helping you monitor your spending speed.'
    },
    {
      q: 'What is the "Annual Review" section?',
      a: 'The Annual Review provides a retrospective look at your financial performance over the past calendar year, showing total income, spending summaries, true savings rate, and top spending categories.'
    },
    {
      q: 'Can I export or backup my PaisaFlow data?',
      a: 'Yes, under System Settings, you can export your complete database schema into a portable JSON file, which can be imported later with a single click to restore your ledger.'
    },
    {
      q: 'What happens when I perform a "Data Reset"?',
      a: 'A Data Reset clears all custom accounts, transactions, investments, and settings, reverting the system to the initial preset specs. To prevent accidental loss, PaisaFlow enforces double-step checks and require tick boxes to override metrics.'
    },
    {
      q: 'Can I use multiple currencies in PaisaFlow?',
      a: 'Yes, PaisaFlow supports changing your global currency notation instantly (e.g. ₹, $, €, £) in System Settings. Balances and histories adapt immediately.'
    },
    {
      q: 'Does PaisaFlow require internet access to function?',
      a: 'PaisaFlow supports robust offline caching, allowing you to view and log transactions without an active internet connection. Your data will automatically sync with the cloud database once connection is restored.'
    },
    {
      q: 'If I pay my credit card bill, does it mark related/connected EMIs as paid? How do I prevent double-counting transactions?',
      a: 'No. In PaisaFlow, credit card bill payments and individual EMIs are separate trackers. A credit card bill payment is recorded as an Account-to-Card "Transfer" (reducing card liability and bank balance, which does not count as a new expense/spending). The actual monthly installment is recorded separately in the EMIs section as an Expense (under the "EMI/Loan" category) to accurately reflect monthly spending. Recording the card payment as a Transfer and the monthly installment as an Expense ensures zero double-counting.'
    }
  ];

  const glossaryData = [
    { term: 'Asset', definition: 'Any resource with economic value owned by an individual (e.g., cash, bank accounts, stocks, mutual funds).' },
    { term: 'Liability', definition: 'Any financial obligation or debt owed to another party (e.g., credit card outstanding, unpaid EMIs, personal loans).' },
    { term: 'Net Worth', definition: 'The total economic value of an individual, calculated as total assets minus total liabilities.' },
    { term: 'Cash Flow', definition: 'The net amount of cash being transferred in and out of an individual\'s accounts (positive cash flow indicates liquidity).' },
    { term: 'Credit Utilization', definition: 'The percentage of available credit card limit currently being used, typically calculated across all active cards.' },
    { term: 'Billing Cycle', definition: 'The monthly recurring interval during which your credit card transactions are tracked for statement generation.' },
    { term: 'Due Date', definition: 'The deadline by which you must pay the outstanding credit card balance to avoid interest and late fees.' },
    { term: 'Statement Date', definition: 'The date on which your credit card billing cycle ends and your monthly bill is officially generated.' },
    { term: 'Principal', definition: 'The original sum of money borrowed or invested, excluding any interest charges or compounding growth.' },
    { term: 'Interest', definition: 'The cost of borrowing money or the reward for investing capital, typically expressed as an annual percentage rate (APR).' },
    { term: 'Processing Fee', definition: 'A one-time fee charged by banks or financial institutions to initialize a loan or credit card EMI.' },
    { term: 'GST', definition: 'Goods and Services Tax; a consumption tax levied on goods and services in India (typically 18% on financial service fees).' },
    { term: 'SIP', definition: 'Systematic Investment Plan; an investment strategy where fixed sums are invested regularly into mutual funds.' },
    { term: 'CAGR', definition: 'Compound Annual Growth Rate; the mean annual growth rate of an investment over a specified period longer than one year.' },
    { term: 'XIRR', definition: 'Extended Internal Rate of Return; a metric used to calculate the annual rate of return for non-periodic cash flows.' },
    { term: 'Emergency Fund', definition: 'A dedicated liquid savings buffer maintained to cover vital living expenses during unexpected financial crises.' },
    { term: 'Budget', definition: 'A financial plan allocating a set portion of income towards specific spending envelopes or savings categories.' },
    { term: 'Subscription', definition: 'A recurring payment agreement to access a service, typically billed on a monthly or annual cycle.' },
    { term: 'EMI', definition: 'Equated Monthly Installment; a fixed payment amount made by a borrower to a lender at a specified date each calendar month.' },
    { term: 'Forecast', definition: 'A mathematical estimation of future financial metrics based on current balances, savings rates, and compounding returns.' }
  ];

  // Perform multi-match search logic
  const filteredPages = guidePages.filter((page) => {
    const query = searchQuery.toLowerCase();
    const matchesTitle = page.title.toLowerCase().includes(query);
    const matchesDesc = page.description.toLowerCase().includes(query);
    const matchesCategory = page.category.toLowerCase().includes(query);
    const matchesContent = page.sections.some((sec) => {
      if (typeof sec.content === 'string') {
        return sec.content.toLowerCase().includes(query);
      }
      return sec.content.some((item) => item.toLowerCase().includes(query));
    });
    return matchesTitle || matchesDesc || matchesCategory || matchesContent;
  });

  const activePage = guidePages.find((p) => p.id === activePageId) || guidePages[0];

  const handleCopyLink = (id: string) => {
    const sectionUrl = `${window.location.origin}${window.location.pathname}?guide=${id}`;
    navigator.clipboard.writeText(sectionUrl);
    setCopiedSectionId(id);
    showToast('Direct documentation link copied to clipboard!', 'success');
    setTimeout(() => setCopiedSectionId(null), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleExpandAllFaqs = () => {
    const allExpanded = Object.keys(expandedFaqs).length === faqsData.length;
    if (allExpanded) {
      setExpandedFaqs({});
    } else {
      const fresh: Record<number, boolean> = {};
      faqsData.forEach((_, idx) => {
        fresh[idx] = true;
      });
      setExpandedFaqs(fresh);
    }
  };

  return (
    <aside
      id="paisa-flow-help-center-root"
      className={`fixed top-0 right-0 h-full bg-[#fafbfc] dark:bg-[#030712] border-l border-slate-200 dark:border-slate-800/80 shadow-2xl transition-all duration-300 z-50 flex flex-col print:bg-white print:border-none print:w-full print:h-auto print:static ${
        isMaximized 
          ? 'w-full left-0' 
          : 'w-full md:w-[480px] lg:w-[650px] xl:w-[850px]'
      }`}
    >
      {/* 1. Header Toolbar */}
      <div className="p-4 bg-white dark:bg-[#0b1329] border-b border-slate-150 dark:border-slate-800/80 flex items-center justify-between shrink-0 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 dark:bg-indigo-950 flex items-center justify-center text-white dark:text-indigo-400 border border-indigo-500/20 shadow-sm shadow-indigo-500/10">
            <BookOpen className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              PaisaFlow SaaS Help Center
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Professional Financial Documentation
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Maximize Toggle */}
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-2 rounded-xl text-slate-450 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            title={isMaximized ? 'Minimize Sidebar' : 'Maximize Workspace'}
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          
          {/* Close Trigger */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-450 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer border border-slate-100 dark:border-slate-800/80"
            title="Dismiss Documentation Console"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* 2. Top-bar Progress Indicator */}
      <div className="h-1 bg-slate-100 dark:bg-slate-900 shrink-0 relative overflow-hidden print:hidden">
        <div 
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
          style={{ width: `${(guidePages.findIndex(p => p.id === activePageId) + 1) / guidePages.length * 100}%` }}
        />
      </div>

      {/* 3. Help Center Layout Grid */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Navigation Panel */}
        <div 
          className={`bg-white dark:bg-[#0b1329] border-r border-slate-150 dark:border-slate-850 flex flex-col shrink-0 transition-all duration-300 print:hidden ${
            isSidebarCollapsed ? 'w-0 overflow-hidden border-r-0' : 'w-[230px] md:w-[260px]'
          }`}
        >
          {/* Sidebar Search Bar */}
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/25 dark:bg-slate-950/20 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search articles & logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8.5 pr-8 py-2.5 outline-none focus:border-indigo-500 font-semibold text-slate-700 dark:text-slate-200 placeholder-slate-400"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400 hover:text-slate-700"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Categories Navigation */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {['Welcome', 'Quick Start', 'Feature Guides', 'FAQs', 'Finance Tips', 'Glossary'].map((catName) => {
              const pagesInCat = filteredPages.filter((p) => p.category === catName);
              if (pagesInCat.length === 0) return null;

              return (
                <div key={catName} className="space-y-1">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block px-2.5 pb-1">
                    {catName}
                  </span>
                  <div className="space-y-0.5">
                    {pagesInCat.map((page) => {
                      const PageIcon = page.icon;
                      const isActive = activePageId === page.id;
                      return (
                        <button
                          key={page.id}
                          onClick={() => setActivePageId(page.id)}
                          className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center gap-2.5 transition cursor-pointer ${
                            isActive
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold border-l-2 border-indigo-500'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/40 font-semibold'
                          }`}
                        >
                          <PageIcon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                          <span className="text-xs truncate leading-tight">{page.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recently Viewed Panel */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/10 shrink-0">
            <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1.5">
              <Bookmark className="w-3 h-3 text-indigo-500" /> Recently Viewed
            </span>
            <div className="space-y-1">
              {recentlyViewed.map((id) => {
                const matched = guidePages.find((p) => p.id === id);
                if (!matched) return null;
                return (
                  <button
                    key={id}
                    onClick={() => setActivePageId(id)}
                    className="w-full text-left text-[10px] font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 truncate block py-0.5"
                  >
                    • {matched.title}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Middle Area: Core Documentation Reader */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#030712] print:bg-white print:overflow-visible">
          
          {/* Documentation Action Toolbar */}
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-850 bg-slate-50/30 dark:bg-slate-900/10 flex items-center justify-between shrink-0 print:hidden">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>SaaS Help Center</span>
              <span>/</span>
              <span>{activePage.category}</span>
              <span>/</span>
              <span className="text-indigo-600 dark:text-indigo-400">{activePage.title}</span>
            </div>

            {/* Quick Actions (Copy URL, Print, Expand All) */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleCopyLink(activePage.id)}
                className="p-1.5 rounded-lg border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                title="Copy Article Link"
              >
                {copiedSectionId === activePage.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Link</span>
              </button>

              <button
                onClick={handlePrint}
                className="p-1.5 rounded-lg border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                title="Print Friendly View"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              {activePage.id === 'faqs' && (
                <button
                  onClick={toggleExpandAllFaqs}
                  className="p-1.5 rounded-lg border border-indigo-150 dark:border-indigo-900 bg-indigo-50/20 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold transition cursor-pointer"
                >
                  Expand / Collapse All FAQs
                </button>
              )}
            </div>
          </div>

          {/* Core Scrollable Article Space */}
          <div 
            ref={mainScrollRef}
            className="flex-1 overflow-y-auto px-6 md:px-8 py-6 space-y-6 print:overflow-visible print:px-0"
          >
            {/* Main Header Card */}
            <div className="pb-5 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5 text-xs text-indigo-600 dark:text-indigo-400 font-extrabold uppercase tracking-widest">
                <activePage.icon className="w-4.5 h-4.5" />
                <span>{activePage.category} Documentation</span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-slate-850 dark:text-white tracking-tight mt-1">
                {activePage.title}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1.5 max-w-2xl leading-relaxed">
                {activePage.description}
              </p>
            </div>

            {/* Dynamic Rendering of Article Sections */}
            <div className="space-y-6">
              {activePage.sections.map((section, sIdx) => {
                
                // 1. Text Section Renderer
                if (section.type === 'text') {
                  return (
                    <div key={sIdx} className="space-y-2">
                      <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 tracking-tight">
                        {section.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                        {section.content as string}
                      </p>
                    </div>
                  );
                }

                // 2. Example Box Renderer
                if (section.type === 'example') {
                  return (
                    <div key={sIdx} className="space-y-2.5">
                      <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 tracking-tight">
                        {section.title}
                      </h3>
                      <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-2xl border border-slate-150/80 dark:border-slate-800/80 font-mono text-[11px] leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line relative overflow-hidden">
                        <div className="absolute right-3 top-3 text-[9px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase font-black tracking-widest text-slate-500 select-none">
                          Real-World Example
                        </div>
                        {section.content as string}
                      </div>
                    </div>
                  );
                }

                // 3. List Item Renderer
                if (section.type === 'list') {
                  return (
                    <div key={sIdx} className="space-y-2.5">
                      <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 tracking-tight">
                        {section.title}
                      </h3>
                      <ul className="space-y-2 pl-1">
                        {(section.content as string[]).map((li, lIdx) => {
                          const separatorIndex = li.indexOf(': ');
                          if (separatorIndex !== -1) {
                            const boldPart = li.substring(0, separatorIndex);
                            const normalPart = li.substring(separatorIndex + 2);
                            return (
                              <li key={lIdx} className="flex items-start gap-2 text-xs leading-relaxed">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                                <p className="text-slate-600 dark:text-slate-350 font-medium">
                                  <strong className="text-slate-850 dark:text-slate-200 font-black">{boldPart}:</strong> {normalPart}
                                </p>
                              </li>
                            );
                          }
                          return (
                            <li key={lIdx} className="flex items-start gap-2 text-xs leading-relaxed">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                              <p className="text-slate-600 dark:text-slate-350 font-medium">{li}</p>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                }

                // 4. Custom Callout Box Renderer
                if (section.type === 'callout') {
                  const styleMap = {
                    tip: {
                      bg: 'bg-indigo-50/40 dark:bg-indigo-950/15',
                      border: 'border-indigo-500/30 dark:border-indigo-500/20',
                      text: 'text-indigo-800 dark:text-indigo-300',
                      icon: Lightbulb,
                      iconColor: 'text-indigo-500',
                      title: '💡 PRO TIP'
                    },
                    warning: {
                      bg: 'bg-rose-50/40 dark:bg-rose-950/15',
                      border: 'border-rose-500/30 dark:border-rose-500/20',
                      text: 'text-rose-800 dark:text-rose-300',
                      icon: AlertTriangle,
                      iconColor: 'text-rose-500',
                      title: '⚠️ CRITICAL WARNING'
                    },
                    info: {
                      bg: 'bg-blue-50/40 dark:bg-blue-950/15',
                      border: 'border-blue-500/30 dark:border-blue-500/20',
                      text: 'text-blue-800 dark:text-blue-300',
                      icon: Info,
                      iconColor: 'text-blue-500',
                      title: 'ℹ️ GENERAL INFORMATION'
                    },
                    best_practice: {
                      bg: 'bg-emerald-50/40 dark:bg-emerald-950/15',
                      border: 'border-emerald-500/30 dark:border-emerald-500/20',
                      text: 'text-emerald-800 dark:text-emerald-300',
                      icon: CheckCircle2,
                      iconColor: 'text-emerald-500',
                      title: '✅ BEST PRACTICE'
                    }
                  };

                  const currentStyle = styleMap[section.calloutType || 'tip'];
                  const CalloutIcon = currentStyle.icon;

                  return (
                    <div 
                      key={sIdx} 
                      className={`p-4 rounded-2xl border ${currentStyle.border} ${currentStyle.bg} flex items-start gap-3 mt-4`}
                    >
                      <CalloutIcon className={`w-5 h-5 ${currentStyle.iconColor} shrink-0 mt-0.5`} />
                      <div className="space-y-1">
                        <span className="text-[9px] font-black tracking-wider uppercase opacity-80 block font-sans">
                          {currentStyle.title}
                        </span>
                        <p className={`text-xs font-semibold leading-relaxed ${currentStyle.text}`}>
                          {section.content as string}
                        </p>
                      </div>
                    </div>
                  );
                }

                // 5. Special FAQs Accordion Renderer
                if (section.type === 'faq') {
                  return (
                    <div key={sIdx} className="space-y-3.5">
                      {faqsData.map((faq, fIdx) => {
                        const isFaqExpanded = expandedFaqs[fIdx];
                        return (
                          <div 
                            key={fIdx}
                            className={`rounded-2xl border transition ${
                              isFaqExpanded 
                                ? 'border-indigo-300 dark:border-indigo-800/80 bg-indigo-50/5 dark:bg-[#0b1329]/45' 
                                : 'border-slate-150 dark:border-slate-800/60 bg-white dark:bg-[#0b1329]'
                            }`}
                          >
                            <button
                              onClick={() => {
                                setExpandedFaqs((prev) => ({
                                  ...prev,
                                  [fIdx]: !prev[fIdx]
                                }));
                              }}
                              className="w-full text-left p-4 flex items-start justify-between gap-4 cursor-pointer"
                            >
                              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 tracking-tight pr-2 leading-snug">
                                {fIdx + 1}. {faq.q}
                              </span>
                              {isFaqExpanded ? (
                                <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                              )}
                            </button>
                            
                            {isFaqExpanded && (
                              <div className="px-4 pb-4 pt-1 border-t border-slate-100/60 dark:border-slate-800/40">
                                <p className="text-xs text-slate-600 dark:text-slate-350 font-semibold leading-relaxed">
                                  {faq.a}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                // 6. Special Glossary Expandable Renderer
                if (section.type === 'glossary') {
                  return (
                    <div key={sIdx} className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {glossaryData.map((item) => {
                        const isGloExpanded = expandedGlossary[item.term];
                        return (
                          <div 
                            key={item.term}
                            className={`p-3 rounded-2xl border transition flex flex-col justify-between ${
                              isGloExpanded 
                                ? 'border-indigo-300 dark:border-indigo-800/80 bg-indigo-50/5 dark:bg-[#0b1329]/45' 
                                : 'border-slate-150 dark:border-slate-800/60 bg-white dark:bg-[#0b1329]'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tight">
                                  {item.term}
                                </span>
                                <button
                                  onClick={() => {
                                    setExpandedGlossary((prev) => ({
                                      ...prev,
                                      [item.term]: !prev[item.term]
                                    }));
                                  }}
                                  className="text-[10px] font-black text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                  {isGloExpanded ? 'Less' : 'More'}
                                </button>
                              </div>
                              <p className={`text-xs text-slate-600 dark:text-slate-350 font-medium mt-1 leading-relaxed ${
                                isGloExpanded ? '' : 'line-clamp-2'
                              }`}>
                                {item.definition}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                return null;
              })}
            </div>

            {/* 4. Related Articles Footer Segment */}
            {activePage.relatedIds && activePage.relatedIds.length > 0 && (
              <div className="pt-8 border-t border-slate-100 dark:border-slate-800/80 mt-10 print:hidden">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-3">
                  Related Documentation Articles:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {activePage.relatedIds.map((rId) => {
                    const rPage = guidePages.find((p) => p.id === rId);
                    if (!rPage) return null;
                    const RIcon = rPage.icon;
                    return (
                      <button
                        key={rId}
                        onClick={() => setActivePageId(rId)}
                        className="p-3 bg-slate-50/60 dark:bg-slate-900/30 border border-slate-150 dark:border-slate-800/80 rounded-2xl hover:border-indigo-400 dark:hover:border-indigo-800/80 hover:bg-white dark:hover:bg-[#0b1329] text-left transition cursor-pointer flex flex-col gap-1.5"
                      >
                        <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] uppercase">
                          <RIcon className="w-3.5 h-3.5" />
                          <span>{rPage.category}</span>
                        </div>
                        <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate w-full">
                          {rPage.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-medium line-clamp-2 leading-relaxed">
                          {rPage.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Back to top helper */}
            <div className="pt-8 flex justify-center print:hidden">
              <button
                onClick={() => mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                className="px-3.5 py-2 rounded-xl border border-slate-150 dark:border-slate-800 text-xs font-bold text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 flex items-center gap-1.5 transition cursor-pointer bg-white dark:bg-[#0b1329]"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span>Back to Top</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Fixed Operational Banner Footer */}
      <div className="p-3 bg-white dark:bg-[#0b1329] border-t border-slate-150 dark:border-slate-850 text-[10.5px] select-none shrink-0 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-indigo-500" />
          <p className="text-slate-400 font-bold uppercase tracking-wide">
            Interactive Help HUD: Change app tabs to auto-focus relevant documentation sheets!
          </p>
        </div>
        <p className="text-slate-500 font-mono text-[9px] font-semibold">
          PaisaFlow v1.4.2
        </p>
      </div>
    </aside>
  );
}
