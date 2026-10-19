// src/app/login/page.tsx
'use client';

import React, { useState, Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/lib/context/auth-context';
import { useToast } from '@/lib/context/toast-context';
import { authApi } from '@/lib/api/client';
import {
  loginSchema,
  LoginFormData,
  forgotEmailSchema,
  ForgotEmailFormData,
  forgotOtpSchema,
  ForgotOtpFormData,
  resetPasswordSchema,
  ResetPasswordFormData,
} from '@/lib/validations/auth-schema';
import {
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PasswordInput } from '@/components/ui/password-input';
import { PasswordStrengthMeter } from '@/components/common/password-strength-meter';

function LoginFormContent() {
  const searchParams = useSearchParams();
  const reasonParam = searchParams.get('reason');

  const { login } = useAuth();
  const { success, error: toastError } = useToast();

  const [mode, setMode] = useState<
    'login' | 'forgot_email' | 'forgot_otp' | 'forgot_new_pass'
  >('login');
  const [activeEmail, setActiveEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(reasonParam);

  // Form 1: Login Form
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors, isSubmitting: isLoggingIn },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Form 2: Request OTP Form
  const {
    register: registerForgotEmail,
    handleSubmit: handleForgotEmailSubmit,
    formState: { errors: forgotEmailErrors, isSubmitting: isSendingOtp },
  } = useForm<ForgotEmailFormData>({
    resolver: zodResolver(forgotEmailSchema),
    defaultValues: {
      email: '',
    },
  });

  // Form 3: Verify OTP Form
  const {
    register: registerForgotOtp,
    handleSubmit: handleForgotOtpSubmit,
    formState: { errors: forgotOtpErrors, isSubmitting: isVerifyingOtp },
  } = useForm<ForgotOtpFormData>({
    resolver: zodResolver(forgotOtpSchema),
    defaultValues: {
      otp: '',
    },
  });

  // Form 4: Set New Password Form
  const {
    register: registerResetPassword,
    handleSubmit: handleResetPasswordSubmit,
    watch: watchResetPassword,
    reset: resetPasswordForm,
    formState: { errors: resetPasswordErrors, isSubmitting: isResettingPassword },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPasswordValue = watchResetPassword('newPassword') || '';
  const confirmPasswordValue = watchResetPassword('confirmPassword') || '';

  // Submit Login
  const onLogin = async (data: LoginFormData) => {
    setErrorMessage(null);
    try {
      await login(data.email, data.password);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message ||
        (err as { message?: string })?.message ||
        'Invalid email or password';
      setErrorMessage(msg);
    }
  };

  // Submit Forgot Password - Step 1: Request Code
  const onSendOtp = async (data: ForgotEmailFormData) => {
    setErrorMessage(null);
    try {
      const res = await authApi.forgotPassword(data.email);
      setActiveEmail(data.email);
      success(res.message || 'OTP code sent to email');
      setMode('forgot_otp');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message || 'Failed to request OTP';
      setErrorMessage(msg);
      toastError(msg);
    }
  };

  // Submit Forgot Password - Step 2: Verify Code
  const onVerifyOtp = async (data: ForgotOtpFormData) => {
    setErrorMessage(null);
    try {
      const res = await authApi.verifyOtp(activeEmail, data.otp);
      if (res.data?.resetToken) {
        setResetToken(res.data.resetToken);
        success('Code verified successfully');
        setMode('forgot_new_pass');
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message || 'Invalid or expired OTP';
      setErrorMessage(msg);
      toastError(msg);
    }
  };

  // Submit Forgot Password - Step 3: New Password
  const onResetPassword = async (data: ResetPasswordFormData) => {
    setErrorMessage(null);
    try {
      const res = await authApi.resetPassword(resetToken, data.newPassword);
      success(res.message || 'Password reset successfully! Please log in.');
      resetPasswordForm();
      setMode('login');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message || 'Password reset failed';
      setErrorMessage(msg);
      toastError(msg);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-[#FF644E]/10 border border-[#EDE4E1] p-8 md:p-10 relative overflow-hidden">
      {/* Decorative top coral bar */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#FF7565] via-[#FF644E] to-[#F5A623]" />

      {/* Header */}
      <div className="text-center mb-8 flex flex-col items-center">
        <div className="relative w-20 h-24 mb-3 drop-shadow-md transition-transform hover:scale-105 duration-300">
          <Image
            src="/logo.png"
            alt="Refrigerator Logo"
            fill
            sizes="80px"
            className="object-contain"
            priority
          />
        </div>
        <h1 className="font-impact text-3xl text-[#231817] tracking-wider">
          REFRIGERATOR
        </h1>
        <p className="text-sm font-semibold text-[#786665] mt-1">
          Super Admin Console
        </p>
      </div>

      {/* Server / Inactivity Error Alert */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 text-xs font-medium flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="leading-relaxed flex-1">{errorMessage}</div>
        </div>
      )}

      {/* Form: Mode = Login */}
      {mode === 'login' && (
        <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-5" noValidate>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#786665]">
              Admin Email
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 w-4 h-4 text-[#9A8785]" />
              <input
                type="email"
                {...registerLogin('email')}
                placeholder="admin@example.com"
                className={cn(
                  "w-full pl-10 pr-4 py-3 bg-[#FAF7F5] border border-[#EDE4E1] hover:border-[#FFB1A2] focus:border-[#FF644E] focus:ring-4 focus:ring-[#FF644E]/10 rounded-2xl text-sm text-[#231817] outline-none transition-all",
                  loginErrors.email && "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10"
                )}
              />
            </div>
            {loginErrors.email && (
              <p className="text-xs text-rose-600 font-medium pl-1">
                {loginErrors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#786665]">
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setMode('forgot_email');
                }}
                className="text-xs font-bold text-[#FF644E] hover:text-[#F04730] transition-colors cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <PasswordInput
              {...registerLogin('password')}
              placeholder="••••••••"
              hasError={Boolean(loginErrors.password)}
            />
            {loginErrors.password && (
              <p className="text-xs text-rose-600 font-medium pl-1">
                {loginErrors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full py-3.5 px-6 rounded-full bg-[#FF644E] hover:bg-[#F04730] text-white font-bold text-sm shadow-md shadow-[#FF644E]/25 transition-all hover:scale-101 active:scale-99 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isLoggingIn ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Sign In to Console
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* Form: Mode = Forgot Password - Step 1: Request Code */}
      {mode === 'forgot_email' && (
        <form onSubmit={handleForgotEmailSubmit(onSendOtp)} className="space-y-5" noValidate>
          <div className="text-sm text-[#786665] leading-relaxed">
            Enter your admin email address to receive a 6-digit one-time reset code.
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#786665]">
              Admin Email
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 w-4 h-4 text-[#9A8785]" />
              <input
                type="email"
                {...registerForgotEmail('email')}
                placeholder="admin@example.com"
                className={cn(
                  "w-full pl-10 pr-4 py-3 bg-[#FAF7F5] border border-[#EDE4E1] rounded-2xl text-sm outline-none transition-all",
                  forgotEmailErrors.email && "border-rose-300 focus:border-rose-500"
                )}
              />
            </div>
            {forgotEmailErrors.email && (
              <p className="text-xs text-rose-600 font-medium pl-1">
                {forgotEmailErrors.email.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSendingOtp}
            className="w-full py-3.5 px-6 rounded-full bg-[#FF644E] hover:bg-[#F04730] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSendingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Code'}
          </button>

          <button
            type="button"
            onClick={() => {
              setErrorMessage(null);
              setMode('login');
            }}
            className="w-full text-center text-xs font-bold text-[#786665] hover:text-[#231817] flex items-center justify-center gap-1.5 pt-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
          </button>
        </form>
      )}

      {/* Form: Mode = Forgot Password - Step 2: Verify Code */}
      {mode === 'forgot_otp' && (
        <form onSubmit={handleForgotOtpSubmit(onVerifyOtp)} className="space-y-5" noValidate>
          <div className="text-sm text-[#786665] leading-relaxed">
            Enter the 6-digit code sent to <strong className="text-[#231817]">{activeEmail}</strong>.
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#786665]">
              One-Time Code (OTP)
            </label>
            <div className="relative flex items-center">
              <KeyRound className="absolute left-3.5 w-4 h-4 text-[#9A8785]" />
              <input
                type="text"
                maxLength={6}
                {...registerForgotOtp('otp')}
                placeholder="123456"
                className={cn(
                  "w-full pl-10 pr-4 py-3 bg-[#FAF7F5] border border-[#EDE4E1] rounded-2xl text-sm font-mono tracking-widest outline-none transition-all",
                  forgotOtpErrors.otp && "border-rose-300 focus:border-rose-500"
                )}
              />
            </div>
            {forgotOtpErrors.otp && (
              <p className="text-xs text-rose-600 font-medium pl-1">
                {forgotOtpErrors.otp.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isVerifyingOtp}
            className="w-full py-3.5 px-6 rounded-full bg-[#FF644E] hover:bg-[#F04730] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isVerifyingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify Code'}
          </button>

          <div className="flex items-center justify-between text-xs pt-2">
            <button
              type="button"
              onClick={() => onSendOtp({ email: activeEmail })}
              className="text-[#FF644E] font-bold hover:underline cursor-pointer"
            >
              Resend Code
            </button>
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setMode('login');
              }}
              className="text-[#786665] font-bold hover:text-[#231817] cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Form: Mode = Forgot Password - Step 3: New Password */}
      {mode === 'forgot_new_pass' && (
        <form onSubmit={handleResetPasswordSubmit(onResetPassword)} className="space-y-5" noValidate>
          <div className="text-sm text-[#786665] leading-relaxed">
            Create a new password (minimum 8 characters).
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#786665]">
              New Password
            </label>
            <PasswordInput
              {...registerResetPassword('newPassword')}
              placeholder="••••••••"
              hasError={Boolean(resetPasswordErrors.newPassword)}
            />
            {resetPasswordErrors.newPassword && (
              <p className="text-xs text-rose-600 font-medium pl-1">
                {resetPasswordErrors.newPassword.message}
              </p>
            )}
          </div>

          {/* Real-time Password Strength Meter */}
          <PasswordStrengthMeter
            password={newPasswordValue}
            confirmPassword={confirmPasswordValue}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#786665]">
              Confirm Password
            </label>
            <PasswordInput
              {...registerResetPassword('confirmPassword')}
              placeholder="••••••••"
              hasError={Boolean(resetPasswordErrors.confirmPassword)}
            />
            {resetPasswordErrors.confirmPassword && (
              <p className="text-xs text-rose-600 font-medium pl-1">
                {resetPasswordErrors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isResettingPassword}
            className="w-full py-3.5 px-6 rounded-full bg-[#FF644E] hover:bg-[#F04730] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isResettingPassword ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Save New Password'
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setErrorMessage(null);
              setMode('login');
            }}
            className="w-full text-center text-xs font-bold text-[#786665] hover:text-[#231817] flex items-center justify-center gap-1.5 pt-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
          </button>
        </form>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5F3] via-[#FAF7F5] to-[#FEF7EC] flex items-center justify-center p-4 sm:p-6">
      <Suspense fallback={<div className="p-8 text-center text-[#786665]">Loading sign in...</div>}>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
