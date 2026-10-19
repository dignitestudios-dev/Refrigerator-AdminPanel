// src/components/common/pagination-controls.tsx
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Pagination } from '@/types/api';
import { cn } from '@/lib/utils';

interface PaginationControlsProps {
  pagination: Pagination;
  onPageChange: (page: number) => void;
  className?: string;
}

export function PaginationControls({
  pagination,
  onPageChange,
  className,
}: PaginationControlsProps) {
  const { currentPage, totalPages, totalItems, itemsPerPage } = pagination;

  if (totalItems <= 0) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6 border-t border-[#EDE4E1] bg-white rounded-b-3xl text-sm", className)}>
      <div className="text-[#786665] font-medium text-xs sm:text-sm">
        Showing <span className="font-bold text-[#231817]">{startItem}</span> to{' '}
        <span className="font-bold text-[#231817]">{endItem}</span> of{' '}
        <span className="font-bold text-[#231817]">{totalItems}</span> entries
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-2 rounded-full border border-[#EDE4E1] text-[#786665] hover:text-[#231817] hover:bg-[#FAF7F5] disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
          title="Previous Page"
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="px-2 text-xs text-[#9A8785]">
                  ...
                </span>
              );
            }
            const pageNum = p as number;
            const isActive = pageNum === currentPage;
            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                className={cn(
                  "w-8 h-8 rounded-full text-xs font-bold transition-all",
                  isActive
                    ? "bg-[#FF644E] text-white shadow-sm shadow-[#FF644E]/30"
                    : "text-[#786665] hover:text-[#231817] hover:bg-[#FAF7F5]"
                )}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-2 rounded-full border border-[#EDE4E1] text-[#786665] hover:text-[#231817] hover:bg-[#FAF7F5] disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
          title="Next Page"
          aria-label="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
