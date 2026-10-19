// src/components/ui/password-input.tsx
'use client';

import * as React from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  leftIcon?: React.ReactNode | false;
  hasError?: boolean;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, leftIcon, hasError, disabled, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
      <div className="relative flex items-center w-full">
        {leftIcon !== false && (
          <div className="absolute left-3.5 text-[#9A8785] pointer-events-none flex items-center justify-center">
            {leftIcon || <Lock className="w-4 h-4" />}
          </div>
        )}
        <input
          type={showPassword ? 'text' : 'password'}
          className={cn(
            'flex h-11 w-full rounded-2xl border border-[#EDE4E1] bg-[#FAF7F5] py-2 text-sm text-[#231817] shadow-2xs outline-none transition-all placeholder:text-[#9A8785] hover:border-[#FFB1A2] focus:border-[#FF644E] focus:ring-4 focus:ring-[#FF644E]/10 disabled:cursor-not-allowed disabled:opacity-50',
            leftIcon !== false ? 'pl-10' : 'pl-4',
            'pr-11',
            hasError && 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10',
            className
          )}
          ref={ref}
          disabled={disabled}
          {...props}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => setShowPassword((prev) => !prev)}
          tabIndex={-1}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          aria-pressed={showPassword}
          className="absolute right-3.5 p-1 text-[#9A8785] hover:text-[#231817] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF644E]/30 rounded-lg transition-colors cursor-pointer disabled:pointer-events-none"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
