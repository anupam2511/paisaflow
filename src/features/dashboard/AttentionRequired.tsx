/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FinanceData } from '../../types';
import { useInsights } from '../insights/useInsights';
import { AlertTriangle } from 'lucide-react';
import InsightsPanel from './InsightsPanel';

interface AttentionRequiredProps {
  data: FinanceData;
  setCurrentTab: (tab: string) => void;
}

export default function AttentionRequired({ data, setCurrentTab }: AttentionRequiredProps) {
  const insights = useInsights(data);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
        <div className="p-1.5 bg-rose-50 rounded-lg text-rose-600">
          <AlertTriangle className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800">3. What needs my attention?</h2>
          <p className="text-[11px] text-slate-400">Intelligent personal finance notifications and urgent priority system flags.</p>
        </div>
      </div>

      <InsightsPanel insights={insights} setCurrentTab={setCurrentTab} />
    </div>
  );
}
