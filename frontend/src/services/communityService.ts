import axiosClient from '@/api/axiosClient';
import type { ApiResponse, AuditLogEntry, CommunityRow, PageResponse } from '@/utils/types';

export const communityService = {
  list: () => axiosClient.get<ApiResponse<CommunityRow[]>>('/super-admin/communities').then((r) => r.data),
  suspend: (id: number) =>
    axiosClient.put<ApiResponse<CommunityRow>>(`/super-admin/communities/${id}/suspend`).then((r) => r.data),
  activate: (id: number) =>
    axiosClient.put<ApiResponse<CommunityRow>>(`/super-admin/communities/${id}/activate`).then((r) => r.data),
};

export const auditLogService = {
  list: (page = 0, size = 20) =>
    axiosClient
      .get<ApiResponse<PageResponse<AuditLogEntry>>>('/super-admin/audit-logs', { params: { page, size } })
      .then((r) => r.data),
};
