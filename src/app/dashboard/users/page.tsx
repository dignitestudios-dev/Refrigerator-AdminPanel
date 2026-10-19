// src/app/dashboard/users/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  User,
  Users,
  Trash2,
  Lock,
  Unlock,
  CheckCircle2,
  Calendar,
  Compass,
  Utensils,
  PartyPopper,
  Eye,
  Mail,
  Award,
  RotateCcw,
} from 'lucide-react';
import Image from 'next/image';
import { usersApi } from '@/lib/api/client';
import { UserListItem, ContentListItem } from '@/types/api';
import { Header } from '@/components/layout/header';
import { DataTable, Column } from '@/components/common/data-table';
import { Badge } from '@/components/common/badge';
import { Modal } from '@/components/common/modal';
import { ConfirmationModal } from '@/components/common/confirmation-modal';
import { DetailSkeleton } from '@/components/common/skeleton';
import { useToast } from '@/lib/context/toast-context';
import { formatDateTimeWithTz, formatDateOnly, capitalize, cn } from '@/lib/utils';
import { actionReasonSchema, ActionReasonFormData } from '@/lib/validations/action-schema';
import { useDebounce } from '@/lib/hooks/use-debounce';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Toggle } from '@/components/ui/toggle';
import { MoreVertical } from 'lucide-react';

function UsersContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status');

  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  // Filter & Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  // Reset page to 1 whenever debounced search term changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const [statusFilter, setStatusFilter] = useState<string>(
    initialStatus === 'blocked' ? 'blocked' : initialStatus === 'active' ? 'active' : 'all'
  );
  const [sortBy, setSortBy] = useState<'createdAt' | 'name'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [showDeleted, setShowDeleted] = useState(false);

  const hasActiveFilters = Boolean(
    search ||
    statusFilter !== 'all' ||
    sortBy !== 'createdAt' ||
    sortOrder !== 'desc' ||
    showDeleted
  );

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setSortBy('createdAt');
    setSortOrder('desc');
    setShowDeleted(false);
    setPage(1);
  };

  // Detail Modal state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Action Modals state
  const [blockModalUser, setBlockModalUser] = useState<UserListItem | null>(null);
  const [unblockModalUser, setUnblockModalUser] = useState<UserListItem | null>(null);
  const [deleteModalUser, setDeleteModalUser] = useState<UserListItem | null>(null);

  // RHF for Block Reason
  const {
    register: registerBlock,
    handleSubmit: handleBlockSubmit,
    reset: resetBlockForm,
    watch: watchBlock,
    formState: { errors: blockErrors },
  } = useForm<ActionReasonFormData>({
    resolver: zodResolver(actionReasonSchema),
    defaultValues: {
      reason: '',
    },
  });

  const blockReasonValue = watchBlock('reason') || '';

  // Map statusFilter to isDeactivatedByAdmin
  const isDeactivatedByAdmin =
    statusFilter === 'blocked' ? 'true' : statusFilter === 'active' ? 'false' : undefined;

  // Fetch Users List
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['usersList', page, limit, debouncedSearch, isDeactivatedByAdmin, showDeleted, sortBy, sortOrder],
    queryFn: () =>
      usersApi.getUsers({
        page,
        limit,
        search: debouncedSearch,
        isDeactivatedByAdmin,
        showDeleted: showDeleted ? 'true' : undefined,
        sortBy,
        sortOrder,
      }),
  });

  // Fetch Single User Detail
  const { data: userDetail, isLoading: isDetailLoading } = useQuery({
    queryKey: ['userDetail', selectedUserId],
    queryFn: () => (selectedUserId ? usersApi.getUserDetail(selectedUserId) : null),
    enabled: !!selectedUserId,
  });

  // Fetch Removed Posts for User
  const { data: removedPostsData } = useQuery({
    queryKey: ['userRemovedPosts', selectedUserId],
    queryFn: () => (selectedUserId ? usersApi.getUserRemovedPosts(selectedUserId) : null),
    enabled: !!selectedUserId,
  });

  // Block/Deactivate Mutation
  const blockMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      usersApi.updateStatus(userId, 'deactivate', reason),
    onSuccess: (res) => {
      success(res.message || 'User suspended successfully');
      queryClient.invalidateQueries({ queryKey: ['usersList'] });
      queryClient.invalidateQueries({ queryKey: ['userDetail'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setBlockModalUser(null);
      resetBlockForm();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        'Failed to suspend user';
      toastError(msg);
    },
  });

  // Unblock/Activate Mutation
  const unblockMutation = useMutation({
    mutationFn: (userId: string) => usersApi.updateStatus(userId, 'activate'),
    onSuccess: (res) => {
      success(res.message || 'User activated successfully');
      queryClient.invalidateQueries({ queryKey: ['usersList'] });
      queryClient.invalidateQueries({ queryKey: ['userDetail'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setUnblockModalUser(null);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        'Failed to activate user';
      toastError(msg);
    },
  });

  // Delete User Mutation
  const deleteMutation = useMutation({
    mutationFn: (userId: string) => usersApi.deleteUser(userId),
    onSuccess: (res) => {
      success(res.message || 'User deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['usersList'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setDeleteModalUser(null);
      setSelectedUserId(null);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        'Failed to delete user';
      toastError(msg);
    },
  });

  const onConfirmBlock = (data: ActionReasonFormData) => {
    if (!blockModalUser) return;
    blockMutation.mutate({
      userId: blockModalUser._id,
      reason: data.reason,
    });
  };

  // Table Columns
  const columns: Column<UserListItem>[] = [
    {
      header: 'User',
      className: 'min-w-[190px]',
      headerClassName: 'whitespace-nowrap',
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full bg-[#FAF7F5] border border-[#EDE4E1] flex items-center justify-center text-[#786665] overflow-hidden shrink-0">
            {u.profilePicture?.location ? (
              <Image
                src={u.profilePicture.location}
                alt={u.name || 'User'}
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : (
              <User className="w-5 h-5" />
            )}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-[#231817] flex items-center gap-1.5">
              <span className="break-words">{u.name || 'Anonymous User'}</span>
              {u.isEmailVerified && (
                <span title="Email Verified" className="shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                </span>
              )}
            </div>
            <div className="text-xs text-[#786665] break-all">@{u.username || 'unnamed'}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Email',
      className: 'min-w-[220px] max-w-[340px]',
      headerClassName: 'whitespace-nowrap',
      render: (u) => (
        <div className="text-xs font-medium text-[#786665] flex items-start gap-1.5">
          <Mail className="w-3.5 h-3.5 text-[#9A8785] shrink-0 mt-0.5" />
          <span className="break-all leading-relaxed">{u.email}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      className: 'whitespace-nowrap w-[120px]',
      headerClassName: 'whitespace-nowrap',
      render: (u) => {
        if (u.isDeleted) return <Badge variant="deleted">Deleted</Badge>;
        if (u.isDeactivatedByAdmin) return <Badge variant="blocked">Blocked</Badge>;
        return <Badge variant="active">Active</Badge>;
      },
    },
    {
      header: 'Profile Completed',
      className: 'whitespace-nowrap w-[150px]',
      headerClassName: 'whitespace-nowrap',
      render: (u) => (
        <span className="text-xs font-semibold text-[#786665] whitespace-nowrap">
          {u.isProfileCompleted ? 'Complete' : 'Incomplete'}
        </span>
      ),
    },
    {
      header: 'Joined Date',
      className: 'whitespace-nowrap w-[130px]',
      headerClassName: 'whitespace-nowrap',
      render: (u) => (
        <div className="text-xs text-[#786665] flex items-center gap-1.5 whitespace-nowrap">
          <Calendar className="w-3.5 h-3.5 text-[#9A8785] shrink-0" />
          <span>{formatDateOnly(u.createdAt)}</span>
        </div>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right whitespace-nowrap w-[80px]',
      headerClassName: 'text-right whitespace-nowrap',
      render: (u) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setSelectedUserId(u._id)}
            className="p-2 rounded-xl text-[#786665] hover:text-[#231817] hover:bg-[#FAF7F5] transition-colors cursor-pointer"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Action Dropdown Menu from Shadcn */}
          {!u.isDeleted && (
            <DropdownMenu>
              <DropdownMenuTrigger className="p-2 rounded-xl text-[#786665] hover:text-[#231817] hover:bg-[#FAF7F5] transition-colors cursor-pointer outline-none">
                <MoreVertical className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSelectedUserId(u._id)}>
                  <Eye className="w-4 h-4 mr-1 text-[#786665]" />
                  <span>Inspect Account</span>
                </DropdownMenuItem>

                {u.isDeactivatedByAdmin ? (
                  <DropdownMenuItem onClick={() => setUnblockModalUser(u)}>
                    <Unlock className="w-4 h-4 mr-1 text-emerald-600" />
                    <span className="text-emerald-700">Activate Account</span>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => {
                      resetBlockForm();
                      setBlockModalUser(u);
                    }}
                  >
                    <Lock className="w-4 h-4 mr-1 text-amber-600" />
                    <span className="text-amber-700">Suspend Account</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="danger"
                  onClick={() => setDeleteModalUser(u)}
                >
                  <Trash2 className="w-4 h-4 mr-1 text-rose-600" />
                  <span>Delete User</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header
        title="User Management"
        subtitle="Search, inspect refrigerator owners, moderate accounts, and review profiles."
      />

      <main className="p-6 sm:p-8 space-y-6 max-w-7xl">
        <DataTable<UserListItem>
          columns={columns}
          data={usersData?.users || []}
          keyExtractor={(u) => u._id}
          isLoading={isLoading}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name, username or email..."
          filterSlot={
            <>
              {/* Status Filter using Shadcn Select */}
              <div className="w-36">
                <Select
                  value={statusFilter}
                  onValueChange={(val) => {
                    setStatusFilter(val);
                    setPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="blocked">Blocked Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By Filter using Shadcn Select */}
              <div className="w-40">
                <Select
                  value={`${sortBy}-${sortOrder}`}
                  onValueChange={(val) => {
                    const [field, ord] = val.split('-');
                    setSortBy(field as 'createdAt' | 'name');
                    setSortOrder(ord as 'asc' | 'desc');
                    setPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sort order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt-desc">Newest First</SelectItem>
                    <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                    <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Include Deleted Toggle (Shadcn Toggle) */}
              <Toggle
                pressed={showDeleted}
                onPressedChange={(pressed) => {
                  setShowDeleted(pressed);
                  setPage(1);
                }}
                aria-label="Include deleted user accounts"
                className={cn(
                  "h-10 px-3.5 rounded-full border transition-all text-xs font-bold gap-2 cursor-pointer shadow-2xs select-none",
                  showDeleted
                    ? "bg-[#FFF0ED] border-[#FFB1A2] text-[#FF644E] hover:bg-[#FFE5E0] hover:text-[#E03A22] shadow-xs"
                    : "bg-white border-[#EDE4E1] text-[#786665] hover:bg-[#FAF7F5] hover:border-[#FFB1A2] hover:text-[#231817]"
                )}
              >
                <Trash2
                  className={cn(
                    "w-3.5 h-3.5 transition-colors",
                    showDeleted ? "text-[#FF644E]" : "text-[#9A8785]"
                  )}
                />
                <span>Include Deleted</span>
                <span
                  className={cn(
                    "relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors ml-0.5",
                    showDeleted ? "bg-[#FF644E]" : "bg-[#EDE4E1]"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-3 w-3 rounded-full bg-white shadow-xs transition-transform",
                      showDeleted ? "translate-x-3.5" : "translate-x-0.5"
                    )}
                  />
                </span>
              </Toggle>

              {/* Clear All Filters Button */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="h-10 px-3.5 rounded-full border border-dashed border-[#EDE4E1] hover:border-rose-300 bg-white hover:bg-rose-50 text-xs font-semibold text-[#786665] hover:text-rose-600 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0 select-none"
                  title="Clear all filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear All Filters</span>
                </button>
              )}
            </>
          }
          pagination={usersData?.pagination}
          onPageChange={setPage}
          onRowClick={(u) => setSelectedUserId(u._id)}
          emptyTitle="No users found"
          emptyMessage="No user accounts matched your search terms or filter criteria."
        />

        {/* User Detail Modal */}
        <Modal
          isOpen={!!selectedUserId}
          onClose={() => setSelectedUserId(null)}
          size="lg"
          title="User Account & Refrigerator Profile"
          description="Detailed breakdown of user activity, magnets earned, and moderation history."
        >
          {isDetailLoading || !userDetail ? (
            <DetailSkeleton />
          ) : (
            <div className="space-y-6">
              {/* Profile Card Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-[#FAF7F5] border border-[#EDE4E1]">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-3xl bg-white border border-[#EDE4E1] overflow-hidden flex items-center justify-center shadow-xs shrink-0">
                    {userDetail.user.profilePicture?.location ? (
                      <Image
                        src={userDetail.user.profilePicture.location}
                        alt={userDetail.user.name || 'User'}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-[#786665]" />
                    )}
                  </div>
                  <div className="min-w-0 break-all">
                    <h4 className="font-bold text-lg text-[#231817] break-all">
                      {userDetail.user.name || 'Unnamed User'}
                    </h4>
                    <p className="text-xs text-[#786665] break-all">@{userDetail.user.username} • {userDetail.user.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {userDetail.user.isDeleted ? (
                        <Badge variant="deleted">Deleted</Badge>
                      ) : userDetail.user.isDeactivatedByAdmin ? (
                        <Badge variant="blocked">Suspended by Superadmin</Badge>
                      ) : (
                        <Badge variant="active">Active</Badge>
                      )}
                      <span className="text-[11px] font-semibold text-[#786665] px-2 py-0.5 rounded-full bg-white border border-[#EDE4E1]">
                        Method: {capitalize(userDetail.user.method || 'email')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Toggle inside Detail */}
                {!userDetail.user.isDeleted && (
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {userDetail.user.isDeactivatedByAdmin ? (
                      <button
                        onClick={() => setUnblockModalUser(userDetail.user)}
                        className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        Activate Account
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          resetBlockForm();
                          setBlockModalUser(userDetail.user);
                        }}
                        className="px-4 py-2 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        Suspend Account
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Bio & Deactivation Reason if present */}
              {userDetail.user.deactivationReason && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs break-all">
                  <span className="font-bold uppercase tracking-wider block mb-1">
                    Deactivation Reason
                  </span>
                  <span className="break-all">{userDetail.user.deactivationReason}</span>
                </div>
              )}

              {userDetail.user.bio && (
                <div className="p-4 rounded-2xl bg-white border border-[#EDE4E1] text-xs text-[#231817] break-all">
                  <span className="font-bold text-[#786665] block mb-1 uppercase tracking-wider">
                    Bio
                  </span>
                  <p className="leading-relaxed break-all">{userDetail.user.bio}</p>
                </div>
              )}

              {/* Activity Stats & Magnets Earned */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-white border border-[#EDE4E1] text-center">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#786665]">
                    Total Friends
                  </div>
                  <div className="font-impact text-2xl text-[#231817] mt-1">
                    {userDetail.user.friendsCount ?? 0}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#EDE4E1] text-center">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#786665]">
                    Total Posts
                  </div>
                  <div className="font-impact text-2xl text-[#231817] mt-1">
                    {userDetail.user.postsCount ?? 0}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#EDE4E1] text-center">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#786665]">
                    Magnets Earned
                  </div>
                  <div className="font-impact text-2xl text-[#FF644E] mt-1">
                    {userDetail.magnets?.length ?? 0}
                  </div>
                </div>
              </div>

              {/* Magnets Display Section */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-[#FFF5F3] to-[#FEF7EC] border border-[#FFD5CC]">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-4 h-4 text-[#F5A623]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#231817]">
                    Refrigerator Magnets Collection
                  </span>
                </div>
                {userDetail.magnets && userDetail.magnets.length > 0 ? (
                  <div className="flex flex-wrap gap-2.5">
                    {userDetail.magnets.map((m) => (
                      <div
                        key={m._id}
                        className="px-3.5 py-2 rounded-2xl bg-white border border-[#EDE4E1] shadow-xs flex items-center gap-2 text-xs font-bold"
                      >
                        {m.category === 'family' ? (
                          <Users className="w-4 h-4 text-[#FF644E]" />
                        ) : m.category === 'food' ? (
                          <Utensils className="w-4 h-4 text-[#F5A623]" />
                        ) : (
                          <PartyPopper className="w-4 h-4 text-sky-600" />
                        )}
                        <span className="capitalize">{m.category} Magnet</span>
                        <span className="text-[10px] text-[#9A8785] font-normal">
                          {formatDateOnly(m.earnedAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#786665]">No magnets earned yet.</p>
                )}
              </div>

              {/* User Favorites */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#786665]">
                  Profile Favorites
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-white border border-[#EDE4E1]">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#231817] mb-2">
                      <Compass className="w-3.5 h-3.5 text-[#FF644E]" />
                      <span>Destinations</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {userDetail.user.favoriteVacationDestinations?.length > 0 ? (
                        userDetail.user.favoriteVacationDestinations.map((v, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-[#FAF7F5] text-[11px] font-semibold text-[#786665] break-all">
                            {v}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-[#9A8785]">None</span>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-[#EDE4E1]">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#231817] mb-2">
                      <Utensils className="w-3.5 h-3.5 text-[#F5A623]" />
                      <span>Restaurants</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {userDetail.user.favoriteRestaurants?.length > 0 ? (
                        userDetail.user.favoriteRestaurants.map((r, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-[#FAF7F5] text-[11px] font-semibold text-[#786665] break-all">
                            {r}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-[#9A8785]">None</span>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-[#EDE4E1]">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#231817] mb-2">
                      <Award className="w-3.5 h-3.5 text-sky-600" />
                      <span>Activities</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {userDetail.user.favoriteActivities?.length > 0 ? (
                        userDetail.user.favoriteActivities.map((a, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-[#FAF7F5] text-[11px] font-semibold text-[#786665] break-all">
                            {a}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-[#9A8785]">None</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Removed Posts Section */}
              {removedPostsData && removedPostsData.posts && removedPostsData.posts.length > 0 && (
                <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-800 block mb-2">
                    Removed Posts History ({removedPostsData.posts.length})
                  </span>
                  <div className="space-y-2">
                    {removedPostsData.posts.map((rp: ContentListItem) => (
                      <div key={rp._id} className="p-2.5 bg-white rounded-xl border border-rose-100 flex items-center justify-between text-xs gap-2 min-w-0">
                        <span className="text-[#231817] max-w-xs break-all">{rp.captionPreview || 'No caption'}</span>
                        <span className="text-rose-600 font-semibold break-all shrink-0">{rp.removalReason || 'Admin removed'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reports Against this User */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#786665]">
                  Reports Against User ({userDetail.reports?.length ?? 0})
                </span>
                {userDetail.reports && userDetail.reports.length > 0 ? (
                  <div className="space-y-2">
                    {userDetail.reports.map((rep) => (
                      <div key={rep._id} className="p-3 rounded-2xl bg-white border border-[#EDE4E1] flex items-center justify-between text-xs gap-2 min-w-0">
                        <div className="min-w-0">
                          <span className="font-bold text-rose-600 break-all">{rep.reason}</span>
                          <span className="text-[#786665] ml-2 font-medium">({rep.entityType} Report)</span>
                          {rep.description && <p className="text-[11px] text-[#786665] mt-0.5 break-all">{rep.description}</p>}
                        </div>
                        <Badge variant={rep.status} className="shrink-0">{capitalize(rep.status)}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#786665]">No reports on file for this user.</p>
                )}
              </div>

              {/* Account Details Footer */}
              <div className="pt-4 border-t border-[#EDE4E1] flex flex-wrap items-center justify-between gap-3 text-xs text-[#786665]">
                <span>Joined {formatDateTimeWithTz(userDetail.user.createdAt)}</span>
                <span className="break-all">ID: <code className="text-[#231817] break-all">{userDetail.user._id}</code></span>
              </div>
            </div>
          )}
        </Modal>

        {/* Block / Deactivate User Confirmation Modal (Validated with RHF & Zod) */}
        <Modal
          isOpen={!!blockModalUser}
          onClose={() => setBlockModalUser(null)}
          size="md"
          title={`Suspend Account: ${blockModalUser?.name || 'User'}`}
          description={`Are you sure you want to suspend @${blockModalUser?.username || 'user'}? This takes immediate effect across the mobile application.`}
        >
          <form onSubmit={handleBlockSubmit(onConfirmBlock)} className="space-y-4" noValidate>
            <div className="p-4 bg-[#FAF7F5] rounded-2xl border border-[#EDE4E1] space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-[#786665]">
                Immediate Mobile App Impact
              </div>
              <ul className="space-y-1.5 text-xs text-[#231817]">
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>Signed out of all mobile and web devices immediately.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>Cannot log in (&quot;Your account has been suspended&quot;).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>Profile, posts, and refrigerator are completely hidden from discovery.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>Pending friend requests to/from this user are permanently cancelled.</span>
                </li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-[#231817]">
                <label htmlFor="block-reason">
                  Suspension Reason (Visible to Admins) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[#9A8785]">
                  {blockReasonValue.length}/500
                </span>
              </div>
              <textarea
                id="block-reason"
                {...registerBlock('reason')}
                placeholder="e.g. Community guidelines violation / Repeated harassment"
                maxLength={500}
                rows={3}
                className="w-full p-3 bg-white border border-[#EDE4E1] hover:border-[#FFB1A2] focus:border-[#FF644E] focus:ring-4 focus:ring-[#FF644E]/10 rounded-2xl text-sm text-[#231817] outline-none transition-all resize-none"
              />
              {blockErrors.reason && (
                <p className="text-xs text-rose-600 font-medium pl-1">
                  {blockErrors.reason.message}
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-[#EDE4E1] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setBlockModalUser(null)}
                className="px-5 py-2.5 rounded-full border border-[#EDE4E1] text-[#786665] hover:text-[#231817] font-semibold text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={blockMutation.isPending}
                className="px-6 py-2.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                Suspend User
              </button>
            </div>
          </form>
        </Modal>

        {/* Unblock / Activate User Confirmation Modal */}
        <ConfirmationModal
          isOpen={!!unblockModalUser}
          onClose={() => setUnblockModalUser(null)}
          onConfirm={() =>
            unblockModalUser && unblockMutation.mutateAsync(unblockModalUser._id)
          }
          title={`Activate Account: ${unblockModalUser?.name || 'User'}`}
          description={`Restore full account access for @${unblockModalUser?.username}? Their profile and refrigerator posts will become visible again to everyone.`}
          confirmLabel="Re-activate Account"
          confirmVariant="success"
          isLoading={unblockMutation.isPending}
        />

        {/* Delete User Confirmation Modal */}
        <ConfirmationModal
          isOpen={!!deleteModalUser}
          onClose={() => setDeleteModalUser(null)}
          onConfirm={() =>
            deleteModalUser && deleteMutation.mutateAsync(deleteModalUser._id)
          }
          title={`Permanently Delete User: ${deleteModalUser?.name || 'User'}`}
          description={`Are you sure you want to delete ${deleteModalUser?.email}? This action is irreversible from the superadmin console.`}
          consequences={[
            'Signs user out everywhere and dissolves all friendships.',
            'Permanently removes all of their refrigerator posts and comments.',
            'Wipes the content of messages they sent and deactivates their chats.',
            'Reports filed against this user are preserved on record for compliance.',
          ]}
          confirmLabel="Permanently Delete"
          confirmVariant="danger"
          isLoading={deleteMutation.isPending}
        />
      </main>
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[#786665]">Loading user management...</div>}>
      <UsersContent />
    </Suspense>
  );
}
