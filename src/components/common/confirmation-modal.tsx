// src/components/common/confirmation-modal.tsx
'use client';

import React from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => unknown | Promise<unknown>;
  title: string;
  description?: string;
  consequences?: string[];
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'warning' | 'primary' | 'success';
  isLoading?: boolean;
  reasonInput?: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    required?: boolean;
    maxLength?: number;
    error?: string;
  };
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  consequences = [],
  confirmLabel = 'Confirm Action',
  confirmVariant = 'danger',
  isLoading = false,
  reasonInput,
}: ConfirmationModalProps) {
  const getIcon = () => {
    switch (confirmVariant) {
      case 'danger':
        return <ShieldAlert className="w-6 h-6 text-rose-600" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-amber-600" />;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-emerald-600" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-[#FF644E]" />;
    }
  };

  const getButtonStyles = () => {
    switch (confirmVariant) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20';
      default:
        return 'bg-[#FF644E] hover:bg-[#F04730] text-white shadow-[#FF644E]/20';
    }
  };

  const isConfirmDisabled =
    isLoading ||
    (reasonInput?.required && !reasonInput.value.trim());

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent size="md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border",
                confirmVariant === 'danger' && "bg-rose-50 border-rose-200",
                confirmVariant === 'warning' && "bg-amber-50 border-amber-200",
                confirmVariant === 'success' && "bg-emerald-50 border-emerald-200",
                confirmVariant === 'primary' && "bg-[#FFF0ED] border-[#FFD5CC]"
              )}
            >
              {getIcon()}
            </div>
            <div>
              <AlertDialogTitle className="break-all">{title}</AlertDialogTitle>
            </div>
          </div>
          {description && (
            <AlertDialogDescription className="pt-2 break-all">
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>

        <div className="space-y-4 py-2 break-all">
          {consequences.length > 0 && (
            <div className="p-4 bg-[#FAF7F5] rounded-2xl border border-[#EDE4E1] space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-[#786665]">
                Immediate System Impact
              </div>
              <ul className="space-y-1.5 text-xs text-[#231817] break-all">
                {consequences.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 break-all">
                    <span className="text-rose-500 font-bold shrink-0">•</span>
                    <span className="break-all">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {reasonInput && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-[#231817]">
                <label htmlFor="action-reason">
                  {reasonInput.label}
                  {reasonInput.required && <span className="text-rose-500 ml-1">*</span>}
                </label>
                {reasonInput.maxLength && (
                  <span className="text-[#9A8785]">
                    {reasonInput.value.length}/{reasonInput.maxLength}
                  </span>
                )}
              </div>
              <textarea
                id="action-reason"
                value={reasonInput.value}
                onChange={(e) => reasonInput.onChange(e.target.value)}
                placeholder={reasonInput.placeholder || 'Enter reason...'}
                maxLength={reasonInput.maxLength || 500}
                rows={3}
                className={cn(
                  "w-full p-3 bg-white border border-[#EDE4E1] hover:border-[#FFB1A2] focus:border-[#FF644E] focus:ring-4 focus:ring-[#FF644E]/10 rounded-2xl text-sm text-[#231817] outline-none transition-all resize-none",
                  reasonInput.error && "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10"
                )}
              />
              {reasonInput.error && (
                <p className="text-xs text-rose-600 font-medium">{reasonInput.error}</p>
              )}
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              if (!isConfirmDisabled) {
                onConfirm();
              }
            }}
            disabled={isConfirmDisabled}
            className={cn(
              getButtonStyles(),
              isConfirmDisabled && "opacity-50 cursor-not-allowed hover:bg-current shadow-none"
            )}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
