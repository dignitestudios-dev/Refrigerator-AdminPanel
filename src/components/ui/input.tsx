// src/components/ui/input.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-2xl border border-[#EDE4E1] bg-[#FAF7F5] px-4 py-2 text-sm text-[#231817] shadow-2xs transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#9A8785] hover:border-[#FFB1A2] focus:border-[#FF644E] focus:outline-none focus:ring-4 focus:ring-[#FF644E]/10 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
