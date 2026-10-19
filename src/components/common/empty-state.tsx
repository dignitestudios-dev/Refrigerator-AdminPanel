// src/components/common/empty-state.tsx
import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'Try adjusting your search query, clearing filters, or checking back later.',
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-6 text-center", className)}>
      <div className="w-16 h-16 rounded-3xl bg-[#FFF5F3] border border-[#FFD5CC] flex items-center justify-center text-[#FF644E] mb-4 shadow-sm animate-soft-pulse">
        <Icon className="w-8 h-8 stroke-[1.6]" />
      </div>
      <h3 className="text-base font-bold text-[#231817] mb-1.5">{title}</h3>
      <p className="text-sm text-[#786665] max-w-sm mb-6 leading-relaxed">{description}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="px-5 py-2.5 bg-[#FF644E] hover:bg-[#F04730] text-white text-sm font-semibold rounded-full shadow-md shadow-[#FF644E]/20 transition-all hover:scale-102 active:scale-98"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
