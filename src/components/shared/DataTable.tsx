/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface Column<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
  className?: string;
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
  if (data.length === 0 && emptyComponent) {
    return <>{emptyComponent}</>;
  }

  return (
    <div id={id} className={`w-full overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800/80 ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-55/40 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`py-3 px-4 text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest ${
                  col.className || ''
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-[#0b1329]">
          {data.map((item, index) => (
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
