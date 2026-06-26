/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  id?: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  requireCheckbox?: boolean;
  checkboxLabel?: string;
  severity?: 'danger' | 'warning' | 'info';
}

export function ConfirmationModal({
  id,
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  requireCheckbox = false,
  checkboxLabel = 'I understand and wish to proceed.',
  severity = 'warning',
}: ConfirmationModalProps) {
  const [checked, setChecked] = useState(false);

  if (!isOpen) return null;

  const severityClasses = {
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40',
      btn: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/15 focus:ring-blue-500/20',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40',
      btn: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/15 focus:ring-amber-500/20',
    },
    danger: {
      bg: 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40',
      btn: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/15 focus:ring-rose-500/20',
    },
  };

  const classes = severityClasses[severity];

  const handleConfirm = () => {
    if (requireCheckbox && !checked) return;
    onConfirm();
    setChecked(false);
  };

  const handleClose = () => {
    setChecked(false);
    onClose();
  };

  return (
    <div
      id={id}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <div className="bg-white dark:bg-[#0b1329] rounded-3xl max-w-md w-full border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
              {title}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-slate-400 hover:text-slate-650 dark:hover:text-slate-100 transition rounded-lg"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
            {description}
          </p>

          {requireCheckbox && (
            <div className="mt-4 p-3 bg-white dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-start gap-2.5">
              <input
                id="modal-confirm-checkbox"
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500/25 border-slate-300 dark:border-slate-700"
              />
              <label
                htmlFor="modal-confirm-checkbox"
                className="text-[10px] text-slate-600 dark:text-slate-400 font-bold select-none cursor-pointer leading-tight"
              >
                {checkboxLabel}
              </label>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              {cancelLabel}
            </button>
            <button
              onClick={handleConfirm}
              disabled={requireCheckbox && !checked}
              className={`px-4 py-2 text-white rounded-xl text-xs font-bold transition shadow-md focus:outline-none focus:ring-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${classes.btn}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
