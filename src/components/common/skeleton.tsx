// src/components/common/skeleton.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-[#EFE4DF]/80",
        className
      )}
    />
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full divide-y divide-[#EDE4E1]">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="flex items-center gap-4 py-4 px-6 animate-pulse">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <div
              key={cIdx}
              className={cn(
                "h-4 bg-[#EDE4E1] rounded-md",
                cIdx === 0 ? "w-28" : cIdx === 1 ? "w-44 flex-1" : "w-20"
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl p-6 border border-[#EDE4E1] shadow-xs animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-28 bg-[#EDE4E1] rounded-md" />
        <div className="w-10 h-10 rounded-2xl bg-[#EDE4E1]" />
      </div>
      <div className="h-9 w-24 bg-[#EDE4E1] rounded-lg mb-2" />
      <div className="h-3.5 w-36 bg-[#EDE4E1] rounded-md" />
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse p-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#EDE4E1]" />
        <div className="space-y-2">
          <div className="h-5 w-40 bg-[#EDE4E1] rounded-md" />
          <div className="h-4 w-28 bg-[#EDE4E1] rounded-md" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-20 bg-[#EDE4E1] rounded-2xl" />
        <div className="h-20 bg-[#EDE4E1] rounded-2xl" />
      </div>
      <div className="h-40 bg-[#EDE4E1] rounded-2xl" />
    </div>
  );
}
