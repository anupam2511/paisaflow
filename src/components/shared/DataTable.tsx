/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

interface Column<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
  className?: string;
  sortValue?: (item: T) => any;
}

interface DataTableProps<T> {
  id?: string;
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string | number;
  emptyComponent?: React.ReactNode;
  rowClassName?: (item: T) => string;
  className?: string;
}

export function DataTable<T>({
  id,
  columns,
  data,
  keyExtractor,
  emptyComponent,
  rowClassName = () => '',
  className = '',
}: DataTableProps<T>) {
  const [sortColIdx, setSortColIdx] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleHeaderClick = (idx: number, col: Column<T>) => {
    if (!col.sortValue) return;
    if (sortColIdx === idx) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColIdx(idx);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (sortColIdx === null) return data;
    const col = columns[sortColIdx];
    if (!col || !col.sortValue) return data;

    const list = [...data];
    return list.sort((a, b) => {
      const valA = col.sortValue!(a);
      const valB = col.sortValue!(b);

      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, columns, sortColIdx, sortDirection]);

  if (data.length === 0 && emptyComponent) {
    return <>{emptyComponent}</>;
  }

  return (
    <div id={id} className={`w-full overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800/80 ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-55/40 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            {columns.map((col, idx) => {
              const isSortable = !!col.sortValue;
              const isCurrentlySorted = sortColIdx === idx;

              return (
                <th
                  key={idx}
                  onClick={() => handleHeaderClick(idx, col)}
                  className={`py-3 px-4 text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest ${
                    isSortable ? 'cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-800/60' : ''
                  } ${col.className || ''}`}
                >
                  <div className="flex items-center gap-1.5 justify-start">
                    <span>{col.header}</span>
                    {isSortable && (
                      <span className="text-slate-400 dark:text-slate-500 shrink-0">
                        {isCurrentlySorted ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-indigo-500" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-indigo-500" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-50 hover:opacity-100" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-[#0b1329]">
          {sortedData.map((item, index) => (
            <tr
              key={keyExtractor(item, index)}
              className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors ${rowClassName(
                item
              )}`}
            >
              {columns.map((col, idx) => (
                <td key={idx} className={`py-3 px-4 text-xs font-semibold ${col.className || ''}`}>
                  {col.accessor(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
