# PaisaFlow UI & Design System Standards

This document establishes the official visual and functional standards for PaisaFlow, guaranteeing complete visual harmony, accessibility, and high contrast across both light and dark modes.

---

## 1. Visual Token Foundations

### Card Radius
*   **Universal Signature Card Radius**: `rounded-3xl` (24px)
*   **Components conforming**: `Card`, `MetricCard`, `EmptyState`, `ConfirmationModal`, and all custom sections.
*   *Rule*: Never use small `rounded-lg` or plain unrounded edges for card bounds. The premium feeling of PaisaFlow relies on generous `rounded-3xl` curves.

### Card Padding
*   **Standard Spacing**: `p-6` (24px) for all primary content layout cards.
*   **Dense Spacing**: `p-5` (20px) for metric summaries, smaller item cards, and tight dashboard containers.
*   *Rule*: Ensure negative space remains balanced. Avoid padding smaller than `p-4` on primary structural elements.

### Heading Hierarchy
*   **Page Title / Headings**: `text-xl` to `text-2xl` (`font-bold tracking-tight text-slate-900 dark:text-slate-50`)
*   **Section Headers**: `text-base` (`font-semibold text-slate-800 dark:text-slate-100`)
*   **Data Labels & Subtext**: `text-[10px]` to `text-xs` (`font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase`)
*   *Rule*: Text letter spacing is globally adjusted by `+15%` (`0.015em`) for all medium, semibold, and bold styles in `index.css` to enhance legibility.

### Dark Mode Contrast & Colors
*   **Primary Dark Mode Canvas**: Ambient dark blue slate gradient (`linear-gradient(225deg, #112240 0%, #070c19 50%, #000000 100%)`)
*   **Glassmorphism Overrides**: Overridden via `index.css` to map `.bg-white` and `.dark:bg-[#0b1329]` directly to `rgba(13, 20, 38, 0.45)` with `backdrop-filter: blur(20px)`, completely avoiding muddy solid greys.
*   **Contrast Bounds**: Deep text colors are dynamically re-routed to light slate/silver (`text-slate-300`, `text-slate-100`) to guarantee accessibility.

---

## 2. Interactive Primitives & Layout Forms

### Modals & Sizing
*   **Radius**: Standardized to `rounded-3xl` (24px).
*   **Backdrop**: `bg-slate-900/60 backdrop-blur-sm` for an immersive focus layer.
*   **Width Mappings**:
    *   `sm`: `max-w-md` (448px) — Quick alerts or inputs.
    *   `md`: `max-w-lg` (512px) — Standard entry forms.
    *   `lg`: `max-w-2xl` (672px) — Tabular metrics or dense workflows.
    *   `xl`: `max-w-4xl` (896px) — Multi-column reports or forecasting systems.

### Form Spacing
*   **Form Container**: `space-y-4` or `space-y-5` to keep controls airy and legible.
*   **Input Labels**: `block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5`.

### Buttons & Action Callouts
*   **Primary Action**: Blue/Indigo active fill (`bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm rounded-lg transition-all`).
*   **Secondary Action**: Cool slate grey / subtle fill (`bg-slate-100 hover:bg-slate-200 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100`).
*   **Delete Action (Dangerous)**: Vivid rose warning fill (`bg-rose-600 hover:bg-rose-700 text-white shadow-sm border border-transparent`), often wrapped in a custom `ConfirmationModal` with severe context warnings.

---

## 3. Financial Primitives & Presentation

### Currency Value Formatting
*   **Engine Component**: `<CurrencyValue value={amount} privacyMode={boolean} compact={boolean} />`
*   *Features*: Encapsulates standard Indian National Rupee (`₹`) comma styling, decimal precision, compact abbreviations (`k`, `L`, `Cr`), and an elegant click-to-reveal mask overlay (`••••`) in privacy mode.

### Percentage Changes
*   **Engine Component**: `<PercentageChange value={rate} showIcon={boolean} />`
*   *Features*: Handles upward trends in emerald green (`+X.Y%` with an `ArrowUpRight` icon) and negative trends in rose red (`-X.Y%` with an `ArrowDownRight` icon).

---

## 4. Operational Feedback States

### Empty States
*   **Engine Component**: `<EmptyState icon={Icon} title={title} description={desc} actionLabel={label} onAction={handler} />`
*   *Design*: Air-spaced centered card with dashed borders, light grey/slate icon wells, clear message hierarchies, and actionable secondary buttons.

### Loading & Skeletons
*   **Loading Spinner**: Spinning circular loader with adjustable sizing (`sm`, `md`, `lg`) and theme color tracking.
*   **Loading Overlay**: Immersive full-screen blur cover carrying clear, secure processing explanations.
*   **Skeletons**: High-fidelity pulsers carrying modular shapes to mimic live content containers during data hydration syncs.
