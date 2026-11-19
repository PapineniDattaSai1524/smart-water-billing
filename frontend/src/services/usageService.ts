import axiosClient from '@/api/axiosClient';
import type { ApiResponse, CsvUploadResult, WaterUsageLog } from '@/utils/types';

export interface UsageLogPayload {
  householdId: number;
  readingDate: string;
  meterReadingKl: number;
  remarks?: string;
}

export const usageService = {
  getByHousehold: (householdId: number) =>
    axiosClient.get<ApiResponse<WaterUsageLog[]>>(`/usage/household/${householdId}`).then((r) => r.data),
  /** Most recent readings across every household the current admin owns (building-wide activity feed). */
  getRecentForAdmin: (limit = 50) =>
    axiosClient.get<ApiResponse<WaterUsageLog[]>>('/usage/admin/recent', { params: { limit } }).then((r) => r.data),
  getByHouseholdAndRange: (householdId: number, from: string, to: string) =>
    axiosClient
      .get<ApiResponse<WaterUsageLog[]>>(`/usage/household/${householdId}/range`, { params: { from, to } })
      .then((r) => r.data),
  logReading: (payload: UsageLogPayload) =>
    axiosClient.post<ApiResponse<WaterUsageLog>>('/usage', payload).then((r) => r.data),
  uploadCsv: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosClient
      .post<ApiResponse<CsvUploadResult>>('/usage/upload-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
  delete: (id: number) => axiosClient.delete<ApiResponse<void>>(`/usage/${id}`).then((r) => r.data),
};
