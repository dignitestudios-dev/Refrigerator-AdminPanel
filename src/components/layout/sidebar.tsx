// src/components/layout/sidebar.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Image as ImageIcon,
  Bell,
  ShieldAlert,
  Activity,
  LogOut,
  MoreVertical,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/context/auth-context';
import { useSidebar } from '@/lib/context/sidebar-context';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { ConfirmationModal } from '@/components/common/confirmation-modal';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen: propIsOpen, onClose: propOnClose }: SidebarProps) {
  const pathname = usePathname();
  const { admin, logout } = useAuth();
  const {
    isCollapsed,
    toggleCollapsed,
    isMobileOpen,
    closeMobile,
  } = useSidebar();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Allow optional props to override context for mobile drawer
  const effectiveIsOpen = propIsOpen !== undefined ? propIsOpen : isMobileOpen;
  const effectiveOnClose = propOnClose !== undefined ? propOnClose : closeMobile;

  // Fetch live pending reports count for sidebar badge indicator
  const { data: stats } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => analyticsApi.getStats(),
    refetchInterval: 60000,
  });

  const pendingReportsCount = stats?.pendingReports ?? 0;

  const navSections = [
    {
      title: 'Platform Core',
      items: [
        {
          label: 'Dashboard',
          href: '/dashboard',
          icon: LayoutDashboard,
        },
        {
          label: 'User Management',
          href: '/dashboard/users',
          icon: Users,
        },
      ],
    },
    {
      title: 'Moderation & Feeds',
      items: [
        {
          label: 'Content Moderation',
          href: '/dashboard/content',
          icon: ImageIcon,
        },
        {
          label: 'Reports & Chats',
          href: '/dashboard/reports',
          icon: ShieldAlert,
          badge: pendingReportsCount > 0 ? pendingReportsCount : undefined,
        },
        {
          label: 'Broadcasts',
          href: '/dashboard/notifications',
          icon: Bell,
        },
      ],
    },
    {
      title: 'Infrastructure',
      items: [
        {
          label: 'Pipeline Health',
          href: '/dashboard/pipeline',
          icon: Activity,
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {effectiveIsOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#231817]/40 backdrop-blur-xs md:hidden transition-opacity"
          onClick={effectiveOnClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        id="mobile-sidebar"
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 bg-white border-r border-[#EDE4E1] flex flex-col transition-all duration-300 ease-in-out shadow-xs",
          // Mobile: always full width. Desktop: respect collapsed state
          "w-72",
          isCollapsed && "md:w-20",
          // Mobile: slide in/out. Desktop: always visible, no translate
          effectiveIsOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Brand / Logo Header */}
        <div
          className={cn(
            "border-b border-[#EDE4E1] flex items-center transition-all bg-gradient-to-b from-[#FFF5F3]/70 to-white",
            // Only collapse brand header at md+ breakpoint
            isCollapsed ? "p-5 justify-between gap-3 md:p-4 md:justify-center md:flex-col md:gap-2" : "p-5 justify-between gap-3"
          )}
        >
          {isCollapsed ? (
            /* Collapsed Brand Header — only on desktop (md+) */
            <>
              {/* Mobile: always show full expanded brand even when desktop is collapsed */}
              <div className="md:hidden flex items-center justify-between w-full min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <Link
                    href="/dashboard"
                    className="relative w-10 h-12 shrink-0 drop-shadow-xs transition-transform hover:scale-105"
                  >
                    <Image
                      src="/logo.png"
                      alt="Refrigerator Logo"
                      fill
                      sizes="48px"
                      className="object-contain"
                      priority
                    />
                  </Link>
                  <div className="min-w-0">
                    <div className="font-impact text-xl text-[#231817] tracking-wider flex items-center gap-1.5 leading-none">
                      <span>REFRIGERATOR</span>
                      <span className="text-[9px] font-sans font-extrabold px-1.5 py-0.5 rounded-full bg-[#FF644E] text-white tracking-normal">
                        PRO
                      </span>
                    </div>
                    <div className="text-[11px] text-[#786665] font-semibold mt-1 truncate">
                      Super Admin
                    </div>
                  </div>
                </div>

                {/* Mobile close button (X) */}
                <button
                  type="button"
                  onClick={effectiveOnClose}
                  className="p-2 rounded-xl text-[#786665] hover:text-[#FF644E] hover:bg-[#FFF0ED] border border-transparent hover:border-[#FFD5CC] transition-all cursor-pointer shrink-0"
                  title="Close Sidebar"
                  aria-label="Close Sidebar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Desktop collapsed: just icon + expand button */}
              <div className="hidden md:flex flex-col items-center gap-2">
                <Link
                  href="/dashboard"
                  className="relative w-8 h-10 shrink-0 drop-shadow-xs transition-transform hover:scale-105"
                  title="Refrigerator Pictures Admin"
                >
                  <Image
                    src="/logo.png"
                    alt="Refrigerator Logo"
                    fill
                    sizes="32px"
                    className="object-contain"
                    priority
                  />
                </Link>
                <button
                  type="button"
                  onClick={toggleCollapsed}
                  className="p-1.5 rounded-xl text-[#786665] hover:text-[#FF644E] hover:bg-[#FFF0ED] border border-transparent hover:border-[#FFD5CC] transition-all cursor-pointer"
                  title="Expand Sidebar"
                  aria-label="Expand Sidebar"
                >
                  <PanelLeftOpen className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            /* Expanded Brand Header */
            <>
              <div className="flex items-center gap-3 min-w-0">
                <Link
                  href="/dashboard"
                  className="relative w-10 h-12 shrink-0 drop-shadow-xs transition-transform hover:scale-105"
                >
                  <Image
                    src="/logo.png"
                    alt="Refrigerator Logo"
                    fill
                    sizes="48px"
                    className="object-contain"
                    priority
                  />
                </Link>
                <div className="min-w-0">
                  <div className="font-impact text-xl text-[#231817] tracking-wider flex items-center gap-1.5 leading-none">
                    <span>REFRIGERATOR</span>
                    <span className="text-[9px] font-sans font-extrabold px-1.5 py-0.5 rounded-full bg-[#FF644E] text-white tracking-normal">
                      PRO
                    </span>
                  </div>
                  <div className="text-[11px] text-[#786665] font-semibold mt-1 truncate">
                    Super Admin
                  </div>
                </div>
              </div>

              {/* Collapse Button — desktop only */}
              <button
                type="button"
                onClick={toggleCollapsed}
                className="hidden md:flex p-2 rounded-xl text-[#786665] hover:text-[#FF644E] hover:bg-[#FFF0ED] border border-transparent hover:border-[#FFD5CC] transition-all cursor-pointer shrink-0"
                title="Collapse Sidebar"
                aria-label="Collapse Sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
              {/* Mobile: close button (X) */}
              <button
                type="button"
                onClick={effectiveOnClose}
                className="md:hidden p-2 rounded-xl text-[#786665] hover:text-[#FF644E] hover:bg-[#FFF0ED] border border-transparent hover:border-[#FFD5CC] transition-all cursor-pointer shrink-0"
                title="Close Sidebar"
                aria-label="Close Sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Navigation Links */}
        <nav
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden space-y-5",
            // On mobile always expanded padding; on desktop respect collapse
            isCollapsed ? "p-4 md:p-2" : "p-4"
          )}
        >
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {/* Section Header (Expanded Only) */}
              {!isCollapsed && (
                <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[#9A8785]">
                  {section.title}
                </div>
              )}

              {section.items.map((item) => {
                const isActive =
                  item.href === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname.startsWith(item.href);
                const Icon = item.icon;
                // On mobile, sidebar is always expanded; on desktop respect isCollapsed
                const showCollapsed = isCollapsed;

                return (
                  <div key={item.href} className="relative group">
                    <Link
                      href={item.href}
                      onClick={effectiveOnClose}
                      className={cn(
                        "flex items-center rounded-2xl transition-all duration-200 cursor-pointer relative",
                        showCollapsed
                          ? "md:w-12 md:h-12 md:mx-auto md:justify-center justify-between px-3.5 py-2.5 text-xs font-semibold"
                          : "justify-between px-3.5 py-2.5 text-xs font-semibold",
                        isActive
                          ? showCollapsed
                            ? "bg-[#FFF0ED] text-[#E03A22] border border-[#FFD5CC]/80 shadow-xs font-bold md:bg-[#FF644E] md:text-white md:shadow-md md:shadow-[#FF644E]/25 md:border-transparent"
                            : "bg-[#FFF0ED] text-[#E03A22] border border-[#FFD5CC]/80 shadow-xs font-bold"
                          : "text-[#786665] hover:text-[#231817] hover:bg-[#FAF7F5]"
                      )}
                    >
                      <div className={cn("flex items-center", showCollapsed ? "md:justify-center gap-3" : "gap-3")}>
                        <div
                          className={cn(
                            "rounded-xl transition-colors",
                            showCollapsed
                              ? cn(
                                  "p-1.5",
                                  isActive
                                    ? "bg-[#FF644E] text-white md:bg-transparent md:p-0"
                                    : "text-[#786665] group-hover:text-[#231817] group-hover:bg-[#EDE4E1]/50"
                                )
                              : cn(
                                  "p-1.5",
                                  isActive
                                    ? "bg-[#FF644E] text-white"
                                    : "text-[#786665] group-hover:text-[#231817] group-hover:bg-[#EDE4E1]/50"
                                )
                          )}
                        >
                          <Icon className={cn("w-4 h-4 shrink-0", showCollapsed && isActive && "md:text-white")} />
                        </div>
                        {/* Always show label on mobile; hide on desktop when collapsed */}
                        <span className={cn("truncate", showCollapsed && "md:hidden")}>{item.label}</span>
                      </div>

                      {/* Badge: always visible in expanded; hidden on desktop collapsed */}
                      {item.badge !== undefined && (
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FF644E] text-white shadow-xs shrink-0",
                          showCollapsed && "md:hidden"
                        )}>
                          {item.badge}
                        </span>
                      )}

                      {/* Badge Dot in Desktop Collapsed Mode only */}
                      {showCollapsed && item.badge !== undefined && (
                        <span
                          className={cn(
                            "hidden md:block absolute top-2 right-2 w-2 h-2 rounded-full",
                            isActive ? "bg-white ring-2 ring-[#FF644E]" : "bg-[#FF644E] ring-2 ring-white"
                          )}
                        />
                      )}
                    </Link>

                    {/* Floating Tooltip in Desktop Collapsed Mode */}
                    {showCollapsed && (
                      <div className="hidden md:block absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-[#231817] text-white text-xs font-semibold rounded-xl shadow-xl pointer-events-none whitespace-nowrap z-50 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all">
                        <div className="flex items-center gap-1.5">
                          <span>{item.label}</span>
                          {item.badge !== undefined && (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-[#FF644E] text-white font-bold">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        {/* Caret pointing left */}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#231817]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Refrigerator Magnet Motif Card (Expanded, and always on mobile) */}
        <div className={cn(isCollapsed && "hidden md:hidden")}>
          {(!isCollapsed) && (
            <div className="p-3.5 mx-4 mb-3 rounded-2xl bg-gradient-to-br from-[#FFF5F3] to-[#FEF7EC] border border-[#FFD5CC] shadow-xs">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-3.5 h-3.5 text-[#F5A623]" />
                <span className="text-xs font-bold text-[#231817]">Fridge Social Sync</span>
              </div>
              <p className="text-[11px] text-[#786665] leading-relaxed">
                Moderation &amp; broadcasts sync to user refrigerators in real time.
              </p>
            </div>
          )}
        </div>

        {/* Bottom User Profile Section */}
        <div
          className={cn(
            "border-t border-[#EDE4E1] bg-white transition-all",
            // Desktop collapsed: center the avatar; mobile: always full padding
            isCollapsed ? "p-4 md:p-3 md:flex md:justify-center" : "p-4"
          )}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "rounded-2xl transition-all cursor-pointer text-left outline-none group border border-[#EDE4E1] hover:border-[#FFD5CC] hover:bg-[#FFF0ED]",
                  // Mobile: always full-width. Desktop: respect collapse
                  isCollapsed
                    ? "w-full flex items-center justify-between gap-3 p-2.5 bg-[#FAF7F5] md:w-12 md:h-12 md:justify-center md:p-0"
                    : "w-full flex items-center justify-between gap-3 p-2.5 bg-[#FAF7F5]"
                )}
                title={isCollapsed ? `Superadmin (${admin?.email || 'admin'})` : undefined}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative w-9 h-9 rounded-full bg-gradient-to-tr from-[#FF7565] to-[#F5A623] flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
                    SA
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </div>
                  {/* Always show email on mobile; hide on desktop when collapsed */}
                  <div className={cn("min-w-0", isCollapsed && "md:hidden")}>
                    <div className="text-xs font-bold text-[#231817] truncate">
                      {admin?.email || 'admin@refrigeratorapp.com'}
                    </div>
                    <div className="text-[10px] text-[#786665] font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Superadmin
                    </div>
                  </div>
                </div>
                <MoreVertical className={cn("w-4 h-4 text-[#786665] group-hover:text-[#231817] shrink-0", isCollapsed && "md:hidden")} />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              side={isCollapsed ? "right" : "top"}
              align={isCollapsed ? "end" : "start"}
              className="w-64 z-50 bg-white border border-[#EDE4E1] shadow-xl rounded-2xl"
            >
              <DropdownMenuLabel>
                <div className="font-bold text-[#231817] truncate">{admin?.email}</div>
                <div className="text-[10px] text-[#786665] font-normal">Super Admin</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard" className="flex items-center gap-2 w-full cursor-pointer">
                  <LayoutDashboard className="w-4 h-4 text-[#786665]" />
                  <span>Dashboard Overview</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/reports" className="flex items-center gap-2 w-full cursor-pointer">
                  <ShieldAlert className="w-4 h-4 text-[#786665]" />
                  <span>Moderate Reports</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/notifications" className="flex items-center gap-2 w-full cursor-pointer">
                  <Bell className="w-4 h-4 text-[#786665]" />
                  <span>Notification Broadcasts</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="danger"
                onClick={() => setShowLogoutConfirm(true)}
                className="flex items-center gap-2 text-rose-600 focus:text-rose-600 cursor-pointer font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Logout Confirmation Modal (§11, Operation Confirmation) */}
      <ConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
        }}
        title="Confirm Sign Out"
        description="Are you sure you want to log out of Refrigerator Pictures Super Admin? You will need to sign in again to manage moderators and user feeds."
        confirmLabel="Log Out"
        confirmVariant="danger"
      />
    </>
  );
}
