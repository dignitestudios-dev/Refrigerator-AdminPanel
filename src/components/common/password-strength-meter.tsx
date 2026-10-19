// src/components/common/password-strength-meter.tsx
'use client';

import * as React from 'react';
import { Check, ShieldCheck, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PasswordCriterion {
  id: string;
  label: string;
  met: boolean;
}

export interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  colorClass: string;
  barColorClass: string;
  badgeClass: string;
  criteria: PasswordCriterion[];
}

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const criteria: PasswordCriterion[] = [
    {
      id: 'length',
      label: 'At least 8 characters',
      met: password.length >= 8,
    },
    {
      id: 'lowercase',
      label: 'One lowercase letter (a-z)',
      met: /[a-z]/.test(password),
    },
    {
      id: 'uppercase',
      label: 'One uppercase letter (A-Z)',
      met: /[A-Z]/.test(password),
    },
    {
      id: 'number',
      label: 'One number (0-9)',
      met: /\d/.test(password),
    },
    {
      id: 'special',
      label: 'One special symbol (!@#$%...)',
      met: /[^A-Za-z0-9]/.test(password),
    },
  ];

  if (!password || password.length === 0) {
    return {
      score: 0,
      label: 'Empty',
      colorClass: 'text-[#9A8785]',
      barColorClass: 'bg-[#EDE4E1]',
      badgeClass: 'bg-[#FAF7F5] text-[#9A8785] border-[#EDE4E1]',
      criteria,
    };
  }

  const metCount = criteria.filter((c) => c.met).length;

  // Strict: If length < 8, score cannot exceed 1 (Weak)
  if (password.length < 8) {
    return {
      score: 1,
      label: 'Weak',
      colorClass: 'text-rose-600',
      barColorClass: 'bg-rose-500',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      criteria,
    };
  }

  if (metCount <= 2) {
    return {
      score: 1,
      label: 'Weak',
      colorClass: 'text-rose-600',
      barColorClass: 'bg-rose-500',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      criteria,
    };
  }

  if (metCount === 3) {
    return {
      score: 2,
      label: 'Fair',
      colorClass: 'text-amber-600',
      barColorClass: 'bg-amber-500',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      criteria,
    };
  }

  if (metCount === 4) {
    return {
      score: 3,
      label: 'Good',
      colorClass: 'text-sky-600',
      barColorClass: 'bg-sky-500',
      badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
      criteria,
    };
  }

  return {
    score: 4,
    label: 'Strong',
    colorClass: 'text-emerald-600',
    barColorClass: 'bg-emerald-500',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    criteria,
  };
}

export interface PasswordStrengthMeterProps {
  password?: string;
  confirmPassword?: string;
  showCriteria?: boolean;
  className?: string;
}

export function PasswordStrengthMeter({
  password = '',
  confirmPassword,
  showCriteria = true,
  className,
}: PasswordStrengthMeterProps) {
  const result = evaluatePasswordStrength(password);
  const hasTyped = password.length > 0;
  const hasConfirmTyped = confirmPassword !== undefined && confirmPassword.length > 0;
  const isMatching = hasConfirmTyped && confirmPassword === password;

  return (
    <div className={cn('space-y-2.5 pt-1 text-left', className)} aria-live="polite">
      {/* Strength Header & Meter Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-[#786665] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#FF644E]" />
            Password Strength
          </span>
          {hasTyped ? (
            <span
              className={cn(
                'text-[11px] font-bold px-2 py-0.5 rounded-full border transition-all duration-300',
                result.badgeClass
              )}
            >
              {result.label}
            </span>
          ) : (
            <span className="text-[11px] font-medium text-[#9A8785]">Not entered</span>
          )}
        </div>

        {/* 4 Segmented Progress Bars */}
        <div className="grid grid-cols-4 gap-1.5">
          {[1, 2, 3, 4].map((level) => {
            const isActive = hasTyped && result.score >= level;
            return (
              <div
                key={level}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  isActive ? result.barColorClass : 'bg-[#EDE4E1]'
                )}
              />
            );
          })}
        </div>
      </div>

      {/* Criteria Checklist */}
      {showCriteria && (
        <div className="p-3 bg-[#FAF7F5] border border-[#EDE4E1] rounded-2xl space-y-1.5 transition-all">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#786665] mb-1">
            Requirements
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {result.criteria.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'flex items-center gap-1.5 text-xs transition-colors duration-200',
                  item.met ? 'text-emerald-700 font-medium' : 'text-[#9A8785]'
                )}
              >
                {item.met ? (
                  <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full bg-[#EDE4E1] flex items-center justify-center shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#9A8785]" />
                  </div>
                )}
                <span className="truncate">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Real-time Confirm Password Match Status */}
          {hasConfirmTyped && (
            <div className="pt-2 mt-1.5 border-t border-[#EDE4E1] flex items-center gap-1.5 text-xs font-semibold">
              {isMatching ? (
                <div className="flex items-center gap-1.5 text-emerald-600">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3]" />
                  </div>
                  Passwords match
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-rose-600">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Passwords do not match yet
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
