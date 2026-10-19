// src/components/ui/toggle.tsx
'use client';

import * as React from 'react';
import * as TogglePrimitive from '@radix-ui/react-toggle';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const toggleVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-full text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF644E]/10 disabled:pointer-events-none disabled:opacity-50 cursor-pointer shadow-2xs select-none',
  {
    variants: {
      variant: {
        default:
          'bg-white border border-[#EDE4E1] text-[#786665] hover:bg-[#FAF7F5] hover:text-[#231817] hover:border-[#FFB1A2] data-[state=on]:bg-[#FFF0ED] data-[state=on]:text-[#FF644E] data-[state=on]:border-[#FFB1A2] data-[state=on]:shadow-xs',
        outline:
          'border border-[#EDE4E1] bg-transparent text-[#786665] hover:bg-[#FAF7F5] hover:text-[#231817] hover:border-[#FFB1A2] data-[state=on]:bg-[#FFF0ED] data-[state=on]:text-[#FF644E] data-[state=on]:border-[#FFB1A2]',
        coral:
          'bg-white border border-[#EDE4E1] text-[#786665] hover:bg-[#FAF7F5] hover:border-[#FFB1A2] data-[state=on]:bg-[#FF644E] data-[state=on]:text-white data-[state=on]:border-[#FF644E] data-[state=on]:shadow-sm data-[state=on]:shadow-[#FF644E]/20',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-[11px]',
        lg: 'h-11 px-5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ variant, size, className }))}
    {...props}
  />
));

Toggle.displayName = TogglePrimitive.Root.displayName;

export { Toggle, toggleVariants };
