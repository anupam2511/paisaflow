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
  CheckCircle,
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
  Lock,
  Sun,
  Palette,
  ShieldAlert
} from 'lucide-react';

interface UserManualPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: string;
}

export default function UserManualPanel({ isOpen, onClose, currentTab }: UserManualPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-expand and scroll to the section matching the current tab
  useEffect(() => {
    if (isOpen) {
      const tabToSectionMap: Record<string, string> = {
        dashboard: 'hud',
        accounts: 'accounts',
        income: 'income',
        budgets: 'budgets',
        subscriptions: 'subscriptions',
        emis: 'emis',
        transactions: 'ledger',
        savings: 'savings',
        investments: 'investments',
        forecasting: 'forecasting',
        emergency: 'emergency',
        settings: 'settings',
      };

      const sectionId = tabToSectionMap[currentTab];
      if (sectionId) {
        setExpandedSection(sectionId);
        // Delay slightly to allow rendering
        setTimeout(() => {
          const element = document.getElementById(`manual-section-${sectionId}`);
          if (element && scrollContainerRef.current) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 120);
      }
    }
  }, [currentTab, isOpen]);

  if (!isOpen) return null;

  const sections = [
    {
      id: 'hud',
      title: '1. Capital Overview HUD',
      icon: TrendingUp,
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-150',
      description: 'Understanding dynamic stats screens and net health readouts.',
      steps: [
        'Cash Reserves: Represents your active liquid reserves. This includes checking, savings, or physical wallets. Expenses logged from these accounts decrease this positive balance.',
        'Outstanding Credits: Represents your negative liabilities or active credit cards. Spending made on credit card lines increases this accumulated debt balance instead of drawing cash.',
        'Net Worth Formula: Auto-calculated directly as [Total Bank Liquid Resources] minus [Total Outstanding Credit Debt]. A positive net worth is highlighted in vibrant emerald green, while negative values display as a soft debt-red warning.',
        'Distribution Visualizer: Shows interactive donut configurations of expense category ratios in the selected duration bracket. Hover over sectors to view numerical cash values.'
      ]
    },
    {
      id: 'accounts',
      title: '2. Accounts & Cards',
      icon: CreditCard,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-150',
      description: 'Configuring custom liquid channels, credit card limits, and billing cycles.',
      steps: [
        'Adding Reserves: Tap "Add Account", enter a bank name, select the "Bank / Cash Asset" type, and input your current opening balance.',
        'Adding liabilities & limits: Create lines for credit cards by selecting the "Credit Card / Liability" type. Opening balances represent active outstanding charges you currently owe.',
        'Credit Card Billing Cycles: Define a customized "Billing Cycle Start Day" (e.g., 5th or 15th of the month) so the app knows when your bank cycles statements.',
        'Dynamic Cycle Tracker: Each credit card displays an interactive statement widget. Choose any statement month in the dropdown to instantly view its cycle range, total billable items, and total spent.',
        'Balance Offset Operations: Expenses paid by card lines dynamically push balance totals upwards (increasing debt), whereas cash-paid operations decrease assets immediately.',
        'Archiving Accounts: Double click on any customized asset card header to edit details or delete the asset entirely from tracking calculations.'
      ]
    },
    {
      id: 'income',
      title: '3. Income Streams',
      icon: ArrowUpRight,
      color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-150',
      description: 'Structuring inflows from monthly wages, capital gains, or gigs.',
      steps: [
        'Registering Regular Wages: Document expected recurring incoming cash (Wages, Freelance pay). Specify the inflow frequency and which checking account should absorb the credit.',
        'Logging auxiliary credits: Easily configure sudden non-planned returns like refunds or interest payments for clean ledger logs.',
        'Automatic Inflow Credit: Realized income logs dynamically update bank balances, reinforcing active liquidity.'
      ]
    },
    {
      id: 'budgets',
      title: '4. Budget Bounds & Category Caps',
      icon: Sliders,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-150',
      description: 'Slicing safe spend borders with interactive warnings.',
      steps: [
        'Calibrating custom margins: Click "Budget Caps" to view categories. Setting or modifying bounds pre-populates existing limits in the entry form to prevent blank space errors.',
        'High-Spend alert limits: If a category spend crosses 80% of its designated cap, the progress bar transitions to a bright amber warning.',
        'Near Overdraft states: Reaching or exceeding 100% of your designated category cap triggers a high-visibility crimson warning state to encourage budget discipline.'
      ]
    },
    {
      id: 'subscriptions',
      title: '5. Subscription Obligations',
      icon: Repeat,
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-150',
      description: 'Registering fixed commitments or variable cost dates.',
      steps: [
        'Toggling Variable schedules: Turn on the "Variable Date & Instrument" option if a commitment (e.g. erratic electricity bills or shared streaming subscriptions) changes rates or dates each cycle.',
        'Automatic Calculations: For fixed schedules (yearly hostings, monthly gym nets), specify the billing day. Upcoming next billing dates compute chronologically to structure cashflow roadmaps.',
        'One-Click "Record Month\'s Pay": Click this option directly on any tracking card to trigger immediate bank asset deductions and automatically log corresponding ledger entries.',
        'Forward Dates Calibration: Confirming a recurring bill payment automatically advances the upcoming obligation schedule on fixed cycles.'
      ]
    },
    {
      id: 'emis',
      title: '6. EMI & Prepayments',
      icon: CalendarClock,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-150',
      description: 'Amortizing loans and calculating prepayment compound interest savings.',
      steps: [
        'Creating trackers: Register appliances or loan repayments. Detail the target budget category to associate monthly charges with appropriate ledger calculations.',
        'Interest rate parameters: Record active compounding metrics to help analyze real borrowing weights.',
        'Secured Prepayment Simulator: Use the interactive Secured Debt Optimizer widget to model lump-sum or extra monthly principal repayments.',
        'Tenure & Interest Savings: Find out instantly how many months of payments you skip and exactly how much interest money is saved by prepaying.',
        'Foreclosure Rules: Understand the difference between Secured (Home/Car under RBI no-penalty guidelines) and Unsecured loans.'
      ]
    },
    {
      id: 'ledger',
      title: '7. Expense Ledger Ledger',
      icon: ArrowDownRight,
      color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-150',
      description: 'Auditing transactions with precise filters and alerts.',
      steps: [
        'Instant manual input: Choose an account, specify the exact purchase date, choose a category bucket, and enter a clear transaction description.',
        'Auditing high spendings: Transactions which surpass your configured high-spend threshold automatically earn a high-vis warning tag in logs.',
        'Search & Filter parameters: Instantly filter logs by transaction category, associated accounts, description keyword search, or high-value entries.',
        'Precise Date Range Filtering: Filter your transaction list by dynamic periods including "Today", "This Month", "Last Month", "Billing Statement Cycle" (custom cycle boundaries calculated automatically based on selected card\'s billing start day), or "Custom Date Range" selectors.'
      ]
    },
    {
      id: 'savings',
      title: '8. Savings Milestones',
      icon: Target,
      color: 'text-teal-650 bg-teal-50 dark:bg-teal-950/40 border-teal-150',
      description: 'Setting aside funds for specific future milestones.',
      steps: [
        'Defining Targets: Register custom milestones (e.g. computer upgrade, emergency safety net, holiday booking) with a target date and required target amount.',
        'Recording manual logs: Log dedicated cash allocations to track current progress percentage meters.',
        'Visual target progress: Features dynamic completion graphs, motivating you as you work toward your goal.'
      ]
    },
    {
      id: 'investments',
      title: '9. Investment Portfolio',
      icon: Coins,
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-150',
      description: 'Overseeing Mutual Funds, metals, Fixed Deposits, or equities.',
      steps: [
        'Asset categories: Choose between Mutual Funds, Equity Shares, Fixed Deposits, Gold, or Real estate holdings.',
        'Configuring maturity: When registering FDs, configure your predetermined end date. The tracker displays localized duration remaining before your certificate asset cash-in event.',
        'Dynamic Valuation logs: Update current market values to track real-time portfolio returns.'
      ]
    },
    {
      id: 'forecasting',
      title: '10. Wealth Forecast Engine',
      icon: TrendingUp,
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-150',
      description: 'Simulating compound growth, inflation, and investment horizons.',
      steps: [
        'Simulate Assets: Projects dynamic trajectories for your liquid cash reserves and investment portfolio over a sliding monthly timeline.',
        'Customizing Sliders: Drag sliders to fine-tune expected inflation indices, monthly wage streams, spending envelopes, and annual percentage returns (ROI).',
        'Compare Scenarios: Instantly inspect three outcome dimensions: a Balanced Forecast, an Optimistic (+3% ROI), and a Conservative (-3% ROI) outlook.',
        'Milestone Logs: View year-by-year logs tracking your exact wealth progression directly.'
      ]
    },
    {
      id: 'emergency',
      title: '11. Emergency Shield Guard',
      icon: ShieldAlert,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-150',
      description: 'Isolating liquid emergency shields from liquid spending.',
      steps: [
        'Horizon Multiplier: Select the number of months (e.g., 3, 6, 9, or 12 months) of vital expenses to keep fully buffered.',
        'Essentials Aggregation: Dynamically integrates your bills, average monthly expenses, and active loans to discover a realistic cost-of-living index.',
        'Official Lock: Conceptually allocate a portion of your checking savings directly inside PaisaFlow to partition it away from everyday shopping pools.',
        'Security Alert: Evaluates real-time cash cushions to declare your official shield safety level (e.g. Critical, Vulnerable, Active).'
      ]
    },
    {
      id: 'settings',
      title: '12. Customize & Core Reset',
      icon: Settings,
      color: 'text-rose-550 bg-rose-50 dark:bg-rose-950/40 border-rose-150',
      description: 'Customizing app preferences and securing local storage.',
      steps: [
        'Dynamic Currency: Change global currency notations instantly (e.g. $, ₹, €, £) to update visual metrics throughout PaisaFlow.',
        'Creative Styling: Switch design accents instantly (Sapphire, Emerald, Gold, Ruby, Violet) and set light/dark preferences matching your environment.',
        'High-Spend alert boundaries: Configure the threshold (e.g. ₹6,000) above which transactions earn prominent audit warning badges.',
        'Double-Confirmation Reset Lock: Restore PaisaFlow original seed data safely under System Settings. If the app detects any user-created datasets, it enforces double-step checks and require tick boxes to override metrics.'
      ]
    }
  ];

  const filteredSections = sections.filter(sec => 
    sec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sec.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sec.steps.some(step => step.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <aside 
      id="right-side-manual-pane"
      className="w-full md:w-[380px] lg:w-[420px] bg-white dark:bg-slate-900 border-l border-slate-150 dark:border-slate-800 flex flex-col shrink-0 h-full shadow-2xl relative transition-all duration-300 z-45"
    >
      {/* Header section */}
      <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-indigo-600 dark:bg-indigo-950 text-white dark:text-indigo-400 rounded-xl flex items-center justify-center shadow-sm">
            <BookOpen className="w-4.5 h-4.5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">PaisaFlow Manual</h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Step-by-Step Operations</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          title="Dismiss Manual Pane"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Reactive Active Tab Helper */}
      <div className="px-4 py-2.5 bg-indigo-50/65 dark:bg-indigo-950/25 border-b border-indigo-100/50 dark:border-indigo-950 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-spin-slow" />
          <span className="text-[10px] font-extrabold text-indigo-950 dark:text-indigo-300 uppercase tracking-wide">
            Reactive Context: <span className="text-indigo-600 dark:text-indigo-400">{currentTab}</span>
          </span>
        </div>
        <span className="text-[9px] bg-indigo-200/50 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-300 font-extrabold px-1.5 py-0.5 rounded-md">
          Auto-Focused
        </span>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-slate-100 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-900/10 shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search steps or features..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8.5 pr-3 py-2.5 outline-none focus:border-indigo-500 font-bold text-slate-700 dark:text-slate-200 placeholder-slate-400"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-450 hover:text-slate-700"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Accordions and Steps */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-5 space-y-4 dark:bg-slate-900/50"
      >
        {filteredSections.length === 0 ? (
          <div className="text-center py-12">
            <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">No matching manuals found.</p>
            <p className="text-[10px] text-slate-400 mt-1">Try spelling complete words or clearing filters.</p>
          </div>
        ) : (
          filteredSections.map((sec) => {
            const Icon = sec.icon;
            const isSelfExpanded = expandedSection === sec.id;
            const isTabActive = currentTab === (sec.id === 'hud' ? 'dashboard' : sec.id === 'ledger' ? 'transactions' : sec.id);

            return (
              <div
                key={sec.id}
                id={`manual-section-${sec.id}`}
                className={`rounded-2xl border transition duration-155 overflow-hidden ${
                  isTabActive
                    ? 'border-indigo-500 ring-1 ring-indigo-500/25 bg-indigo-50/30 dark:bg-indigo-950/20'
                    : isSelfExpanded 
                      ? 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40' 
                      : 'border-slate-150/80 dark:border-slate-800/80 bg-slate-50/10 dark:bg-slate-900/15 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Accordion Trigger */}
                <button
                  onClick={() => setExpandedSection(isSelfExpanded ? null : sec.id)}
                  className="w-full text-left p-3.5 flex items-start gap-3 cursor-pointer select-none"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${sec.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide leading-tight">
                        {sec.title}
                      </h4>
                      {isTabActive && (
                        <span className="text-[8px] bg-indigo-600 text-white font-extrabold px-1 rounded-sm uppercase tracking-wider scale-90">
                          Active View
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-semibold line-clamp-2">
                      {sec.description}
                    </p>
                  </div>
                  <div className="text-slate-400 mt-1 shrink-0">
                    {isSelfExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {/* Animated Steps Container */}
                {isSelfExpanded && (
                  <div className="px-4 pb-4 pt-1.5 border-t border-slate-100/60 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/40 space-y-3">
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest block mb-1">
                      Step-by-step action guide:
                    </span>
                    <ol className="space-y-2.5">
                      {sec.steps.map((step, idx) => {
                        const [label, text] = step.split(': ');
                        return (
                          <li key={idx} className="flex gap-2.5 items-start text-[11px] leading-relaxed">
                            <span className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 font-mono font-black text-slate-500 dark:text-slate-400 text-[10px] flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <p className="text-slate-650 dark:text-slate-300 font-medium">
                              <strong className="text-slate-850 dark:text-slate-100 font-black">{label}:</strong> {text}
                            </p>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Fixed bottom stats/credits segment */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-[10.5px] select-none shrink-0">
        <h5 className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1 mb-1">
          <Info className="w-3.5 h-3.5 text-indigo-500" /> Operational Tip
        </h5>
        <p className="text-slate-400 font-semibold leading-relaxed">
          Navigate any tab in the left sidebar; the manual panel automatically slides and expands to match your current section!
        </p>
      </div>
    </aside>
  );
}
