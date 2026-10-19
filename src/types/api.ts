// src/types/api.ts
// Direct mapping to Refrigerator Pictures — Super Admin Backend Integration Guide (§13)

export type ObjectId = string; // 24-char hex
export type ISODate = string; // "2026-10-15T11:23:43.111Z" (UTC)

export interface Pagination {
  itemsPerPage: number;
  currentPage: number;
  totalItems: number;
  totalPages: number;
}

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  pagination?: Pagination; // only on GET /admin/notifications
}

export interface ApiError {
  success: false;
  message: string;
  error?: { path: string; message: string }[]; // 422 only; "error", singular
}

export type Category = 'family' | 'food' | 'fun';
export type SignUpMethod = 'email' | 'google' | 'apple';

export interface FileRef {
  _id: ObjectId;
  key: string | null;
  location: string | null;
  mimetype?: string | null;
  size?: number | null;
  fileName?: string | null;
  video?: VideoInfo | null;
}

export interface VideoInfo {
  status: 'none' | 'pending' | 'processing' | 'ready' | 'failed';
  failureReason: string | null;
  hlsUrl: string | null;
  posterUrl: string | null;
  durationSec: number | null;
  width: number | null;
  height: number | null;
}

export interface UserStub {
  _id: ObjectId;
  name: string | null;
  username: string | null;
  profilePicture: FileRef | null;
}

// Module 1: Admin Access
export interface AdminUser {
  id: ObjectId;
  email: string;
  role: 'superadmin';
}

export interface LoginData {
  token: string;
  admin: AdminUser;
}

export interface VerifyOtpData {
  resetToken: string;
}

// Module 2: Dashboard Analytics
export interface DashboardStats {
  totalUsers: number;
  newUsersToday: number;
  activeUsers: number;
  totalPosts: number;
  postsByCategory: Partial<Record<Category, number>>;
  totalFriendships: number;
  pendingReports: number;
}

// Module 3: Users
export interface UserListItem {
  _id: ObjectId;
  name: string | null;
  username: string | null;
  email: string;
  profilePicture: FileRef | null;
  dob: ISODate | null;
  isEmailVerified: boolean;
  isProfileCompleted: boolean;
  isDeactivatedByAdmin: boolean;
  isDeleted: boolean;
  createdAt: ISODate;
}

export interface UserListData {
  users: UserListItem[];
  pagination: Pagination;
}

export interface UserDetail {
  user: UserListItem & {
    bio: string | null;
    method: SignUpMethod | null;
    friendsCount: number;
    postsCount: number;
    favoriteVacationDestinations: string[];
    favoriteActivities: string[];
    favoriteRestaurants: string[];
    deactivationReason: string | null;
    notificationPreferences: {
      friendRequests: boolean;
      messages: boolean;
      likesAndComments: boolean;
      magnets: boolean;
      muteAll: boolean;
    };
    updatedAt: ISODate;
  };
  postCounts: Partial<Record<Category, number>>;
  magnets: { _id: ObjectId; user: ObjectId; category: Category; earnedAt: ISODate }[];
  reports: UserReportItem[];
}

export interface UserReportItem {
  _id: ObjectId;
  reporter: UserStub | null;
  entityType: ReportEntityType;
  entityId: ObjectId;
  reportedUserId: ObjectId | null;
  messageId: ObjectId | null;
  reason: string;
  description: string | null;
  status: ReportStatus;
  adminNotes: string | null;
  createdAt: ISODate;
}

// Module 4: Content Moderation
export type PostStatus = 'visible' | 'removed';
export type ReactionType = 'like' | 'heart' | 'laugh' | 'wow' | 'sad' | 'angry';

export interface ContentListItem {
  _id: ObjectId;
  author: UserStub | null;
  category: Category;
  captionPreview: string | null;
  thumbnail: FileRef | null;
  mediaCount: number;
  totalReactions: number;
  commentCount: number;
  status: PostStatus;
  removedByAdmin: boolean;
  removalReason: string | null;
  createdAt: ISODate;
}

export interface ContentListData {
  posts: ContentListItem[];
  pagination: Pagination;
}

export interface ContentDetail {
  post: {
    _id: ObjectId;
    author: UserStub | null;
    category: Category;
    caption: string | null;
    media: { file: FileRef | null; thumbnail: FileRef | null }[];
    isPolaroid: boolean;
    status: PostStatus;
    removedByAdmin: boolean;
    removalReason: string | null;
    reactionCounts: Record<ReactionType, number>;
    commentCount: number;
    createdAt: ISODate;
    updatedAt: ISODate;
  };
  comments: {
    _id: ObjectId;
    author: UserStub | null;
    text: string;
    replyCount: number;
    likeCount: number;
    createdAt: ISODate;
  }[];
  commentsPagination: Pagination;
  reactions: {
    _id: ObjectId;
    user: UserStub | null;
    type: ReactionType;
    createdAt: ISODate;
  }[];
  reactionsPagination: Pagination;
}

// Module 5: Notifications
export type NotificationStatus = 'draft' | 'scheduled' | 'sent' | 'cancelled';
export type Audience = 'active_users' | 'custom';

export interface AdminNotification {
  _id: ObjectId;
  title: string;
  description: string;
  targetAudience: Audience | null;
  scheduledAt: ISODate | null;
  sentAt: ISODate | null;
  status: NotificationStatus;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface CreateNotificationBody {
  title: string;
  description: string;
  targetAudience?: Audience;
  customUsers?: ObjectId[];
  scheduledAt?: ISODate;
  saveAsDraft?: boolean;
}

// Module 6: Reports & Private Chat
export type ReportStatus = 'pending' | 'under_review' | 'resolved' | 'dismissed';
export type ReportEntityType = 'User' | 'Post' | 'Chat';

export interface ReportPerson {
  _id: ObjectId;
  name: string | null;
  email: string;
  profilePicture: { _id: ObjectId; key: string | null; location?: string | null } | null;
  isDeactivatedByAdmin?: boolean;
}

export interface ReportListItem {
  _id: ObjectId;
  reporter: ReportPerson | null;
  reportedUserId: ReportPerson | null;
  entityType: ReportEntityType;
  entityId: Record<string, unknown> | null;
  messageId: ObjectId | null;
  reason: string;
  description: string | null;
  status: ReportStatus;
  resolvedBy: { _id: ObjectId; email: string } | null;
  resolvedAt: ISODate | null;
  adminNotes: string | null;
  createdAt: ISODate;
}

export interface ReportListData {
  reports: ReportListItem[];
  pagination: Pagination;
}

export interface ChatMessage {
  _id: ObjectId;
  chatId: ObjectId;
  sender: ObjectId;
  type: 'text' | 'image' | 'video';
  content: string | null;
  media: ObjectId[];
  isDeletedForEveryone: boolean;
  createdAt: ISODate;
}

export interface ReportDetailData {
  report: ReportListItem;
  messageContext: null | {
    message: ChatMessage | null;
    before: ChatMessage[];
    after: ChatMessage[];
  };
}

export interface ResolveReportBody {
  action: 'resolve' | 'dismiss';
  adminNotes: string;
  suspendUser?: boolean;
}

// Module 7: Video Processing Pipeline Health
export interface VideoPipelineHealth {
  generatedAt: ISODate;
  hlsEnabled: boolean;
  healthy: boolean;
  attention: string[];
  files: {
    byStatus: {
      none: number;
      pending: number;
      processing: number;
      ready: number;
      failed: number;
    };
    legacyRemaining: number;
  };
  queue: unknown | null;
  pipeline: {
    oldestPendingAgeSec: number | null;
    pendingOverTenMinutes: number;
    legacyPending: number;
  };
}
