import axiosClient from '@/api/axiosClient';
import type { ApiResponse, RevenueAnalytics, WaterAnalytics } from '@/utils/types';

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

export const analyticsService = {
  revenue: () => axiosClient.get<ApiResponse<RevenueAnalytics>>('/admin/analytics/revenue').then((r) => r.data),

  water: () => axiosClient.get<ApiResponse<WaterAnalytics>>('/admin/analytics/water').then((r) => r.data),

  exportInvoicesCsv: async () => {
    const { data } = await axiosClient.get('/admin/reports/invoices.csv', { responseType: 'blob' });
    downloadCsv(data, 'invoices-report.csv');
  },

  exportUsageCsv: async () => {
    const { data } = await axiosClient.get('/admin/reports/usage.csv', { responseType: 'blob' });
    downloadCsv(data, 'water-usage-report.csv');
  },
};
