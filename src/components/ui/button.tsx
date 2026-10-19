// src/components/ui/button.tsx
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF644E]/10 disabled:pointer-events-none disabled:opacity-50 cursor-pointer shadow-xs active:scale-98',
  {
    variants: {
      variant: {
        default: 'bg-[#FF644E] text-white hover:bg-[#F04730] shadow-[#FF644E]/20',
        destructive: 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-600/20',
        outline: 'border border-[#EDE4E1] bg-white text-[#231817] hover:bg-[#FAF7F5] hover:border-[#FFB1A2]',
        secondary: 'bg-[#FAF7F5] text-[#231817] hover:bg-[#EDE4E1]/70 border border-[#EDE4E1]',
        ghost: 'text-[#786665] hover:text-[#231817] hover:bg-[#FAF7F5] shadow-none',
        link: 'text-[#FF644E] underline-offset-4 hover:underline shadow-none',
        success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20',
        warning: 'bg-amber-600 text-white hover:bg-amber-700 shadow-amber-600/20',
      },
      size: {
        default: 'h-10 px-5 py-2.5',
        sm: 'h-8 px-3.5 text-[11px]',
        lg: 'h-12 px-7 text-sm',
        icon: 'h-9 w-9 rounded-full p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
