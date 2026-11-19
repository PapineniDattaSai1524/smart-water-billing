import axiosClient from '@/api/axiosClient';
import type {
  ApiResponse, NotificationItem, NotificationSearchParams, OwnerNotificationBatch, PageResponse,
} from '@/utils/types';

export const notificationService = {
  list: (page = 0, size = 20) =>
    axiosClient
      .get<ApiResponse<PageResponse<NotificationItem>>>('/notifications', { params: { page, size } })
      .then((r) => r.data),

  unreadCount: () =>
    axiosClient.get<ApiResponse<{ unreadCount: number }>>('/notifications/unread-count').then((r) => r.data),

  markAllRead: () => axiosClient.put<ApiResponse<void>>('/notifications/mark-all-read').then((r) => r.data),

  /** Marks a single notification of the current user's as read. */
  markOneRead: (id: number) =>
    axiosClient.put<ApiResponse<void>>(`/notifications/${id}/read`).then((r) => r.data),

  /** The current user's own notifications, filtered by type / read status / date range. */
  search: (params: NotificationSearchParams = {}) =>
    axiosClient
      .get<ApiResponse<PageResponse<NotificationItem>>>('/notifications/search', {
        params: { page: 0, size: 20, ...params },
      })
      .then((r) => r.data),

  /** Admin: every alert/notification raised for an apartment they manage. */
  listByApartment: (apartmentId: number, params: NotificationSearchParams = {}) =>
    axiosClient
      .get<ApiResponse<PageResponse<NotificationItem>>>(`/notifications/apartment/${apartmentId}`, {
        params: { page: 0, size: 20, ...params },
      })
      .then((r) => r.data),

  /** Building Owner: send a notification to every resident of the buildings they administer. */
  sendOwnerBroadcast: (payload: { title: string; message: string }) =>
    axiosClient
      .post<ApiResponse<OwnerNotificationBatch>>('/notifications/owner-broadcast', payload)
      .then((r) => r.data),

  /** Building Owner: how many residents an owner-broadcast would reach right now. */
  ownerBroadcastRecipientCount: () =>
    axiosClient
      .get<ApiResponse<{ recipientCount: number }>>('/notifications/owner-broadcast/recipient-count')
      .then((r) => r.data),

  /** Building Owner: their own sent-notification history. */
  ownerBroadcastHistory: (params: { search?: string; status?: string; page?: number; size?: number } = {}) =>
    axiosClient
      .get<ApiResponse<PageResponse<OwnerNotificationBatch>>>('/notifications/owner-broadcast/history', {
        params: { page: 0, size: 10, ...params },
      })
      .then((r) => r.data),

  /** Building Owner: full detail of one of their own sent notifications. */
  ownerBroadcastDetail: (batchId: string) =>
    axiosClient
      .get<ApiResponse<OwnerNotificationBatch>>(`/notifications/owner-broadcast/${batchId}`)
      .then((r) => r.data),
};
