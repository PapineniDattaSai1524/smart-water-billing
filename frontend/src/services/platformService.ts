import axiosClient from '@/api/axiosClient';
import type {
  ApiResponse, PlatformAnalytics, PlatformUser, Role, RevenueAnalytics, SystemHealth, WaterAnalytics,
} from '@/utils/types';

function downloadCsv(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export const platformService = {
  analytics: () => axiosClient.get<ApiResponse<PlatformAnalytics>>('/super-admin/analytics/platform').then((r) => r.data),

  revenue: () => axiosClient.get<ApiResponse<RevenueAnalytics>>('/super-admin/analytics/revenue').then((r) => r.data),

  water: () => axiosClient.get<ApiResponse<WaterAnalytics>>('/super-admin/analytics/water').then((r) => r.data),

  systemHealth: () => axiosClient.get<ApiResponse<SystemHealth>>('/super-admin/system-health').then((r) => r.data),

  listUsers: (role?: Role) =>
    axiosClient.get<ApiResponse<PlatformUser[]>>('/super-admin/users', { params: role ? { role } : {} }).then((r) => r.data),

  enableUser: (id: number) =>
    axiosClient.put<ApiResponse<PlatformUser>>(`/super-admin/users/${id}/enable`).then((r) => r.data),

  disableUser: (id: number) =>
    axiosClient.put<ApiResponse<PlatformUser>>(`/super-admin/users/${id}/disable`).then((r) => r.data),

  changeRole: (id: number, role: Role) =>
    axiosClient.put<ApiResponse<PlatformUser>>(`/super-admin/users/${id}/role`, { role }).then((r) => r.data),

  broadcast: (payload: { title: string; message: string; targetRole?: Role }) =>
    axiosClient.post<ApiResponse<{ recipientCount: number }>>('/notifications/broadcast', payload).then((r) => r.data),

  /** Manually triggers the Alert & Notification Engine instead of waiting for the daily cron run. */
  runAlertCheckNow: () =>
    axiosClient
      .post<ApiResponse<{ evaluated: number; thresholdAlerts: number; anomalyAlerts: number }>>('/notifications/run-alert-check')
      .then((r) => r.data),

  exportApartmentsCsv: async () => {
    const { data } = await axiosClient.get('/super-admin/reports/apartments.csv', { responseType: 'blob' });
    downloadCsv(data, 'platform-apartments-report.csv');
  },
};
