// src/app/dashboard/page.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  UserCheck,
  ShieldAlert,
  Image as ImageIcon,
  HeartHandshake,
  UserX,
  ArrowUpRight,
  Send,
  Activity,
  Flame,
  Utensils,
  PartyPopper,
} from 'lucide-react';
import { analyticsApi } from '@/lib/api/client';
import { Header } from '@/components/layout/header';
import { StatCardSkeleton } from '@/components/common/skeleton';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => analyticsApi.getStats(),
  });

  // Fetch blocked users count via workaround (§5 G2)
  const { data: blockedCount = 0, isLoading: blockedLoading } = useQuery({
    queryKey: ['blockedUsersCount'],
    queryFn: () => analyticsApi.getBlockedUsersCount(),
  });

  const isLoading = statsLoading || blockedLoading;

  const totalUsers = stats?.totalUsers ?? 0;
  const newToday = stats?.newUsersToday ?? 0;
  const activeUsers = stats?.activeUsers ?? 0;
  const totalPosts = stats?.totalPosts ?? 0;
  const pendingReports = stats?.pendingReports ?? 0;
  const totalFriendships = stats?.totalFriendships ?? 0;

  // Posts by category with safe 0 fallback (§5)
  const categoryPosts = {
    family: stats?.postsByCategory?.family ?? 0,
    food: stats?.postsByCategory?.food ?? 0,
    fun: stats?.postsByCategory?.fun ?? 0,
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header
        title="Dashboard"
        subtitle="Live platform metrics, community engagement, and moderation health."
      />

      <main className="p-6 sm:p-8 space-y-8 max-w-7xl">
        {/* Welcome Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#FF7565] via-[#FF644E] to-[#F5A623] p-8 text-white shadow-xl shadow-[#FF644E]/15">
          {/* Background refrigerator logo watermark */}
          <div className="absolute -right-4 -bottom-6 w-48 h-60 opacity-20 pointer-events-none select-none">
            <Image
              src="/logo.png"
              alt="Refrigerator Watermark"
              fill
              sizes="240px"
              className="object-contain brightness-0 invert"
              priority
            />
          </div>

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider mb-3">
              <Activity className="w-3.5 h-3.5 text-white" />
              <span>Real-Time Overview</span>
            </div>
            <div className="flex items-center gap-3.5 mb-1">
              <div className="relative w-11 h-14 shrink-0 drop-shadow-md">
                <Image
                  src="/logo.png"
                  alt="Refrigerator Logo"
                  fill
                  sizes="48px"
                  className="object-contain"
                  priority
                />
              </div>
              <h2 className="font-impact text-3xl sm:text-4xl tracking-wide leading-tight">
                REFRIGERATOR PICTURES
              </h2>
            </div>
            <p className="text-sm sm:text-base text-white/90 mt-2 font-medium leading-relaxed">
              Moderation feeds, social connections, and community broadcasts are synchronized. All active accounts are protected.
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-6">
              <button
                onClick={() => router.push('/dashboard/reports?status=pending')}
                className="px-5 py-2.5 rounded-full bg-white text-[#231817] text-xs font-bold shadow-md hover:bg-[#FAF7F5] transition-all flex items-center gap-2"
              >
                <ShieldAlert className="w-4 h-4 text-[#FF644E]" />
                Review Pending Reports ({pendingReports})
              </button>
              <button
                onClick={() => router.push('/dashboard/notifications')}
                className="px-5 py-2.5 rounded-full bg-black/20 hover:bg-black/30 backdrop-blur-md text-white text-xs font-bold border border-white/20 transition-all flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Broadcast Push
              </button>
            </div>
          </div>
        </div>

        {/* Primary KPI Metrics Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-impact text-xl text-[#231817] tracking-wider uppercase">
              Core Statistics
            </h3>
            <span className="text-xs text-[#786665] font-semibold">
              Click any card to view detailed records
            </span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Users */}
              <div
                onClick={() => router.push('/dashboard/users')}
                className="group bg-white rounded-3xl p-6 border border-[#EDE4E1] hover:border-[#FFB1A2] shadow-xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-[#786665] uppercase tracking-wider">
                    Total Users
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-[#FFF0ED] text-[#FF644E] flex items-center justify-center transition-colors group-hover:bg-[#FF644E] group-hover:text-white">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="font-impact text-3xl text-[#231817]">
                  {totalUsers}
                </div>
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 mt-2">
                  <span>+{newToday} joined today</span>
                  <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              {/* Card 2: Active Users */}
              <div
                onClick={() => router.push('/dashboard/users?status=active')}
                className="group bg-white rounded-3xl p-6 border border-[#EDE4E1] hover:border-[#FFB1A2] shadow-xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-[#786665] uppercase tracking-wider">
                    Active Live Sessions
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                    <UserCheck className="w-5 h-5" />
                  </div>
                </div>
                <div className="font-impact text-3xl text-[#231817]">
                  {activeUsers}
                </div>
                <div className="flex items-center justify-between text-xs font-semibold text-[#786665] mt-2">
                  <span>Currently signed in</span>
                  <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              {/* Card 3: Total Posts */}
              <div
                onClick={() => router.push('/dashboard/content')}
                className="group bg-white rounded-3xl p-6 border border-[#EDE4E1] hover:border-[#FFB1A2] shadow-xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-[#786665] uppercase tracking-wider">
                    Total Posts
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-[#FEF7EC] text-[#F5A623] flex items-center justify-center transition-colors group-hover:bg-[#F5A623] group-hover:text-white">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                </div>
                <div className="font-impact text-3xl text-[#231817]">
                  {totalPosts}
                </div>
                <div className="flex items-center justify-between text-xs font-semibold text-[#786665] mt-2">
                  <span>Across all fridges</span>
                  <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              {/* Card 4: Pending Reports */}
              <div
                onClick={() => router.push('/dashboard/reports?status=pending')}
                className={cn(
                  "group bg-white rounded-3xl p-6 border transition-all cursor-pointer relative overflow-hidden",
                  pendingReports > 0
                    ? "border-rose-200 bg-rose-50/20 hover:border-rose-300"
                    : "border-[#EDE4E1] hover:border-[#FFB1A2]"
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-[#786665] uppercase tracking-wider">
                    Pending Reports
                  </span>
                  <div
                    className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center transition-colors",
                      pendingReports > 0
                        ? "bg-rose-100 text-rose-600 group-hover:bg-rose-600 group-hover:text-white"
                        : "bg-[#FAF7F5] text-[#786665]"
                    )}
                  >
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                </div>
                <div
                  className={cn(
                    "font-impact text-3xl",
                    pendingReports > 0 ? "text-rose-600" : "text-[#231817]"
                  )}
                >
                  {pendingReports}
                </div>
                <div className="flex items-center justify-between text-xs font-semibold text-rose-600 mt-2">
                  <span>Requires superadmin review</span>
                  <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Secondary Row: Refrigerator Magnets & Posts Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Posts by Magnet Category */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-[#EDE4E1] shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="font-impact text-lg text-[#231817] tracking-wider uppercase">
                  Posts by Category
                </h4>
                <p className="text-xs text-[#786665] mt-0.5">
                  Breakdown across the three core refrigerator magnet categories
                </p>
              </div>
              <div className="p-2 rounded-xl bg-[#FFF0ED] text-[#FF644E]">
                <Flame className="w-4 h-4" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Category 1: Family */}
              <div
                onClick={() => router.push('/dashboard/content?category=family')}
                className="p-5 rounded-2xl bg-[#FFF0ED] border border-[#FFD5CC] hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#E03A22] uppercase tracking-wider">
                    Family
                  </span>
                  <Users className="w-5 h-5 text-[#E03A22]" />
                </div>
                <div className="font-impact text-3xl text-[#E03A22]">
                  {categoryPosts.family}
                </div>
                <p className="text-xs font-medium text-[#786665] mt-1">
                  Shared family moments & dinners
                </p>
              </div>

              {/* Category 2: Food */}
              <div
                onClick={() => router.push('/dashboard/content?category=food')}
                className="p-5 rounded-2xl bg-[#FEF7EC] border border-[#FDE3B6] hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#B46F04] uppercase tracking-wider">
                    Food
                  </span>
                  <Utensils className="w-5 h-5 text-[#B46F04]" />
                </div>
                <div className="font-impact text-3xl text-[#B46F04]">
                  {categoryPosts.food}
                </div>
                <p className="text-xs font-medium text-[#786665] mt-1">
                  Recipes & homemade delicacies
                </p>
              </div>

              {/* Category 3: Fun */}
              <div
                onClick={() => router.push('/dashboard/content?category=fun')}
                className="p-5 rounded-2xl bg-sky-50 border border-sky-200 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">
                    Fun
                  </span>
                  <PartyPopper className="w-5 h-5 text-sky-700" />
                </div>
                <div className="font-impact text-3xl text-sky-700">
                  {categoryPosts.fun}
                </div>
                <p className="text-xs font-medium text-[#786665] mt-1">
                  Adventures & polaroid snapshots
                </p>
              </div>
            </div>
          </div>

          {/* Social Health & Blocked Accounts Summary */}
          <div className="bg-white rounded-3xl p-6 border border-[#EDE4E1] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-impact text-lg text-[#231817] tracking-wider uppercase">
                  Platform Health
                </h4>
                <div className="p-2 rounded-xl bg-[#FAF7F5] text-[#786665]">
                  <Activity className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-4">
                {/* Friendships */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF7F5] border border-[#EDE4E1]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-pink-100 text-pink-600">
                      <HeartHandshake className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#231817]">Friendships</div>
                      <div className="text-[11px] text-[#786665]">Mutual connections</div>
                    </div>
                  </div>
                  <div className="font-impact text-xl text-[#231817]">
                    {totalFriendships}
                  </div>
                </div>

                {/* Blocked Accounts Card (§5 G2 Workaround) */}
                <div
                  onClick={() => router.push('/dashboard/users?status=blocked')}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 hover:border-amber-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                      <UserX className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#231817]">Blocked Accounts</div>
                      <div className="text-[11px] text-[#786665]">Suspended by superadmin</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="font-impact text-xl text-amber-800">
                      {blockedCount}
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#EDE4E1] mt-4">
              <button
                onClick={() => router.push('/dashboard/pipeline')}
                className="w-full py-2.5 px-4 rounded-full border border-[#EDE4E1] hover:border-[#FFB1A2] text-xs font-bold text-[#786665] hover:text-[#231817] transition-all flex items-center justify-center gap-2"
              >
                <Activity className="w-3.5 h-3.5 text-[#FF644E]" />
                Inspect Video Processing Pipeline
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
