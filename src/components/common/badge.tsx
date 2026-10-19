// src/components/common/badge.tsx
import React from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant =
  | 'active'
  | 'blocked'
  | 'deleted'
  | 'visible'
  | 'removed'
  | 'pending'
  | 'under_review'
  | 'resolved'
  | 'dismissed'
  | 'draft'
  | 'scheduled'
  | 'sent'
  | 'cancelled'
  | 'family'
  | 'food'
  | 'fun'
  | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; dotColor?: string; border?: string }> = {
  active: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dotColor: 'bg-emerald-500',
  },
  blocked: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dotColor: 'bg-amber-500',
  },
  deleted: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dotColor: 'bg-rose-500',
  },
  visible: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dotColor: 'bg-emerald-500',
  },
  removed: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dotColor: 'bg-rose-500',
  },
  pending: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dotColor: 'bg-amber-500',
  },
  under_review: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dotColor: 'bg-blue-500',
  },
  resolved: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dotColor: 'bg-emerald-500',
  },
  dismissed: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dotColor: 'bg-slate-400',
  },
  draft: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dotColor: 'bg-slate-400',
  },
  scheduled: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    dotColor: 'bg-indigo-500',
  },
  sent: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dotColor: 'bg-emerald-500',
  },
  cancelled: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dotColor: 'bg-rose-400',
  },
  family: {
    bg: 'bg-[#FFF0ED]',
    text: 'text-[#E03A22]',
    border: 'border-[#FFD5CC]',
    dotColor: 'bg-[#FF644E]',
  },
  food: {
    bg: 'bg-[#FEF7EC]',
    text: 'text-[#B46F04]',
    border: 'border-[#FDE3B6]',
    dotColor: 'bg-[#F5A623]',
  },
  fun: {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    dotColor: 'bg-sky-500',
  },
  neutral: {
    bg: 'bg-[#F5EFEB]',
    text: 'text-[#786665]',
    border: 'border-[#EDE4E1]',
    dotColor: 'bg-[#A39090]',
  },
};

export function Badge({ variant = 'neutral', children, className, dot = true }: BadgeProps) {
  const styles = variantStyles[variant] || variantStyles.neutral;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide border shadow-2xs transition-colors whitespace-nowrap shrink-0 select-none",
        styles.bg,
        styles.text,
        styles.border,
        className
      )}
    >
      {dot && styles.dotColor && (
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", styles.dotColor)} />
      )}
      {children}
    </span>
  );
}
