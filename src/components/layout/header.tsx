// src/components/layout/header.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock,
  ShieldCheck,
  ChevronDown,
  LayoutDashboard,
  ShieldAlert,
  Bell,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useAuth } from '@/lib/context/auth-context';
import { useSidebar } from '@/lib/context/sidebar-context';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ConfirmationModal } from '@/components/common/confirmation-modal';
import { HamburgerIcon } from '@/components/ui/hamburger-icon';

interface HeaderProps {
  onToggleSidebar?: () => void;
  title: string;
  subtitle?: string;
}

export function Header({ onToggleSidebar, title, subtitle }: HeaderProps) {
  const { admin, logout } = useAuth();
  const { isCollapsed, toggleCollapsed, isMobileOpen, toggleMobileOpen } = useSidebar();
  const [timeString, setTimeString] = useState<string>('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const formatted = new Intl.DateTimeFormat(undefined, {
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'short',
        }).format(now);
        setTimeString(formatted);
      } catch {
        setTimeString(new Date().toLocaleTimeString());
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur-md border-b border-[#EDE4E1] px-6 py-4 transition-all">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Mobile hamburger, Desktop collapse button & Titles */}
          <div className="flex items-center gap-3">
            {/* Mobile menu drawer trigger — UIverse hamburger → X animation */}
            <HamburgerIcon
              isOpen={isMobileOpen}
              onClick={() => {
                toggleMobileOpen();
                onToggleSidebar?.();
              }}
              aria-controls="mobile-sidebar"
              className="-ml-2 md:hidden"
            />

            {/* Desktop collapse/expand button */}
            <button
              type="button"
              onClick={toggleCollapsed}
              className="hidden md:flex p-2 -ml-1 rounded-2xl text-[#786665] hover:text-[#FF644E] hover:bg-[#FFF0ED] border border-transparent hover:border-[#FFD5CC] transition-all cursor-pointer"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-5 h-5 text-[#FF644E]" />
              ) : (
                <PanelLeftClose className="w-5 h-5" />
              )}
            </button>

            <div>
              <h1 className="font-impact text-2xl text-[#231817] tracking-wide leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-[#786665] font-medium hidden sm:block mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right: Clock & Admin Profile Dropdown */}
          <div className="flex items-center gap-3">
            {/* Live Clock with Timezone */}
            <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF7F5] border border-[#EDE4E1] text-xs font-semibold text-[#786665]">
              <Clock className="w-3.5 h-3.5 text-[#FF644E]" />
              <span>{timeString}</span>
            </div>

            {/* Admin Profile Dropdown using Shadcn */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFF0ED] border border-[#FFD5CC] text-xs font-bold text-[#E03A22] hover:bg-[#FFE6E0] transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-[#FF644E]/20">
                <ShieldCheck className="w-4 h-4 text-[#FF644E]" />
                <span className="hidden sm:inline">{admin?.email || 'admin@example.com'}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="font-bold text-[#231817] truncate">{admin?.email}</div>
                  <div className="text-[10px] text-[#786665] font-normal">Super Admin</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center gap-2 w-full">
                    <LayoutDashboard className="w-4 h-4 text-[#786665]" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/reports" className="flex items-center gap-2 w-full">
                    <ShieldAlert className="w-4 h-4 text-[#786665]" />
                    <span>Review Reports</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/notifications" className="flex items-center gap-2 w-full">
                    <Bell className="w-4 h-4 text-[#786665]" />
                    <span>Broadcasts</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="danger"
                  onClick={() => setShowLogoutConfirm(true)}
                  className="flex items-center gap-2 text-rose-600 focus:text-rose-600"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
        }}
        title="Confirm Sign Out"
        description="Are you sure you want to sign out of Refrigerator Pictures Super Admin?"
        confirmLabel="Log Out"
        confirmVariant="danger"
      />
    </>
  );
}
