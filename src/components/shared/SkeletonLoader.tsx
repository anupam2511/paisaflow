/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface SkeletonBaseProps {
  className?: string;
}

export function SkeletonPulse({ className = '' }: SkeletonBaseProps) {
  return (
    <div className={`animate-pulse bg-slate-100/80 dark:bg-slate-800/65 rounded-lg ${className}`} />
  );
}

export function CardSkeleton({ className = '' }: SkeletonBaseProps) {
  return (
    <div className={`bg-white dark:bg-[#0b1329] rounded-3xl border border-slate-100 dark:border-slate-800/80 p-6 flex flex-col gap-4 ${className}`}>
      {/* Card Header Skeleton */}
      <div className="flex justify-between items-center pb-2 border-b border-slate-50 dark:border-slate-800/40">
        <div className="space-y-2 flex-1">
          <SkeletonPulse className="h-4 w-1/3" />
          <SkeletonPulse className="h-2.5 w-1/5" />
        </div>
        <SkeletonPulse className="h-8 w-8 rounded-xl" />
      </div>
      
      {/* Card Content Skeletons */}
      <div className="space-y-3 mt-2">
        <SkeletonPulse className="h-3 w-full" />
        <SkeletonPulse className="h-3 w-5/6" />
        <SkeletonPulse className="h-3 w-4/5" />
      </div>
      
      {/* Footer / Action Skeleton */}
      <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-50 dark:border-slate-800/40">
        <SkeletonPulse className="h-8 w-20 rounded-xl" />
        <SkeletonPulse className="h-8 w-24 rounded-xl" />
      </div>
    </div>
  );
}

export function MetricSkeleton({ className = '' }: SkeletonBaseProps) {
  return (
    <div className={`bg-white dark:bg-[#0b1329] p-5 rounded-3xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-4 ${className}`}>
      <div className="flex-1 space-y-2.5">
        <SkeletonPulse className="h-3 w-16" />
        <SkeletonPulse className="h-6 w-32" />
        <div className="flex gap-1.5 pt-1">
          <SkeletonPulse className="h-3.5 w-10 rounded-md" />
          <SkeletonPulse className="h-3 w-20" />
        </div>
      </div>
      <SkeletonPulse className="w-10 h-10 rounded-2xl shrink-0" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4, className = '' }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={`w-full overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800/85 ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="py-3 px-4">
                <SkeletonPulse className="h-3 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-[#0b1329] divide-y divide-slate-100 dark:divide-slate-800/60">
          {Array.from({ length: rows }).map((_, rIdx) => (
            <tr key={rIdx}>
              {Array.from({ length: cols }).map((_, cIdx) => (
                <td key={cIdx} className="py-4 px-4">
                  <SkeletonPulse className={`h-3.5 ${cIdx === 0 ? 'w-24' : 'w-16'}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ListSkeleton({ count = 3, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-[#0b1329] p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <SkeletonPulse className="w-9 h-9 rounded-xl shrink-0" />
            <div className="flex-1 space-y-1.5 min-w-0">
              <SkeletonPulse className="h-3.5 w-1/3" />
              <SkeletonPulse className="h-2.5 w-1/2" />
            </div>
          </div>
          <SkeletonPulse className="h-4 w-12 rounded" />
        </div>
      ))}
    </div>
  );
}

export function SectionSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <SkeletonPulse className="h-6 w-48" />
          <SkeletonPulse className="h-3.5 w-72" />
        </div>
        <SkeletonPulse className="h-9 w-32 rounded-xl" />
      </div>

      {/* Grid of Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricSkeleton />
        <MetricSkeleton />
        <MetricSkeleton />
        <MetricSkeleton />
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CardSkeleton className="lg:col-span-2" />
        <CardSkeleton />
      </div>
    </div>
  );
}
