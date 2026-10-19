// src/components/ui/textarea.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-2xl border border-[#EDE4E1] bg-[#FAF7F5] p-3 text-sm text-[#231817] shadow-2xs transition-all placeholder:text-[#9A8785] hover:border-[#FFB1A2] focus:border-[#FF644E] focus:outline-none focus:ring-4 focus:ring-[#FF644E]/10 disabled:cursor-not-allowed disabled:opacity-50 resize-none',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
