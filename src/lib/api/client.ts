// src/lib/api/client.ts
import axios, { AxiosError, AxiosResponse } from 'axios';
import { cleanParams } from '@/lib/utils';
import { getAuthCookie, removeAuthCookie } from '@/lib/cookies';
import {
  DashboardStats,
  UserListData,
  UserDetail,
  ContentListData,
  ContentDetail,
  AdminNotification,
  Pagination,
  ReportListData,
  ReportDetailData,
  CreateNotificationBody,
  ResolveReportBody,
  VideoPipelineHealth,
  LoginData,
  ApiSuccess
} from '@/types/api';

// Base URL: http://3.19.40.79:3005 without trailing slash
const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://3.19.40.79:3005';
const BASE_URL = rawBaseUrl.replace(/\/+$/, '');

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Attach Bearer token on every request
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = getAuthCookie() || sessionStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Interceptor: Handle 401 globally, clearing session and redirecting (except login & otp routes)
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<{ message?: string; error?: { path: string; message: string }[] }>) => {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    if (typeof window !== 'undefined' && status === 401) {
      const url = error.config?.url || '';
      // Don't auto-redirect on login or auth password reset failures
      if (!url.includes('/admin/auth/login') && !url.includes('/auth/')) {
        removeAuthCookie();
        sessionStorage.removeItem('adminToken');
        sessionStorage.removeItem('adminUser');
        window.location.assign('/login?reason=' + encodeURIComponent(message || 'Session expired. Please log in again.'));
      }
    }
    return Promise.reject(error);
  }
);

// ----------------- API Services -----------------

// Module 1: Auth
export const authApi = {
  login: async (email: string, password: string): Promise<ApiSuccess<LoginData>> => {
    const res = await apiClient.post<ApiSuccess<LoginData>>('/admin/auth/login', { email, password });
    return res.data;
  },

  forgotPassword: async (email: string): Promise<ApiSuccess<null>> => {
    const res = await apiClient.post<ApiSuccess<null>>('/admin/auth/forgot-password', { email });
    return res.data;
  },

  verifyOtp: async (email: string, otp: string): Promise<ApiSuccess<{ resetToken: string }>> => {
    const res = await apiClient.post<ApiSuccess<{ resetToken: string }>>('/auth/verify-otp', {
      email,
      otp,
      purpose: 'reset',
      role: 'superadmin',
    });
    return res.data;
  },

  resetPassword: async (resetToken: string, password: string): Promise<ApiSuccess<null>> => {
    const res = await apiClient.post<ApiSuccess<null>>('/auth/reset-password', { resetToken, password });
    return res.data;
  },
};

// Module 2: Dashboard Analytics
export const analyticsApi = {
  getStats: async (): Promise<DashboardStats> => {
    const res = await apiClient.get<ApiSuccess<DashboardStats>>('/admin/analytics/stats');
    return res.data.data;
  },

  getBlockedUsersCount: async (): Promise<number> => {
    try {
      const res = await apiClient.get<ApiSuccess<UserListData>>('/admin/users', {
        params: { isDeactivatedByAdmin: 'true', limit: 1 },
      });
      return res.data?.data?.pagination?.totalItems ?? 0;
    } catch {
      return 0;
    }
  },
};

// Module 3: Users
export const usersApi = {
  getUsers: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    isDeactivatedByAdmin?: string;
    isProfileCompleted?: string;
    showDeleted?: string;
    sortBy?: 'createdAt' | 'name';
    sortOrder?: 'asc' | 'desc';
  }): Promise<UserListData> => {
    const cleaned = cleanParams(params);
    const res = await apiClient.get<ApiSuccess<UserListData>>('/admin/users', { params: cleaned });
    return res.data.data;
  },

  getUserDetail: async (userId: string): Promise<UserDetail> => {
    const res = await apiClient.get<ApiSuccess<UserDetail>>(`/admin/users/${userId}`);
    return res.data.data;
  },

  updateStatus: async (userId: string, action: 'activate' | 'deactivate', reason?: string): Promise<ApiSuccess<null>> => {
    const payload = action === 'deactivate' ? { action, reason } : { action };
    const res = await apiClient.patch<ApiSuccess<null>>(`/admin/users/${userId}/status`, cleanParams(payload));
    return res.data;
  },

  deleteUser: async (userId: string): Promise<ApiSuccess<null>> => {
    const res = await apiClient.delete<ApiSuccess<null>>(`/admin/users/${userId}`);
    return res.data;
  },

  getUserRemovedPosts: async (userId: string): Promise<ContentListData> => {
    const res = await apiClient.get<ApiSuccess<ContentListData>>('/admin/content/posts', {
      params: { author: userId, status: 'removed' },
    });
    return res.data.data;
  },
};

// Module 4: Content Moderation
export const contentApi = {
  getPosts: async (params: {
    page?: number;
    limit?: number;
    category?: 'family' | 'food' | 'fun';
    status?: 'visible' | 'removed';
    author?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ContentListData> => {
    const cleaned = cleanParams(params);
    const res = await apiClient.get<ApiSuccess<ContentListData>>('/admin/content/posts', { params: cleaned });
    return res.data.data;
  },

  getPostDetail: async (postId: string): Promise<ContentDetail> => {
    const res = await apiClient.get<ApiSuccess<ContentDetail>>(`/admin/content/posts/${postId}`);
    return res.data.data;
  },

  updatePostStatus: async (postId: string, action: 'remove' | 'restore', reason?: string): Promise<ApiSuccess<null>> => {
    const payload = action === 'remove' ? { action, reason } : { action };
    const res = await apiClient.patch<ApiSuccess<null>>(`/admin/content/posts/${postId}/status`, cleanParams(payload));
    return res.data;
  },

  deleteComment: async (commentId: string): Promise<ApiSuccess<null>> => {
    const res = await apiClient.delete<ApiSuccess<null>>(`/admin/content/comments/${commentId}`);
    return res.data;
  },
};

// Module 5: Notifications
export const notificationsApi = {
  getNotifications: async (params: {
    page?: number;
    limit?: number;
    status?: 'draft' | 'scheduled' | 'sent' | 'cancelled';
    targetAudience?: 'active_users' | 'custom';
    search?: string;
    sortBy?: 'createdAt' | 'scheduledAt';
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ notifications: AdminNotification[]; pagination: Pagination }> => {
    const cleaned = cleanParams(params);
    const res = await apiClient.get<{ success: boolean; message: string; data: AdminNotification[]; pagination: Pagination }>(
      '/admin/notifications',
      { params: cleaned }
    );
    // Envelope for notifications: data is an array, pagination is a top-level sibling
    return {
      notifications: res.data.data || [],
      pagination: res.data.pagination || {
        itemsPerPage: params.limit || 10,
        currentPage: params.page || 1,
        totalItems: res.data.data?.length || 0,
        totalPages: 1,
      },
    };
  },

  createNotification: async (body: CreateNotificationBody): Promise<ApiSuccess<{ notificationContentId: string }>> => {
    const res = await apiClient.post<ApiSuccess<{ notificationContentId: string }>>(
      '/admin/notifications',
      cleanParams(body as unknown as Record<string, unknown>)
    );
    return res.data;
  },

  cancelNotification: async (notificationId: string): Promise<ApiSuccess<null>> => {
    const res = await apiClient.patch<ApiSuccess<null>>(`/admin/notifications/${notificationId}/status`, {
      action: 'cancel',
    });
    return res.data;
  },

  deleteDraft: async (notificationId: string): Promise<ApiSuccess<null>> => {
    const res = await apiClient.delete<ApiSuccess<null>>(`/admin/notifications/${notificationId}`);
    return res.data;
  },
};

// Module 6: Reports & Private Chat
export const reportsApi = {
  getReports: async (params: {
    page?: number;
    limit?: number;
    status?: 'pending' | 'under_review' | 'resolved' | 'dismissed';
    reason?: string;
    search?: string;
  }): Promise<ReportListData> => {
    const cleaned = cleanParams(params);
    const res = await apiClient.get<ApiSuccess<ReportListData>>('/admin/reports', { params: cleaned });
    return res.data.data;
  },

  getReportDetail: async (reportId: string): Promise<ReportDetailData> => {
    const res = await apiClient.get<ApiSuccess<ReportDetailData>>(`/admin/reports/${reportId}`);
    return res.data.data;
  },

  resolveReport: async (reportId: string, body: ResolveReportBody): Promise<ApiSuccess<null>> => {
    const res = await apiClient.patch<ApiSuccess<null>>(
      `/admin/reports/${reportId}/status`,
      cleanParams(body as unknown as Record<string, unknown>)
    );
    return res.data;
  },
};

// Module 7: Video Transcoding Pipeline Health
export const pipelineApi = {
  getPipelineHealth: async (): Promise<VideoPipelineHealth> => {
    const res = await apiClient.get<ApiSuccess<VideoPipelineHealth>>('/admin/video-processing');
    return res.data.data;
  },
};
