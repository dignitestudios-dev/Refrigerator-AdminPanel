// src/app/dashboard/layout.tsx
'use client';

import React from 'react';
import { SidebarProvider, useSidebar } from '@/lib/context/sidebar-context';
import { Sidebar } from '@/components/layout/sidebar';
import { IdleWarningModal } from '@/components/layout/idle-warning-modal';
import { OfflineModal } from '@/components/layout/offline-modal';
import { cn } from '@/lib/utils';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-[#FAF7F5] flex">
      {/* Collapsible Responsive Sidebar */}
      <Sidebar />

      {/* Main Content Area with smooth transition matching collapse state */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out",
          isCollapsed ? "md:pl-20" : "md:pl-72"
        )}
      >
        {children}
      </div>

      {/* 25-minute Idle Timeout Warning Modal */}
      <IdleWarningModal />

      {/* Persistent Offline Modal - blocks dashboard interactions when disconnected */}
      <OfflineModal />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}
