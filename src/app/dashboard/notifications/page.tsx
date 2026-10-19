// src/app/dashboard/notifications/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Bell,
  Send,
  Calendar,
  XCircle,
  Trash2,
  Plus,
  Users,
  Eye,
  Clock,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { notificationsApi } from '@/lib/api/client';
import { AdminNotification, NotificationStatus, Audience } from '@/types/api';
import { Header } from '@/components/layout/header';
import { DataTable, Column } from '@/components/common/data-table';
import { Badge } from '@/components/common/badge';
import { Modal } from '@/components/common/modal';
import { ConfirmationModal } from '@/components/common/confirmation-modal';
import { useToast } from '@/lib/context/toast-context';
import { formatDateTimeWithTz, cn } from '@/lib/utils';
import {
  notificationSchema,
  NotificationFormData,
} from '@/lib/validations/notification-schema';
import { useDebounce } from '@/lib/hooks/use-debounce';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';

function NotificationsPageContent() {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  // Filters & Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  // Reset page to 1 whenever debounced search term changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [audienceFilter, setAudienceFilter] = useState<string>('all');

  const hasActiveFilters = Boolean(
    search ||
    statusFilter !== 'all' ||
    audienceFilter !== 'all'
  );

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setAudienceFilter('all');
    setPage(1);
  };

  // Detail Modal state
  const [selectedNotif, setSelectedNotif] = useState<AdminNotification | null>(null);

  // Create Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Cancel & Delete Modal state
  const [notifToCancel, setNotifToCancel] = useState<AdminNotification | null>(null);
  const [notifToDelete, setNotifToDelete] = useState<AdminNotification | null>(null);

  // React Hook Form for Broadcast Notification
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      createMode: 'now',
      title: '',
      description: '',
      targetAudience: 'active_users',
      scheduledDateTime: '',
    },
  });

  const createMode = watch('createMode');
  const titleValue = watch('title') || '';
  const descValue = watch('description') || '';

  // Fetch Notifications List
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notificationsList', page, limit, debouncedSearch, statusFilter, audienceFilter],
    queryFn: () =>
      notificationsApi.getNotifications({
        page,
        limit,
        search: debouncedSearch,
        status: statusFilter !== 'all' ? (statusFilter as NotificationStatus) : undefined,
        targetAudience: audienceFilter !== 'all' ? (audienceFilter as Audience) : undefined,
      }),
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (body: {
      title: string;
      description: string;
      targetAudience?: Audience;
      scheduledAt?: string;
      saveAsDraft?: boolean;
    }) => notificationsApi.createNotification(body),
    onSuccess: (res) => {
      success(res.message || 'Notification processed successfully');
      queryClient.invalidateQueries({ queryKey: ['notificationsList'] });
      setIsCreateOpen(false);
      reset();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        'Failed to create notification';
      toastError(msg);
    },
  });

  // Cancel Mutation
  const cancelMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.cancelNotification(id),
    onSuccess: (res) => {
      success(res.message || 'Scheduled notification cancelled');
      queryClient.invalidateQueries({ queryKey: ['notificationsList'] });
      setNotifToCancel(null);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        'Failed to cancel notification';
      toastError(msg);
    },
  });

  // Delete Draft Mutation
  const deleteDraftMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.deleteDraft(id),
    onSuccess: (res) => {
      success(res.message || 'Draft deleted');
      queryClient.invalidateQueries({ queryKey: ['notificationsList'] });
      setNotifToDelete(null);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        'Failed to delete draft';
      toastError(msg);
    },
  });

  const onSubmitBroadcast = (formData: NotificationFormData) => {
    if (formData.createMode === 'draft') {
      createMutation.mutate({
        title: formData.title,
        description: formData.description,
        saveAsDraft: true,
      });
      return;
    }

    if (formData.createMode === 'schedule') {
      const dateObj = new Date(formData.scheduledDateTime!);
      const isoUtc = dateObj.toISOString();
      createMutation.mutate({
        title: formData.title,
        description: formData.description,
        targetAudience: formData.targetAudience,
        scheduledAt: isoUtc,
      });
      return;
    }

    // Send now
    createMutation.mutate({
      title: formData.title,
      description: formData.description,
      targetAudience: formData.targetAudience,
    });
  };

  // Columns definition
  const columns: Column<AdminNotification>[] = [
    {
      header: 'Notification Content',
      className: 'min-w-[260px] max-w-[460px]',
      headerClassName: 'whitespace-nowrap',
      render: (n) => (
        <div className="space-y-1">
          <div className="font-bold text-sm text-[#231817] flex items-center gap-2">
            <span className="break-words">{n.title}</span>
          </div>
          <p className="text-xs text-[#786665] line-clamp-2 leading-relaxed break-all">
            {n.description}
          </p>
        </div>
      ),
    },
    {
      header: 'Audience',
      className: 'whitespace-nowrap w-[160px]',
      headerClassName: 'whitespace-nowrap',
      render: (n) => {
        if (!n.targetAudience) return <span className="text-xs text-[#9A8785] whitespace-nowrap">None (Draft)</span>;
        if (n.targetAudience === 'active_users') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FAF7F5] border border-[#EDE4E1] text-[#231817] whitespace-nowrap">
              <Users className="w-3.5 h-3.5 text-[#FF644E] shrink-0" />
              Active Users
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FAF7F5] border border-[#EDE4E1] text-[#231817] whitespace-nowrap">
            <Users className="w-3.5 h-3.5 text-[#F5A623] shrink-0" />
            Custom Audience
          </span>
        );
      },
    },
    {
      header: 'Status',
      className: 'whitespace-nowrap w-[120px]',
      headerClassName: 'whitespace-nowrap',
      render: (n) => <Badge variant={n.status}>{n.status.toUpperCase()}</Badge>,
    },
    {
      header: 'Timing',
      className: 'whitespace-nowrap w-[170px]',
      headerClassName: 'whitespace-nowrap',
      render: (n) => {
        if (n.status === 'sent') {
          return (
            <div className="text-xs text-[#786665] whitespace-nowrap">
              <span className="font-semibold text-emerald-700 block">Sent</span>
              <span>{formatDateTimeWithTz(n.sentAt)}</span>
            </div>
          );
        }
        if (n.status === 'scheduled') {
          return (
            <div className="text-xs text-[#786665] whitespace-nowrap">
              <span className="font-semibold text-indigo-700 block">Scheduled</span>
              <span>{formatDateTimeWithTz(n.scheduledAt)}</span>
            </div>
          );
        }
        return (
          <div className="text-xs text-[#9A8785] whitespace-nowrap">
            Created {formatDateTimeWithTz(n.createdAt)}
          </div>
        );
      },
    },
    {
      header: 'Actions',
      className: 'text-right whitespace-nowrap w-[80px]',
      headerClassName: 'text-right whitespace-nowrap',
      render: (n) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setSelectedNotif(n)}
            className="p-2 rounded-xl text-[#786665] hover:text-[#231817] hover:bg-[#FAF7F5] transition-colors cursor-pointer"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Action Dropdown Menu from Shadcn */}
          <DropdownMenu>
            <DropdownMenuTrigger className="p-2 rounded-xl text-[#786665] hover:text-[#231817] hover:bg-[#FAF7F5] transition-colors cursor-pointer outline-none">
              <MoreVertical className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedNotif(n)}>
                <Eye className="w-4 h-4 mr-1 text-[#786665]" />
                <span>View Details</span>
              </DropdownMenuItem>

              {n.status === 'scheduled' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="danger"
                    onClick={() => setNotifToCancel(n)}
                  >
                    <XCircle className="w-4 h-4 mr-1 text-rose-600" />
                    <span>Cancel Broadcast</span>
                  </DropdownMenuItem>
                </>
              )}

              {n.status === 'draft' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="danger"
                    onClick={() => setNotifToDelete(n)}
                  >
                    <Trash2 className="w-4 h-4 mr-1 text-rose-600" />
                    <span>Delete Draft</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header
        title="Notification Broadcasts"
        subtitle="Compose push announcements, schedule campaigns, and review in-app messaging delivery."
      />

      <main className="p-6 sm:p-8 space-y-6 max-w-7xl">
        <DataTable<AdminNotification>
          columns={columns}
          data={notificationsData?.notifications || []}
          keyExtractor={(n) => n._id}
          isLoading={isLoading}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search title or description..."
          actionSlot={
            <button
              onClick={() => {
                reset();
                setIsCreateOpen(true);
              }}
              className="px-5 py-2.5 rounded-full bg-[#FF644E] hover:bg-[#F04730] text-white text-xs font-bold shadow-md shadow-[#FF644E]/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Compose Broadcast
            </button>
          }
          filterSlot={
            <>
              {/* Status Filter */}
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[145px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              {/* Audience Filter */}
              <Select
                value={audienceFilter}
                onValueChange={(val) => {
                  setAudienceFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[155px]">
                  <SelectValue placeholder="All Audiences" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Audiences</SelectItem>
                  <SelectItem value="active_users">Active Users</SelectItem>
                  <SelectItem value="custom">Custom Recipients</SelectItem>
                </SelectContent>
              </Select>

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
          pagination={notificationsData?.pagination}
          onPageChange={setPage}
          onRowClick={(n) => setSelectedNotif(n)}
          emptyTitle="No notifications found"
          emptyMessage="No broadcast notifications match your search or filter criteria."
        />

        {/* Compose Notification Modal (Validated with RHF & Zod) */}
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          size="lg"
          title="Compose Broadcast Notification"
          description="Send immediate push announcements, schedule future alerts, or save notes as drafts."
        >
          <form onSubmit={handleSubmit(onSubmitBroadcast)} className="space-y-5" noValidate>
            {/* Mode Selector Pill */}
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-[#FAF7F5] rounded-2xl border border-[#EDE4E1]">
              <button
                type="button"
                onClick={() => setValue('createMode', 'now', { shouldValidate: true })}
                className={cn(
                  "py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  createMode === 'now'
                    ? 'bg-white text-[#FF644E] shadow-xs'
                    : 'text-[#786665] hover:text-[#231817]'
                )}
              >
                <Send className="w-3.5 h-3.5" />
                Send Now
              </button>
              <button
                type="button"
                onClick={() => setValue('createMode', 'schedule', { shouldValidate: true })}
                className={cn(
                  "py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  createMode === 'schedule'
                    ? 'bg-white text-[#FF644E] shadow-xs'
                    : 'text-[#786665] hover:text-[#231817]'
                )}
              >
                <Calendar className="w-3.5 h-3.5" />
                Schedule Later
              </button>
              <button
                type="button"
                onClick={() => setValue('createMode', 'draft', { shouldValidate: true })}
                className={cn(
                  "py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  createMode === 'draft'
                    ? 'bg-white text-[#FF644E] shadow-xs'
                    : 'text-[#786665] hover:text-[#231817]'
                )}
              >
                <Clock className="w-3.5 h-3.5" />
                Save as Draft
              </button>
            </div>

            {/* Title with Live 100 char counter */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#786665]">
                <label htmlFor="notif-title">Title</label>
                <span className={titleValue.length > 90 ? 'text-[#FF644E]' : 'text-[#9A8785]'}>
                  {titleValue.length}/100
                </span>
              </div>
              <input
                id="notif-title"
                type="text"
                maxLength={100}
                {...register('title')}
                placeholder="e.g. Weekend Polaroids Challenge!"
                className={cn(
                  "w-full px-4 py-3 bg-[#FAF7F5] border border-[#EDE4E1] hover:border-[#FFB1A2] focus:border-[#FF644E] focus:ring-4 focus:ring-[#FF644E]/10 rounded-2xl text-sm text-[#231817] outline-none transition-all",
                  errors.title && "border-rose-300 focus:border-rose-500"
                )}
              />
              {errors.title && (
                <p className="text-xs text-rose-600 font-medium pl-1">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Description with Live 500 char counter */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#786665]">
                <label htmlFor="notif-desc">Message Body (Push Preview)</label>
                <span className={descValue.length > 450 ? 'text-[#FF644E]' : 'text-[#9A8785]'}>
                  {descValue.length}/500
                </span>
              </div>
              <textarea
                id="notif-desc"
                maxLength={500}
                rows={4}
                {...register('description')}
                placeholder="Compose your message body to be delivered to user lockscreens and in-app feeds..."
                className={cn(
                  "w-full p-4 bg-[#FAF7F5] border border-[#EDE4E1] hover:border-[#FFB1A2] focus:border-[#FF644E] focus:ring-4 focus:ring-[#FF644E]/10 rounded-2xl text-sm text-[#231817] outline-none transition-all resize-none",
                  errors.description && "border-rose-300 focus:border-rose-500"
                )}
              />
              {errors.description && (
                <p className="text-xs text-rose-600 font-medium pl-1">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Target Audience (Required unless draft) */}
            {createMode !== 'draft' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#786665]">
                  Target Audience
                </label>
                <Controller
                  name="targetAudience"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || 'active_users'}
                      onValueChange={(val) => field.onChange(val as Audience)}
                    >
                      <SelectTrigger className={cn("w-full rounded-2xl h-11 bg-[#FAF7F5]", errors.targetAudience && "border-rose-300")}>
                        <SelectValue placeholder="Select target audience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active_users">Active Users (Live signed in accounts)</SelectItem>
                        <SelectItem value="custom">Custom Recipients</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.targetAudience && (
                  <p className="text-xs text-rose-600 font-medium pl-1">
                    {errors.targetAudience.message}
                  </p>
                )}
              </div>
            )}

            {/* Scheduled Datetime Picker (Shadcn UI) */}
            {createMode === 'schedule' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#786665]">
                  Scheduled Delivery (Local Timezone)
                </label>
                <Controller
                  control={control}
                  name="scheduledDateTime"
                  render={({ field }) => (
                    <DateTimePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Pick delivery date and time..."
                      hasError={Boolean(errors.scheduledDateTime)}
                    />
                  )}
                />
                {errors.scheduledDateTime ? (
                  <p className="text-xs text-rose-600 font-medium pl-1">
                    {errors.scheduledDateTime.message}
                  </p>
                ) : (
                  <p className="text-[11px] text-[#9A8785]">
                    Will automatically be sent within 1 minute of your scheduled time in UTC.
                  </p>
                )}
              </div>
            )}

            {/* Submit actions */}
            <div className="pt-4 border-t border-[#EDE4E1] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-5 py-2.5 rounded-full border border-[#EDE4E1] text-[#786665] hover:text-[#231817] font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-6 py-2.5 rounded-full bg-[#FF644E] hover:bg-[#F04730] text-white font-bold text-xs shadow-md shadow-[#FF644E]/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                {createMode === 'now'
                  ? 'Send Immediately'
                  : createMode === 'schedule'
                  ? 'Schedule Broadcast'
                  : 'Save Draft'}
              </button>
            </div>
          </form>
        </Modal>

        {/* View Notification Detail Modal */}
        <Modal
          isOpen={!!selectedNotif}
          onClose={() => setSelectedNotif(null)}
          size="md"
          title="Notification Details"
          description="View content, targeted audience, and historical delivery timestamp."
        >
          {selectedNotif && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#FAF7F5] border border-[#EDE4E1] space-y-2 break-all">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Badge variant={selectedNotif.status}>{selectedNotif.status.toUpperCase()}</Badge>
                  <span className="text-xs text-[#786665] break-all">ID: {selectedNotif._id}</span>
                </div>
                <h4 className="font-bold text-base text-[#231817] break-all">{selectedNotif.title}</h4>
                <p className="text-xs text-[#786665] leading-relaxed break-all">{selectedNotif.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-[#EDE4E1]">
                  <span className="text-[#9A8785] block mb-1">Audience</span>
                  <span className="font-bold text-[#231817] capitalize">
                    {selectedNotif.targetAudience?.replace('_', ' ') || 'None'}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#EDE4E1]">
                  <span className="text-[#9A8785] block mb-1">
                    {selectedNotif.status === 'sent' ? 'Sent At' : 'Scheduled At'}
                  </span>
                  <span className="font-bold text-[#231817]">
                    {formatDateTimeWithTz(selectedNotif.sentAt || selectedNotif.scheduledAt || selectedNotif.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Cancel Scheduled Confirmation Modal */}
        <ConfirmationModal
          isOpen={!!notifToCancel}
          onClose={() => setNotifToCancel(null)}
          onConfirm={() => notifToCancel && cancelMutation.mutateAsync(notifToCancel._id)}
          title={`Cancel Scheduled Broadcast: "${notifToCancel?.title}"`}
          description="Are you sure you want to cancel this scheduled notification? Nobody was ever notified, so nothing will be sent."
          confirmLabel="Cancel Broadcast"
          confirmVariant="warning"
          isLoading={cancelMutation.isPending}
        />

        {/* Delete Draft Confirmation Modal */}
        <ConfirmationModal
          isOpen={!!notifToDelete}
          onClose={() => setNotifToDelete(null)}
          onConfirm={() => notifToDelete && deleteDraftMutation.mutateAsync(notifToDelete._id)}
          title={`Delete Draft: "${notifToDelete?.title}"`}
          description="Are you sure you want to delete this notification draft? This action removes the saved text permanently."
          confirmLabel="Delete Draft"
          confirmVariant="danger"
          isLoading={deleteDraftMutation.isPending}
        />
      </main>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[#786665]">Loading notification broadcasts...</div>}>
      <NotificationsPageContent />
    </Suspense>
  );
}
