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
    <InsightsPanel insights={insights} setCurrentTab={setCurrentTab} />
  );
}
