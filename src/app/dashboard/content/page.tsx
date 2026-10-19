// src/app/dashboard/content/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Image as ImageIcon,
  MessageSquare,
  Heart,
  Eye,
  Trash2,
  RotateCcw,
  User,
  Calendar,
  Play,
  ThumbsUp,
  Laugh,
  Smile,
  Frown,
  Angry,
} from 'lucide-react';
import Image from 'next/image';
import { contentApi } from '@/lib/api/client';
import { ContentListItem, Category } from '@/types/api';
import { Header } from '@/components/layout/header';
import { DataTable, Column } from '@/components/common/data-table';
import { Badge } from '@/components/common/badge';
import { Modal } from '@/components/common/modal';
import { ConfirmationModal } from '@/components/common/confirmation-modal';
import { DetailSkeleton } from '@/components/common/skeleton';
import { useToast } from '@/lib/context/toast-context';
import { formatDateTimeWithTz, formatDateOnly } from '@/lib/utils';
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
import { MoreVertical } from 'lucide-react';

function ContentPageContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category');
  const initialAuthor = searchParams.get('author');

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

  const [categoryFilter, setCategoryFilter] = useState<string>(initialCategory || 'all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [authorFilter] = useState<string | undefined>(initialAuthor || undefined);

  const hasActiveFilters = Boolean(
    search ||
    categoryFilter !== 'all' ||
    statusFilter !== 'all'
  );

  const handleClearFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setStatusFilter('all');
    setPage(1);
  };

  // Detail Modal state
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  // Action Modals state
  const [removeModalPost, setRemoveModalPost] = useState<ContentListItem | null>(null);
  const [restoreModalPost, setRestoreModalPost] = useState<ContentListItem | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<{ id: string; text: string } | null>(null);

  // RHF for Remove Post Reason
  const {
    register: registerRemove,
    handleSubmit: handleRemoveSubmit,
    reset: resetRemoveForm,
    watch: watchRemove,
    formState: { errors: removeErrors },
  } = useForm<ActionReasonFormData>({
    resolver: zodResolver(actionReasonSchema),
    defaultValues: {
      reason: '',
    },
  });

  const removeReasonValue = watchRemove('reason') || '';

  // Fetch Posts List
  const { data: contentData, isLoading } = useQuery({
    queryKey: ['postsList', page, limit, debouncedSearch, categoryFilter, statusFilter, authorFilter],
    queryFn: () =>
      contentApi.getPosts({
        page,
        limit,
        search: debouncedSearch,
        category: categoryFilter !== 'all' ? (categoryFilter as Category) : undefined,
        status: statusFilter !== 'all' ? (statusFilter as 'visible' | 'removed') : undefined,
        author: authorFilter,
      }),
  });

  // Fetch Single Post Detail
  const { data: postDetail, isLoading: isDetailLoading } = useQuery({
    queryKey: ['postDetail', selectedPostId],
    queryFn: () => (selectedPostId ? contentApi.getPostDetail(selectedPostId) : null),
    enabled: !!selectedPostId,
  });

  // Remove Post Mutation
  const removeMutation = useMutation({
    mutationFn: ({ postId, reason }: { postId: string; reason?: string }) =>
      contentApi.updatePostStatus(postId, 'remove', reason),
    onSuccess: (res) => {
      success(res.message || 'Post removed successfully');
      queryClient.invalidateQueries({ queryKey: ['postsList'] });
      queryClient.invalidateQueries({ queryKey: ['postDetail'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setRemoveModalPost(null);
      resetRemoveForm();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        'Failed to remove post';
      toastError(msg);
    },
  });

  // Restore Post Mutation
  const restoreMutation = useMutation({
    mutationFn: (postId: string) => contentApi.updatePostStatus(postId, 'restore'),
    onSuccess: (res) => {
      success(res.message || 'Post restored successfully');
      queryClient.invalidateQueries({ queryKey: ['postsList'] });
      queryClient.invalidateQueries({ queryKey: ['postDetail'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setRestoreModalPost(null);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        'Failed to restore post';
      toastError(msg);
    },
  });

  // Delete Comment Mutation
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => contentApi.deleteComment(commentId),
    onSuccess: (res) => {
      success(res.message || 'Comment removed successfully');
      queryClient.invalidateQueries({ queryKey: ['postDetail'] });
      queryClient.invalidateQueries({ queryKey: ['postsList'] });
      setCommentToDelete(null);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        'Failed to remove comment';
      toastError(msg);
    },
  });

  const onConfirmRemovePost = (data: ActionReasonFormData) => {
    if (!removeModalPost) return;
    removeMutation.mutate({
      postId: removeModalPost._id,
      reason: data.reason,
    });
  };

  // Table Columns
  const columns: Column<ContentListItem>[] = [
    {
      header: 'Post Preview',
      className: 'min-w-[260px] max-w-[420px]',
      headerClassName: 'whitespace-nowrap',
      render: (p) => (
        <div className="flex items-center gap-3.5">
          <div className="relative w-14 h-14 rounded-2xl bg-[#FAF7F5] border border-[#EDE4E1] overflow-hidden flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            {p.thumbnail?.location ? (
              <Image
                src={p.thumbnail.location}
                alt="Post thumbnail"
                fill
                sizes="56px"
                className="object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-[#9A8785]">
                <ImageIcon className="w-5 h-5" />
                <span className="text-[9px] font-bold">Text</span>
              </div>
            )}
            {p.thumbnail?.video && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white">
                <Play className="w-4 h-4 fill-white" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[#231817] line-clamp-2 leading-relaxed break-all">
              {p.captionPreview || 'No caption provided'}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={p.category}>
                <span className="capitalize">{p.category}</span>
              </Badge>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Author',
      className: 'min-w-[170px]',
      headerClassName: 'whitespace-nowrap',
      render: (p) => (
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-full bg-[#FAF7F5] border border-[#EDE4E1] flex items-center justify-center text-[#786665] overflow-hidden shrink-0">
            {p.author?.profilePicture?.location ? (
              <Image
                src={p.author.profilePicture.location}
                alt={p.author.name || 'Author'}
                fill
                sizes="32px"
                className="object-cover"
              />
            ) : (
              <User className="w-4 h-4" />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#231817] break-words">{p.author?.name || 'Anonymous'}</div>
            <div className="text-[11px] text-[#786665] break-all">@{p.author?.username || 'unnamed'}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Reactions',
      className: 'whitespace-nowrap w-[100px]',
      headerClassName: 'whitespace-nowrap',
      render: (p) => (
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#231817] whitespace-nowrap">
          <Heart className="w-4 h-4 text-rose-500 fill-rose-50 shrink-0" />
          <span>{p.totalReactions}</span>
        </div>
      ),
    },
    {
      header: 'Comments',
      className: 'whitespace-nowrap w-[100px]',
      headerClassName: 'whitespace-nowrap',
      render: (p) => (
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#786665] whitespace-nowrap">
          <MessageSquare className="w-4 h-4 text-[#9A8785] shrink-0" />
          <span>{p.commentCount}</span>
        </div>
      ),
    },
    {
      header: 'Posted Date',
      className: 'whitespace-nowrap w-[130px]',
      headerClassName: 'whitespace-nowrap',
      render: (p) => (
        <div className="text-xs text-[#786665] flex items-center gap-1.5 whitespace-nowrap">
          <Calendar className="w-3.5 h-3.5 text-[#9A8785] shrink-0" />
          <span>{formatDateOnly(p.createdAt)}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      className: 'whitespace-nowrap w-[150px]',
      headerClassName: 'whitespace-nowrap',
      render: (p) => {
        if (p.status === 'visible') return <Badge variant="visible">Visible</Badge>;
        if (p.removedByAdmin) {
          return (
            <div className="flex flex-col gap-0.5">
              <Badge variant="removed">Removed (Admin)</Badge>
              {p.removalReason && (
                <span className="text-[10px] text-[#786665] break-all max-w-[150px]" title={p.removalReason}>
                  {p.removalReason}
                </span>
              )}
            </div>
          );
        }
        return <Badge variant="neutral">Removed (Author)</Badge>;
      },
    },
    {
      header: 'Actions',
      className: 'text-right whitespace-nowrap w-[80px]',
      headerClassName: 'text-right whitespace-nowrap',
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setSelectedPostId(p._id)}
            className="p-2 rounded-xl text-[#786665] hover:text-[#231817] hover:bg-[#FAF7F5] transition-colors cursor-pointer"
            title="Inspect Post"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Action Dropdown Menu from Shadcn */}
          <DropdownMenu>
            <DropdownMenuTrigger className="p-2 rounded-xl text-[#786665] hover:text-[#231817] hover:bg-[#FAF7F5] transition-colors cursor-pointer outline-none">
              <MoreVertical className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedPostId(p._id)}>
                <Eye className="w-4 h-4 mr-1 text-[#786665]" />
                <span>Inspect Post</span>
              </DropdownMenuItem>

              {p.status === 'visible' ? (
                <DropdownMenuItem
                  variant="danger"
                  onClick={() => {
                    resetRemoveForm();
                    setRemoveModalPost(p);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-1 text-rose-600" />
                  <span>Remove Post</span>
                </DropdownMenuItem>
              ) : (
                p.removedByAdmin && (
                  <DropdownMenuItem
                    onClick={() => setRestoreModalPost(p)}
                  >
                    <RotateCcw className="w-4 h-4 mr-1 text-emerald-600" />
                    <span className="text-emerald-700">Restore Post</span>
                  </DropdownMenuItem>
                )
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
        title="Content Moderation"
        subtitle="Review community polaroids, manage reported captions, inspect comments, and restore visible posts."
      />

      <main className="p-6 sm:p-8 space-y-6 max-w-7xl">
        <DataTable<ContentListItem>
          columns={columns}
          data={contentData?.posts || []}
          keyExtractor={(p) => p._id}
          isLoading={isLoading}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search captions or author username..."
          filterSlot={
            <>
              {/* Category Filter using Shadcn Select */}
              <div className="w-40">
                <Select
                  value={categoryFilter}
                  onValueChange={(val) => {
                    setCategoryFilter(val);
                    setPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="food">Food</SelectItem>
                    <SelectItem value="fun">Fun</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                    <SelectItem value="visible">Visible Only</SelectItem>
                    <SelectItem value="removed">Removed Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
          pagination={contentData?.pagination}
          onPageChange={setPage}
          onRowClick={(p) => setSelectedPostId(p._id)}
          emptyTitle="No posts found"
          emptyMessage="No posts matching your search query or filter settings."
        />

        {/* Post Detail Modal */}
        <Modal
          isOpen={!!selectedPostId}
          onClose={() => setSelectedPostId(null)}
          size="lg"
          title="Post Moderation Inspector"
          description="Examine media attachments, reactions breakdown, and top-level user comments."
        >
          {isDetailLoading || !postDetail ? (
            <DetailSkeleton />
          ) : (
            <div className="space-y-6">
              {/* Polaroid Frame & Media Card */}
              <div className="flex flex-col sm:flex-row items-center justify-center p-6 bg-[#FAF7F5] rounded-3xl border border-[#EDE4E1]">
                <div className="relative p-3 pb-8 bg-white rounded-2xl shadow-lg border border-[#EDE4E1] max-w-sm w-full transform -rotate-1 hover:rotate-0 transition-transform">
                  <div className="relative w-full aspect-square rounded-xl bg-[#FAF7F5] overflow-hidden flex items-center justify-center">
                    {postDetail.post.media && postDetail.post.media.length > 0 && postDetail.post.media[0].file?.location ? (
                      <Image
                        src={postDetail.post.media[0].file.location}
                        alt="Post media"
                        fill
                        sizes="(max-width: 384px) 100vw, 384px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-[#786665]">
                        <ImageIcon className="w-12 h-12 stroke-[1.5]" />
                        <span className="text-xs mt-2 font-bold">Text-only Post</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 px-2 break-all">
                    <p className="text-sm font-semibold text-[#231817] leading-relaxed break-all">
                      &quot;{postDetail.post.caption}&quot;
                    </p>
                    <div className="flex items-center justify-between text-xs text-[#786665] mt-3 pt-2 border-t border-[#EDE4E1] break-all">
                      <span className="break-all">@{postDetail.post.author?.username}</span>
                      <span>{formatDateOnly(postDetail.post.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status & Removal Details */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-[#EDE4E1] gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#786665] uppercase tracking-wider">
                    Moderation Status
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {postDetail.post.status === 'visible' ? (
                      <Badge variant="visible">Visible</Badge>
                    ) : (
                      <Badge variant="removed">Removed by Admin</Badge>
                    )}
                    {postDetail.post.removalReason && (
                      <span className="text-xs text-rose-700 font-medium break-all">
                        Reason: {postDetail.post.removalReason}
                      </span>
                    )}
                  </div>
                </div>

                {postDetail.post.status === 'visible' ? (
                  <button
                    onClick={() => {
                      resetRemoveForm();
                      setRemoveModalPost(postDetail.post as unknown as ContentListItem);
                    }}
                    className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove Post
                  </button>
                ) : (
                  postDetail.post.removedByAdmin && (
                    <button
                      onClick={() => setRestoreModalPost(postDetail.post as unknown as ContentListItem)}
                      className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restore Post
                    </button>
                  )
                )}
              </div>

              {/* Reactions Breakdown Grid */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#786665]">
                  Reactions Breakdown
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  <div className="p-3 rounded-2xl bg-white border border-[#EDE4E1] text-center flex flex-col items-center justify-center">
                    <ThumbsUp className="w-5 h-5 text-blue-500" />
                    <div className="text-xs font-bold text-[#231817] mt-1.5">{postDetail.post.reactionCounts?.like ?? 0}</div>
                    <span className="text-[10px] text-[#786665]">Like</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white border border-[#EDE4E1] text-center flex flex-col items-center justify-center">
                    <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                    <div className="text-xs font-bold text-[#231817] mt-1.5">{postDetail.post.reactionCounts?.heart ?? 0}</div>
                    <span className="text-[10px] text-[#786665]">Heart</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white border border-[#EDE4E1] text-center flex flex-col items-center justify-center">
                    <Laugh className="w-5 h-5 text-amber-500" />
                    <div className="text-xs font-bold text-[#231817] mt-1.5">{postDetail.post.reactionCounts?.laugh ?? 0}</div>
                    <span className="text-[10px] text-[#786665]">Laugh</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white border border-[#EDE4E1] text-center flex flex-col items-center justify-center">
                    <Smile className="w-5 h-5 text-indigo-500" />
                    <div className="text-xs font-bold text-[#231817] mt-1.5">{postDetail.post.reactionCounts?.wow ?? 0}</div>
                    <span className="text-[10px] text-[#786665]">Wow</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white border border-[#EDE4E1] text-center flex flex-col items-center justify-center">
                    <Frown className="w-5 h-5 text-blue-400" />
                    <div className="text-xs font-bold text-[#231817] mt-1.5">{postDetail.post.reactionCounts?.sad ?? 0}</div>
                    <span className="text-[10px] text-[#786665]">Sad</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white border border-[#EDE4E1] text-center flex flex-col items-center justify-center">
                    <Angry className="w-5 h-5 text-rose-600" />
                    <div className="text-xs font-bold text-[#231817] mt-1.5">{postDetail.post.reactionCounts?.angry ?? 0}</div>
                    <span className="text-[10px] text-[#786665]">Angry</span>
                  </div>
                </div>
              </div>

              {/* Comments List & Comment Moderation */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#786665]">
                    Comments ({postDetail.post.commentCount})
                  </span>
                  <span className="text-[11px] text-[#9A8785]">Top-level comments</span>
                </div>

                {postDetail.comments && postDetail.comments.length > 0 ? (
                  <div className="space-y-2.5">
                    {postDetail.comments.map((c) => (
                      <div
                        key={c._id}
                        className="p-3.5 rounded-2xl bg-white border border-[#EDE4E1] flex items-start justify-between gap-3 group"
                      >
                        <div className="space-y-1 min-w-0 flex-1 break-all">
                          <div className="flex items-center gap-2 flex-wrap break-all">
                            <span className="text-xs font-bold text-[#231817] break-all">
                              {c.author?.name || 'Anonymous'}
                            </span>
                            <span className="text-[11px] text-[#9A8785] break-all">@{c.author?.username}</span>
                            <span className="text-[11px] text-[#9A8785]">• {formatDateTimeWithTz(c.createdAt)}</span>
                          </div>
                          <p className="text-xs text-[#231817] leading-relaxed break-all">{c.text}</p>
                          {c.replyCount > 0 && (
                            <span className="text-[10px] font-semibold text-[#786665] bg-[#FAF7F5] px-2 py-0.5 rounded-md inline-block">
                              {c.replyCount} {c.replyCount === 1 ? 'reply' : 'replies'}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => setCommentToDelete({ id: c._id, text: c.text })}
                          className="p-1.5 rounded-lg text-[#9A8785] hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                          title="Delete Comment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-[#FAF7F5] border border-[#EDE4E1] text-center text-xs text-[#786665]">
                    No comments posted yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>

        {/* Remove Post Confirmation Modal (Validated with RHF & Zod) */}
        <Modal
          isOpen={!!removeModalPost}
          onClose={() => setRemoveModalPost(null)}
          size="md"
          title="Remove Post from Refrigerator App"
          description="Are you sure you want to remove this post? It will vanish from feeds and discovery."
        >
          <form onSubmit={handleRemoveSubmit(onConfirmRemovePost)} className="space-y-4" noValidate>
            <div className="p-4 bg-[#FAF7F5] rounded-2xl border border-[#EDE4E1] space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-[#786665]">
                Immediate Application Impact
              </div>
              <ul className="space-y-1.5 text-xs text-[#231817]">
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>The post and its comments/reactions disappear from everyone&apos;s mobile feeds.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>The author is automatically notified with the removal reason.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>The author keeps any refrigerator magnets already earned from this post.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>Can be restored later by a superadmin if needed.</span>
                </li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-[#231817]">
                <label htmlFor="removal-reason">
                  Removal Reason (Sent to Author) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[#9A8785]">
                  {removeReasonValue.length}/500
                </span>
              </div>
              <textarea
                id="removal-reason"
                {...registerRemove('reason')}
                placeholder="e.g. Violates community standards on inappropriate content"
                maxLength={500}
                rows={3}
                className="w-full p-3 bg-white border border-[#EDE4E1] hover:border-[#FFB1A2] focus:border-[#FF644E] focus:ring-4 focus:ring-[#FF644E]/10 rounded-2xl text-sm text-[#231817] outline-none transition-all resize-none"
              />
              {removeErrors.reason && (
                <p className="text-xs text-rose-600 font-medium pl-1">
                  {removeErrors.reason.message}
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-[#EDE4E1] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setRemoveModalPost(null)}
                className="px-5 py-2.5 rounded-full border border-[#EDE4E1] text-[#786665] hover:text-[#231817] font-semibold text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={removeMutation.isPending}
                className="px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                Remove Post
              </button>
            </div>
          </form>
        </Modal>

        {/* Restore Post Confirmation Modal */}
        <ConfirmationModal
          isOpen={!!restoreModalPost}
          onClose={() => setRestoreModalPost(null)}
          onConfirm={() =>
            restoreModalPost && restoreMutation.mutateAsync(restoreModalPost._id)
          }
          title="Restore Post to Feeds"
          description="Make this post visible again in the mobile app. Its comments and reactions will also become accessible."
          confirmLabel="Restore Post"
          confirmVariant="success"
          isLoading={restoreMutation.isPending}
        />

        {/* Delete Comment Confirmation Modal */}
        <ConfirmationModal
          isOpen={!!commentToDelete}
          onClose={() => setCommentToDelete(null)}
          onConfirm={() =>
            commentToDelete && deleteCommentMutation.mutateAsync(commentToDelete.id)
          }
          title="Delete Comment"
          description={`Permanently remove comment: "${commentToDelete?.text}"? The post and its other comments will remain intact.`}
          confirmLabel="Delete Comment"
          confirmVariant="danger"
          isLoading={deleteCommentMutation.isPending}
        />
      </main>
    </div>
  );
}

export default function ContentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[#786665]">Loading content moderation...</div>}>
      <ContentPageContent />
    </Suspense>
  );
}
