// src/app/dashboard/reports/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ShieldAlert,
  MessageSquare,
  User,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import Image from 'next/image';
import { reportsApi } from '@/lib/api/client';
import { ReportListItem, ReportDetailData, ReportStatus, ChatMessage } from '@/types/api';
import { Header } from '@/components/layout/header';
import { DataTable, Column } from '@/components/common/data-table';
import { Badge } from '@/components/common/badge';
import { Modal } from '@/components/common/modal';
import { ConfirmationModal } from '@/components/common/confirmation-modal';
import { DetailSkeleton } from '@/components/common/skeleton';
import { useToast } from '@/lib/context/toast-context';
import { formatDateTimeWithTz, formatDateOnly, capitalize, cn } from '@/lib/utils';
import {
  resolveReportSchema,
  ResolveReportFormData,
} from '@/lib/validations/report-schema';
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
import { MoreVertical } from 'lucide-react';

function ReportsPageContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status');

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

  const [statusFilter, setStatusFilter] = useState<string>(initialStatus || 'all');
  const [reasonFilter, setReasonFilter] = useState<string>('all');

  const hasActiveFilters = Boolean(
    search ||
    statusFilter !== 'all' ||
    reasonFilter !== 'all'
  );

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setReasonFilter('all');
    setPage(1);
  };

  // Detail Modal state
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Resolution Action Modal state
  const [resolveModalReport, setResolveModalReport] = useState<ReportListItem | null>(null);
  const [resolveAction, setResolveAction] = useState<'resolve' | 'dismiss'>('resolve');

  // RHF for Resolution / Dismissal Notes
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ResolveReportFormData>({
    resolver: zodResolver(resolveReportSchema),
    defaultValues: {
      action: 'resolve',
      adminNotes: '',
      suspendUser: false,
    },
  });

  const adminNotesValue = watch('adminNotes') || '';

  // Fetch Reports List
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['reportsList', page, limit, debouncedSearch, statusFilter, reasonFilter],
    queryFn: () =>
      reportsApi.getReports({
        page,
        limit,
        search: debouncedSearch,
        status: statusFilter !== 'all' ? (statusFilter as ReportStatus) : undefined,
        reason: reasonFilter !== 'all' ? reasonFilter : undefined,
      }),
  });

  // Fetch Single Report Detail
  const { data: reportDetail, isLoading: isDetailLoading } = useQuery({
    queryKey: ['reportDetail', selectedReportId],
    queryFn: async () => {
      if (!selectedReportId) return null;
      const res = await reportsApi.getReportDetail(selectedReportId);
      queryClient.invalidateQueries({ queryKey: ['reportsList'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      return res;
    },
    enabled: !!selectedReportId,
  });

  // Resolve / Dismiss Mutation
  const resolveMutation = useMutation({
    mutationFn: ({
      reportId,
      action,
      adminNotes,
      suspendUser,
    }: {
      reportId: string;
      action: 'resolve' | 'dismiss';
      adminNotes: string;
      suspendUser?: boolean;
    }) =>
      reportsApi.resolveReport(reportId, {
        action,
        adminNotes,
        suspendUser,
      }),
    onSuccess: (res) => {
      success(res.message || 'Report processed successfully');
      queryClient.invalidateQueries({ queryKey: ['reportsList'] });
      queryClient.invalidateQueries({ queryKey: ['reportDetail'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['usersList'] });
      setResolveModalReport(null);
      reset();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        'Failed to resolve report';
      toastError(msg);
    },
  });

  const onResolveSubmit = (formData: ResolveReportFormData) => {
    if (!resolveModalReport) return;
    resolveMutation.mutate({
      reportId: resolveModalReport._id,
      action: formData.action,
      adminNotes: formData.adminNotes,
      suspendUser: formData.suspendUser,
    });
  };

  const openResolveModal = (report: ReportListItem, action: 'resolve' | 'dismiss') => {
    setResolveModalReport(report);
    setResolveAction(action);
    setValue('action', action);
    setValue('adminNotes', '');
    setValue('suspendUser', false);
  };

  // Columns definition
  const columns: Column<ReportListItem>[] = [
    {
      header: 'Reported Subject',
      className: 'min-w-[200px]',
      headerClassName: 'whitespace-nowrap',
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full bg-[#FAF7F5] border border-[#EDE4E1] flex items-center justify-center text-[#786665] overflow-hidden shrink-0">
            {r.reportedUserId?.profilePicture?.location ? (
              <Image
                src={r.reportedUserId.profilePicture.location}
                alt={r.reportedUserId.name || 'Reported user'}
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-rose-500" />
            )}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-xs sm:text-sm text-[#231817] break-words">
              {r.reportedUserId?.name || 'Unknown User'}
            </div>
            <div className="text-xs text-[#786665] break-all">{r.reportedUserId?.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Type',
      className: 'whitespace-nowrap w-[110px]',
      headerClassName: 'whitespace-nowrap',
      render: (r) => {
        let icon = <User className="w-3.5 h-3.5 text-[#FF644E] shrink-0" />;
        if (r.entityType === 'Chat') icon = <MessageSquare className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
        if (r.entityType === 'Post') icon = <ImageIcon className="w-3.5 h-3.5 text-[#F5A623] shrink-0" />;

        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FAF7F5] border border-[#EDE4E1] text-[#231817] whitespace-nowrap">
            {icon}
            {r.entityType}
          </span>
        );
      },
    },
    {
      header: 'Reason',
      className: 'min-w-[170px] max-w-[300px]',
      headerClassName: 'whitespace-nowrap',
      render: (r) => (
        <div>
          <span className="font-bold text-xs text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full inline-block whitespace-nowrap">
            {r.reason}
          </span>
          {r.description && (
            <p className="text-[11px] text-[#786665] line-clamp-1 mt-1 max-w-xs break-all">
              {r.description}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Reporter',
      className: 'min-w-[160px]',
      headerClassName: 'whitespace-nowrap',
      render: (r) => (
        <div className="text-xs">
          <div className="font-bold text-[#231817] break-words">{r.reporter?.name || 'Anonymous'}</div>
          <div className="text-[#786665] text-[11px] break-all">{r.reporter?.email}</div>
        </div>
      ),
    },
    {
      header: 'Date',
      className: 'whitespace-nowrap w-[130px]',
      headerClassName: 'whitespace-nowrap',
      render: (r) => (
        <div className="text-xs text-[#786665] flex items-center gap-1.5 whitespace-nowrap">
          <Calendar className="w-3.5 h-3.5 text-[#9A8785] shrink-0" />
          <span>{formatDateOnly(r.createdAt)}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      className: 'whitespace-nowrap w-[130px]',
      headerClassName: 'whitespace-nowrap',
      render: (r) => <Badge variant={r.status}>{capitalize(r.status.replace('_', ' '))}</Badge>,
    },
    {
      header: 'Actions',
      className: 'text-right whitespace-nowrap w-[80px]',
      headerClassName: 'text-right whitespace-nowrap',
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setSelectedReportId(r._id)}
            className="p-2 rounded-xl text-[#786665] hover:text-[#231817] hover:bg-[#FAF7F5] transition-colors cursor-pointer"
            title="Inspect Report & Transcript"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Action Dropdown Menu from Shadcn */}
          <DropdownMenu>
            <DropdownMenuTrigger className="p-2 rounded-xl text-[#786665] hover:text-[#231817] hover:bg-[#FAF7F5] transition-colors cursor-pointer outline-none">
              <MoreVertical className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedReportId(r._id)}>
                <Eye className="w-4 h-4 mr-1 text-[#786665]" />
                <span>Inspect Report</span>
              </DropdownMenuItem>

              {(r.status === 'pending' || r.status === 'under_review') && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => openResolveModal(r, 'resolve')}
                    className="text-emerald-700 font-medium"
                  >
                    <CheckCircle className="w-4 h-4 mr-1 text-emerald-600" />
                    <span>Resolve Report</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => openResolveModal(r, 'dismiss')}
                    className="text-slate-600 font-medium"
                  >
                    <XCircle className="w-4 h-4 mr-1 text-slate-500" />
                    <span>Dismiss Report</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  // Helper to render chat messages in investigation viewer
  const renderChatConversation = (context: ReportDetailData['messageContext'], report: ReportListItem) => {
    if (!context) return null;

    const allMessages: { msg: ChatMessage; isReported: boolean }[] = [
      ...context.before.map((m) => ({ msg: m, isReported: false })),
      ...(context.message ? [{ msg: context.message, isReported: true }] : []),
      ...context.after.map((m) => ({ msg: m, isReported: false })),
    ];

    const reporterId = report.reporter?._id;
    const reportedId = report.reportedUserId?._id;

    return (
      <div className="space-y-3 p-4 bg-[#FAF7F5] rounded-3xl border border-[#EDE4E1]">
        <div className="flex items-center justify-between text-xs text-[#786665] font-semibold border-b border-[#EDE4E1] pb-2">
          <span>Private Chat Investigation Thread (10 before &amp; 10 after)</span>
          <span className="text-[#FF644E] font-bold">Reported message highlighted below</span>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto pr-1 no-scrollbar">
          {allMessages.map(({ msg, isReported }) => {
            const isReporter = msg.sender === reporterId;
            const isReportedUser = msg.sender === reportedId;

            const senderLabel = isReporter
              ? `Reporter (${report.reporter?.name || 'Reporter'})`
              : isReportedUser
              ? `Reported User (${report.reportedUserId?.name || 'Reported'})`
              : 'Participant';

            return (
              <div
                key={msg._id}
                className={cn(
                  "p-3.5 rounded-2xl text-xs transition-all",
                  isReported
                    ? "bg-rose-50 border-2 border-rose-400 shadow-md ring-2 ring-rose-300/40"
                    : isReporter
                    ? "bg-white border border-[#EDE4E1] ml-6"
                    : "bg-[#FFF0ED] border border-[#FFD5CC] mr-6"
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] break-all",
                        isReportedUser
                          ? "bg-rose-200 text-rose-900"
                          : "bg-[#EDE4E1] text-[#786665]"
                      )}
                    >
                      {senderLabel}
                    </span>
                    {isReported && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white animate-soft-pulse shrink-0">
                        FLAGGED MESSAGE
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#9A8785] shrink-0">
                    {formatDateTimeWithTz(msg.createdAt)}
                  </span>
                </div>

                <div className="text-sm text-[#231817] leading-relaxed break-all">
                  {msg.isDeletedForEveryone || msg.content === null ? (
                    <em className="text-[#9A8785]">[Message deleted by author]</em>
                  ) : msg.type === 'image' || msg.type === 'video' ? (
                    <span className="text-[#9A8785] italic">
                      [{capitalize(msg.type)}] — preview unavailable
                    </span>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header
        title="Reports & Chat Monitoring"
        subtitle="Investigate community flags, review reported direct messages in context, and enforce suspensions."
      />

      <main className="p-6 sm:p-8 space-y-6 max-w-7xl">
        <DataTable<ReportListItem>
          columns={columns}
          data={reportsData?.reports || []}
          keyExtractor={(r) => r._id}
          isLoading={isLoading}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search reported user name or email..."
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
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>

              {/* Reason Filter */}
              <Select
                value={reasonFilter}
                onValueChange={(val) => {
                  setReasonFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[170px]">
                  <SelectValue placeholder="All Reasons" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reasons</SelectItem>
                  <SelectItem value="Harassment">Harassment</SelectItem>
                  <SelectItem value="Spam">Spam</SelectItem>
                  <SelectItem value="Inappropriate Content">Inappropriate Content</SelectItem>
                  <SelectItem value="Scam">Scam</SelectItem>
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
          pagination={reportsData?.pagination}
          onPageChange={setPage}
          onRowClick={(r) => setSelectedReportId(r._id)}
          emptyTitle="No reports found"
          emptyMessage="No reports filed matching your search parameters or filter criteria."
        />

        {/* Report Inspection Modal */}
        <Modal
          isOpen={!!selectedReportId}
          onClose={() => setSelectedReportId(null)}
          size="xl"
          title="Report & Investigation Dossier"
          description="Full investigation transcript, reported content snapshot, and action history."
        >
          {isDetailLoading || !reportDetail ? (
            <DetailSkeleton />
          ) : (
            <div className="space-y-6">
              {/* Subject & Reporter Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Reported User */}
                <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block mb-2">
                    Reported User
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-full bg-white border border-rose-200 overflow-hidden flex items-center justify-center shrink-0">
                      {reportDetail.report.reportedUserId?.profilePicture?.location ? (
                        <Image
                          src={reportDetail.report.reportedUserId.profilePicture.location}
                          alt={reportDetail.report.reportedUserId.name || 'User'}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-rose-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-[#231817] break-all">
                        {reportDetail.report.reportedUserId?.name || 'Unknown User'}
                      </h4>
                      <p className="text-xs text-[#786665] break-all">{reportDetail.report.reportedUserId?.email}</p>
                      {reportDetail.report.reportedUserId?.isDeactivatedByAdmin && (
                        <Badge variant="blocked" className="mt-1">Currently Suspended</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reporter */}
                <div className="p-4 rounded-2xl bg-[#FAF7F5] border border-[#EDE4E1]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#786665] block mb-2">
                    Filed By Reporter
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-full bg-white border border-[#EDE4E1] overflow-hidden flex items-center justify-center shrink-0">
                      {reportDetail.report.reporter?.profilePicture?.location ? (
                        <Image
                          src={reportDetail.report.reporter.profilePicture.location}
                          alt={reportDetail.report.reporter.name || 'Reporter'}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-[#786665]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-[#231817] break-all">
                        {reportDetail.report.reporter?.name || 'Anonymous User'}
                      </h4>
                      <p className="text-xs text-[#786665] break-all">{reportDetail.report.reporter?.email}</p>
                      <span className="text-[11px] text-[#9A8785]">Filed {formatDateTimeWithTz(reportDetail.report.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reason & Description Card */}
              <div className="p-4 rounded-2xl bg-white border border-[#EDE4E1] space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full break-all">
                      {reportDetail.report.reason}
                    </span>
                    <span className="text-xs font-semibold text-[#786665] shrink-0">
                      ({reportDetail.report.entityType} Report)
                    </span>
                  </div>
                  <Badge variant={reportDetail.report.status}>
                    {capitalize(reportDetail.report.status.replace('_', ' '))}
                  </Badge>
                </div>
                {reportDetail.report.description && (
                  <p className="text-xs text-[#231817] leading-relaxed pt-1 break-all">
                    &quot;{reportDetail.report.description}&quot;
                  </p>
                )}
              </div>

              {/* Chat Message Investigation Transcript Viewer */}
              {reportDetail.report.entityType === 'Chat' && reportDetail.messageContext && (
                renderChatConversation(reportDetail.messageContext, reportDetail.report)
              )}

              {/* Resolution / Admin Notes Section */}
              {reportDetail.report.status === 'resolved' || reportDetail.report.status === 'dismissed' ? (
                <div className="p-4 rounded-2xl bg-[#FEF7EC] border border-[#FDE3B6] space-y-2 break-all">
                  <div className="flex items-center justify-between text-xs font-bold text-[#B46F04]">
                    <span>Resolution Settled ({capitalize(reportDetail.report.status)})</span>
                    <span>Resolved {formatDateTimeWithTz(reportDetail.report.resolvedAt)}</span>
                  </div>
                  <p className="text-xs text-[#231817] break-all">
                    <strong>Superadmin Notes:</strong> {reportDetail.report.adminNotes || 'None'}
                  </p>
                  <p className="text-[11px] text-[#786665] break-all">
                    Resolved by: {reportDetail.report.resolvedBy?.email}
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EDE4E1]">
                  <button
                    onClick={() => openResolveModal(reportDetail.report, 'dismiss')}
                    className="px-5 py-2.5 rounded-full border border-[#EDE4E1] text-[#786665] hover:text-[#231817] text-xs font-bold transition-all cursor-pointer"
                  >
                    Dismiss Report
                  </button>
                  <button
                    onClick={() => openResolveModal(reportDetail.report, 'resolve')}
                    className="px-6 py-2.5 rounded-full bg-[#FF644E] hover:bg-[#F04730] text-white text-xs font-bold shadow-md shadow-[#FF644E]/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Resolve Report
                  </button>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Resolve / Dismiss Action Modal (Validated with RHF & Zod) */}
        <Modal
          isOpen={!!resolveModalReport}
          onClose={() => setResolveModalReport(null)}
          size="md"
          title={
            resolveAction === 'resolve'
              ? `Resolve Report #${resolveModalReport?._id?.slice(-6)}`
              : `Dismiss Report #${resolveModalReport?._id?.slice(-6)}`
          }
          description="Provide mandatory resolution notes for compliance and auditing."
        >
          <form onSubmit={handleSubmit(onResolveSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#786665]">
                <label htmlFor="admin-notes">Superadmin Notes (Required)</label>
                <span className={adminNotesValue.length > 900 ? 'text-[#FF644E]' : 'text-[#9A8785]'}>
                  {adminNotesValue.length}/1000
                </span>
              </div>
              <textarea
                id="admin-notes"
                maxLength={1000}
                rows={4}
                {...register('adminNotes')}
                placeholder="Document your findings, e.g. 'Confirmed harassment in direct message. Warning issued / user suspended.'"
                className={cn(
                  "w-full p-4 bg-[#FAF7F5] border border-[#EDE4E1] hover:border-[#FFB1A2] focus:border-[#FF644E] focus:ring-4 focus:ring-[#FF644E]/10 rounded-2xl text-xs text-[#231817] outline-none transition-all resize-none",
                  errors.adminNotes && "border-rose-300 focus:border-rose-500"
                )}
              />
              {errors.adminNotes && (
                <p className="text-xs text-rose-600 font-medium pl-1">
                  {errors.adminNotes.message}
                </p>
              )}
            </div>

            {resolveAction === 'resolve' && (
              <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('suspendUser')}
                  className="rounded text-rose-600 focus:ring-rose-500 mt-0.5"
                />
                <div className="text-xs min-w-0">
                  <span className="font-bold text-rose-950 block">
                    Suspend Reported User Immediately
                  </span>
                  <span className="text-rose-700 leading-relaxed block mt-0.5 break-all">
                    Will sign @{resolveModalReport?.reportedUserId?.name || 'user'} out of all devices and hide their refrigerator from discovery.
                  </span>
                </div>
              </label>
            )}

            <div className="pt-4 border-t border-[#EDE4E1] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setResolveModalReport(null)}
                className="px-4 py-2 rounded-full border border-[#EDE4E1] text-[#786665] font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={resolveMutation.isPending}
                className={cn(
                  "px-6 py-2.5 rounded-full text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50",
                  resolveAction === 'resolve' ? "bg-[#FF644E] hover:bg-[#F04730]" : "bg-slate-700 hover:bg-slate-800"
                )}
              >
                {resolveMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {resolveAction === 'resolve' ? 'Confirm Resolution' : 'Confirm Dismissal'}
              </button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[#786665]">Loading reports & chat moderation...</div>}>
      <ReportsPageContent />
    </Suspense>
  );
}
