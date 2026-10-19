// src/components/layout/idle-warning-modal.tsx
'use client';

import React from 'react';
import { Clock, ShieldAlert } from 'lucide-react';
import { Modal } from '@/components/common/modal';
import { useAuth } from '@/lib/context/auth-context';

export function IdleWarningModal() {
  const { showIdleWarning, dismissIdleWarning, logout } = useAuth();

  return (
    <Modal
      isOpen={showIdleWarning}
      onClose={dismissIdleWarning}
      size="sm"
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>Inactivity Timeout Warning</div>
        </div>
      }
      footer={
        <>
          <button
            type="button"
            onClick={() => logout('Logged out due to inactivity.')}
            className="px-4 py-2.5 rounded-full border border-[#EDE4E1] text-[#786665] hover:text-[#231817] hover:bg-[#FAF7F5] font-semibold text-xs transition-colors"
          >
            Log Out Now
          </button>
          <button
            type="button"
            onClick={dismissIdleWarning}
            className="px-5 py-2.5 rounded-full bg-[#FF644E] hover:bg-[#F04730] text-white font-semibold text-xs shadow-md shadow-[#FF644E]/20 transition-all"
          >
            Keep Working
          </button>
        </>
      }
    >
      <div className="space-y-3 text-sm text-[#786665] leading-relaxed">
        <p>
          You have been inactive for 25 minutes. In accordance with security compliance, your session will automatically terminate in 5 minutes unless you continue.
        </p>
        <div className="flex items-center gap-2 p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 text-xs text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Click &quot;Keep Working&quot; to reset your session clock.</span>
        </div>
      </div>
    </Modal>
  );
}
