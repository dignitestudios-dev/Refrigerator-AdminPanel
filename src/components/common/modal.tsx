// src/components/common/modal.tsx
'use client';

import React, { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
}: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size={size} className={className}>
        {(title || description) && (
          <DialogHeader>
            {title && (
              <DialogTitle className="text-lg font-bold text-[#231817] leading-snug break-all">
                {title}
              </DialogTitle>
            )}
            {description && (
              <DialogDescription className="text-xs sm:text-sm text-[#786665] break-all">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
        )}

        <div className="py-2 overflow-y-auto flex-1 break-all no-scrollbar">{children}</div>

        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
