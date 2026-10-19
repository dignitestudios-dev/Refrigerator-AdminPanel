// src/components/common/data-table.tsx
'use client';

import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { SearchInput } from './search-input';
import { TableSkeleton } from './skeleton';
import { EmptyState } from './empty-state';
import { PaginationControls } from './pagination-controls';
import { Pagination } from '@/types/api';
import { cn } from '@/lib/utils';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  render?: (item: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  search?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  filterSlot?: React.ReactNode;
  actionSlot?: React.ReactNode;
  pagination?: Pagination;
  onPageChange?: (page: number) => void;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyIcon?: LucideIcon;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filterSlot,
  actionSlot,
  pagination,
  onPageChange,
  emptyTitle = 'No records found',
  emptyMessage = 'No data matching your current filters or search term.',
  emptyIcon = Inbox,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const showToolbar = onSearchChange !== undefined || filterSlot !== undefined || actionSlot !== undefined;

  return (
    <div className={cn("w-full bg-white rounded-3xl border border-[#EDE4E1] shadow-sm overflow-hidden", className)}>
      {/* Table Toolbar */}
      {showToolbar && (
        <div className="p-5 sm:p-6 border-b border-[#EDE4E1] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            {onSearchChange !== undefined && (
              <SearchInput
                value={search || ''}
                onChange={onSearchChange}
                placeholder={searchPlaceholder}
                isLoading={isLoading}
                className="w-full sm:w-80"
              />
            )}
            {filterSlot && (
              <div className="flex items-center gap-2 flex-wrap">
                {filterSlot}
              </div>
            )}
          </div>
          {actionSlot && (
            <div className="flex items-center gap-3 shrink-0">
              {actionSlot}
            </div>
          )}
        </div>
      )}

      {/* Table Content */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#EDE4E1] bg-[#FAF7F5]/80 text-[#786665] text-xs font-bold uppercase tracking-wider">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={cn("py-4 px-6 font-semibold whitespace-nowrap", col.headerClassName)}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EDE4E1]">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="p-0">
                  <TableSkeleton rows={6} cols={columns.length} />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-0">
                  <EmptyState
                    icon={emptyIcon}
                    title={emptyTitle}
                    description={emptyMessage}
                    action={
                      search
                        ? {
                            label: 'Clear Search',
                            onClick: () => onSearchChange?.(''),
                          }
                        : undefined
                    }
                  />
                </td>
              </tr>
            ) : (
              data.map((item) => {
                const key = keyExtractor(item);
                return (
                  <tr
                    key={key}
                    onClick={() => onRowClick?.(item)}
                    className={cn(
                      "transition-colors duration-150 group",
                      onRowClick
                        ? "cursor-pointer hover:bg-[#FFF8F6]"
                        : "hover:bg-[#FAF7F5]/50"
                    )}
                  >
                    {columns.map((col, colIdx) => {
                      const value = col.accessorKey ? (item[col.accessorKey] as React.ReactNode) : null;
                      return (
                        <td
                          key={colIdx}
                          className={cn("py-4 px-6 text-sm text-[#231817]", col.className)}
                        >
                          {col.render ? col.render(item) : value}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && pagination && onPageChange && (
        <PaginationControls
          pagination={pagination}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
