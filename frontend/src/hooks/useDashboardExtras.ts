import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@/api/axiosClient';
import { notificationService } from '@/services/notificationService';
import { residentSelfService } from '@/services/residentSelfService';
import { alertConfigService } from '@/services/alertConfigService';
import type {
  ApiResponse, AdminDashboardStats, NotificationSearchParams, AlertThresholdConfigPayload,
} from '@/utils/types';

export function useAdminDashboardStats() {
  return useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () =>
      axiosClient.get<ApiResponse<AdminDashboardStats>>('/admin/dashboard').then((r) => r.data.data),
  });
}

export function useResidentDashboard() {
  return useQuery({
    queryKey: ['resident-dashboard'],
    queryFn: () => residentSelfService.getDashboard().then((r) => r.data),
  });
}

export function useMyHousehold() {
  return useQuery({
    queryKey: ['resident-my-household'],
    queryFn: () => residentSelfService.getMyHousehold().then((r) => r.data),
  });
}

export function useMyUsageHistory() {
  return useQuery({
    queryKey: ['resident-my-usage-history'],
    queryFn: () => residentSelfService.getMyUsageHistory().then((r) => r.data),
  });
}

// Week 5-6 Feature 1: dashboard trend charts (real data from water_usage_logs)
export function useDailyUsageTrend(days = 30) {
  return useQuery({
    queryKey: ['resident-daily-trend', days],
    queryFn: () => residentSelfService.getDailyTrend(days).then((r) => r.data),
  });
}

export function useMonthlyUsageTrend(months = 6) {
  return useQuery({
    queryKey: ['resident-monthly-trend', months],
    queryFn: () => residentSelfService.getMonthlyTrend(months).then((r) => r.data),
  });
}

// Week 5-6 Feature 4: peer benchmarking (apartment average + similar-sized household average)
export function useConsumptionComparison() {
  return useQuery({
    queryKey: ['resident-consumption-comparison'],
    queryFn: () => residentSelfService.getConsumptionComparison().then((r) => r.data),
  });
}

export function useNotifications(page = 0, size = 20) {
  return useQuery({
    queryKey: ['notifications', page, size],
    queryFn: () => notificationService.list(page, size).then((r) => r.data),
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => notificationService.unreadCount().then((r) => r.data.unreadCount),
    refetchInterval: 30000,
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });
}

/** Marks a single notification as read (e.g. clicking one item in the list/bell), then refreshes the lists + badge count. */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notificationService.markOneRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-search'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-apartment'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });
}

/** The current user's own notifications, filtered by type / read status / date range (e.g. severity-driven filters on the Notifications page). */
export function useNotificationSearch(params: NotificationSearchParams = {}) {
  return useQuery({
    queryKey: ['notifications-search', params],
    queryFn: () => notificationService.search(params).then((r) => r.data),
  });
}

/** Admin: every alert/notification raised for an apartment they manage. */
export function useApartmentNotifications(apartmentId: number | undefined, params: NotificationSearchParams = {}) {
  return useQuery({
    queryKey: ['notifications-apartment', apartmentId, params],
    queryFn: () => notificationService.listByApartment(apartmentId as number, params).then((r) => r.data),
    enabled: apartmentId != null,
  });
}

/** Admin: the alert threshold configuration (platform default + any override) for an apartment they manage. */
export function useAlertConfig(apartmentId: number | undefined) {
  return useQuery({
    queryKey: ['alert-config', apartmentId],
    queryFn: () => alertConfigService.get(apartmentId as number).then((r) => r.data),
    enabled: apartmentId != null,
  });
}

/** Admin: create/update the alert threshold override for an apartment they manage. */
export function useUpdateAlertConfig(apartmentId: number | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AlertThresholdConfigPayload) =>
      alertConfigService.update(apartmentId as number, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-config', apartmentId] });
    },
  });
}

/** Building Owner: how many of their residents an owner-broadcast would reach right now. */
export function useOwnerBroadcastRecipientCount() {
  return useQuery({
    queryKey: ['owner-broadcast-recipient-count'],
    queryFn: () => notificationService.ownerBroadcastRecipientCount().then((r) => r.data.recipientCount),
  });
}

/** Building Owner: send a notification to every resident of the buildings they administer. */
export function useSendOwnerBroadcast() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { title: string; message: string }) => notificationService.sendOwnerBroadcast(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-broadcast-history'] });
      queryClient.invalidateQueries({ queryKey: ['owner-broadcast-recipient-count'] });
    },
  });
}

/** Building Owner: their own sent-notification history, searchable/filterable/paginated. */
export function useOwnerBroadcastHistory(params: { search?: string; status?: string; page?: number; size?: number } = {}) {
  return useQuery({
    queryKey: ['owner-broadcast-history', params],
    queryFn: () => notificationService.ownerBroadcastHistory(params).then((r) => r.data),
  });
}
