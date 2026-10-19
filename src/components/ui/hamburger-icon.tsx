// src/components/ui/hamburger-icon.tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface HamburgerIconProps {
  isOpen: boolean;
  onClick?: () => void;
  className?: string;
  'aria-label'?: string;
  'aria-controls'?: string;
}

/**
 * UIverse.io hamburger → X morph icon (by JulanDeAlb).
 *
 * Exact markup & animation:
 * <label class="hamburger">
 *   <input type="checkbox">
 *   <svg viewBox="0 0 32 32">
 *     <path class="line line-top-bottom" ... />
 *     <path class="line" ... />
 *   </svg>
 * </label>
 */
export function HamburgerIcon({
  isOpen,
  onClick,
  className,
  'aria-label': ariaLabel,
  'aria-controls': ariaControls,
}: HamburgerIconProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <label
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={ariaLabel ?? (isOpen ? 'Close navigation menu' : 'Open navigation menu')}
      aria-expanded={isOpen}
      aria-controls={ariaControls}
      className={cn(
        'hamburger relative flex items-center justify-center',
        'h-10 w-10 rounded-2xl cursor-pointer select-none',
        'text-[#786665] hover:text-[#FF644E]',
        'hover:bg-[#FFF0ED] border border-transparent hover:border-[#FFD5CC]',
        'transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#FF644E]/30',
        isOpen && 'text-[#FF644E] bg-[#FFF0ED] border-[#FFD5CC] is-active',
        className
      )}
    >
      <input
        type="checkbox"
        checked={isOpen}
        onChange={() => {}} // Controlled via label onClick
        tabIndex={-1}
        className="sr-only pointer-events-none"
        aria-hidden="true"
      />
      <svg
        viewBox="0 0 32 32"
        className="w-7 h-7"
        aria-hidden="true"
        style={{
          transform: isOpen ? 'rotate(-45deg)' : 'rotate(0deg)',
          transition: 'transform 600ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <path
          className="line line-top-bottom"
          d="M27 10 13 10C10.8 10 9 8.2 9 6 9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26C17 28.2 18.8 30 21 30 23.2 30 25 28.2 25 26 25 23.8 23.2 22 21 22L7 22"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: isOpen ? '20 300' : '12 63',
            strokeDashoffset: isOpen ? '-32.42px' : '0px',
            transition:
              'stroke-dasharray 600ms cubic-bezier(0.4, 0, 0.2, 1), stroke-dashoffset 600ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        <path
          className="line"
          d="M7 16 27 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transition:
              'stroke-dasharray 600ms cubic-bezier(0.4, 0, 0.2, 1), stroke-dashoffset 600ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </svg>
    </label>
  );
}
