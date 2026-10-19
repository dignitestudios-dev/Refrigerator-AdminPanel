// src/components/layout/offline-modal.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { WifiOff, RotateCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/lib/context/toast-context';

export function OfflineModal() {
  const [isOffline, setIsOffline] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const { success, error } = useToast();

  const verifyConnection = useCallback(async (): Promise<boolean> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return false;
    }

    try {
      // Perform a lightweight cache-busted fetch to test real internet connectivity
      const response = await fetch(`/icon.svg?_t=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
      });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  const handleOnline = useCallback(async () => {
    setIsChecking(true);
    const online = await verifyConnection();
    setIsChecking(false);

    if (online) {
      setIsOffline(false);
      success('Internet connection restored.');
    } else {
      setIsOffline(true);
    }
  }, [verifyConnection, success]);

  const handleOffline = useCallback(() => {
    setIsOffline(true);
  }, []);

  useEffect(() => {
    // Initial check on mount
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOffline(true);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Optional heartbeat to detect silent connection drops every 20 seconds
    const interval = setInterval(async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setIsOffline(true);
      }
    }, 20000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [handleOnline, handleOffline]);

  // Lock background scroll when modal is active
  useEffect(() => {
    if (isOffline) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOffline]);

  const handleManualRetry = async () => {
    setIsChecking(true);
    const online = await verifyConnection();
    setIsChecking(false);

    if (online) {
      setIsOffline(false);
      success('Connected to the internet.');
    } else {
      setIsOffline(true);
      error('Still offline. Please check your network cables or Wi-Fi.');
    }
  };

  if (!isOffline) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto no-scrollbar">
      {/* Unclosable backdrop */}
      <div className="fixed inset-0 bg-[#231817]/70 backdrop-blur-md modal-overlay-animate" />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#EDE4E1] overflow-hidden z-10 modal-card-animate no-scrollbar p-6 sm:p-8 text-center space-y-6 break-all">
        {/* Animated Offline Icon */}
        <div className="relative mx-auto w-20 h-20 rounded-3xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-lg shadow-rose-600/15 animate-soft-pulse">
          <WifiOff className="w-10 h-10 stroke-[1.75]" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600" />
          </span>
        </div>

        {/* Title and Explanation */}
        <div className="space-y-2">
          <h3 className="font-impact text-2xl text-[#231817] tracking-wide">
            NO INTERNET CONNECTION
          </h3>
          <p className="text-xs sm:text-sm text-[#786665] leading-relaxed">
            Your connection was lost. All dashboard actions, content moderation updates, and user feeds are currently frozen to prevent data desynchronization.
          </p>
        </div>

        {/* Status Callout Banner */}
        <div className="p-3.5 bg-[#FAF7F5] rounded-2xl border border-[#EDE4E1] text-xs text-[#786665] flex items-center gap-2.5 text-left">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Please check your network cables, router, or Wi-Fi settings. This window will automatically resume once connection is re-established.
          </span>
        </div>

        {/* Action Button */}
        <div>
          <button
            type="button"
            onClick={handleManualRetry}
            disabled={isChecking}
            className="w-full py-3.5 px-6 rounded-full bg-[#FF644E] hover:bg-[#F04730] text-white font-bold text-xs shadow-md shadow-[#FF644E]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RotateCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Checking Network Status...' : 'Retry Connection'}
          </button>
        </div>
      </div>
    </div>
  );
}
