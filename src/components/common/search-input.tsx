// src/components/common/search-input.tsx
'use client';

import React from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  isLoading?: boolean;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className,
  isLoading = false,
}: SearchInputProps) {
  return (
    <div className={cn("relative flex items-center w-full max-w-md", className)}>
      <div className="absolute left-3.5 flex items-center justify-center pointer-events-none text-[#786665]">
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-[#FF644E]" />
        ) : (
          <Search className="w-4 h-4" />
        )}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#EDE4E1] hover:border-[#FFB1A2] focus:border-[#FF644E] focus:ring-4 focus:ring-[#FF644E]/10 rounded-full text-sm text-[#231817] placeholder:text-[#9A8785] transition-all outline-none shadow-xs"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 p-1 rounded-full text-[#9A8785] hover:text-[#231817] hover:bg-[#F5EFEB] transition-colors cursor-pointer"
          title="Clear search"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
