import axiosClient from '@/api/axiosClient';
import type { ApiResponse, AssignableResident, PageResponse, PendingResident, RelationType, Resident } from '@/utils/types';

export interface ApproveResidentPayload {
  householdId: number;
  relationType: RelationType;
}

export interface ResidentCreatePayload {
  householdId: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  gender?: string;
  dateOfBirth?: string;
  emergencyContact?: string;
  occupation?: string;
  familyMembers?: number;
  profilePhotoUrl?: string;
  enabled?: boolean;
}

export interface ResidentUpdatePayload {
  fullName: string;
  phoneNumber: string;
  gender?: string;
  dateOfBirth?: string;
  emergencyContact?: string;
  occupation?: string;
  familyMembers?: number;
  profilePhotoUrl?: string;
}

export interface ResidentListParams {
  search?: string;
  apartmentId?: number;
  enabled?: boolean;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'ASC' | 'DESC';
}

export const residentManagementService = {
  listPending: () =>
    axiosClient.get<ApiResponse<PendingResident[]>>('/admin/residents/pending').then((r) => r.data),

  listAssignable: () =>
    axiosClient.get<ApiResponse<AssignableResident[]>>('/admin/residents/assignable').then((r) => r.data),

  approve: (id: number, payload: ApproveResidentPayload) =>
    axiosClient.post<ApiResponse<Resident>>(`/admin/residents/${id}/approve`, payload).then((r) => r.data),

  reject: (id: number, reason: string) =>
    axiosClient.post<ApiResponse<void>>(`/admin/residents/${id}/reject`, { reason }).then((r) => r.data),

  list: (params: ResidentListParams) =>
    axiosClient.get<ApiResponse<PageResponse<Resident>>>('/admin/residents', { params }).then((r) => r.data),

  getById: (id: number) =>
    axiosClient.get<ApiResponse<Resident>>(`/admin/residents/${id}`).then((r) => r.data),

  create: (payload: ResidentCreatePayload) =>
    axiosClient.post<ApiResponse<Resident>>('/admin/residents', payload).then((r) => r.data),

  update: (id: number, payload: ResidentUpdatePayload) =>
    axiosClient.put<ApiResponse<Resident>>(`/admin/residents/${id}`, payload).then((r) => r.data),

  enable: (id: number) =>
    axiosClient.put<ApiResponse<Resident>>(`/admin/residents/${id}/enable`).then((r) => r.data),

  disable: (id: number) =>
    axiosClient.put<ApiResponse<Resident>>(`/admin/residents/${id}/disable`).then((r) => r.data),

  resetPassword: (id: number, newPassword: string) =>
    axiosClient.put<ApiResponse<void>>(`/admin/residents/${id}/reset-password`, { newPassword }).then((r) => r.data),

  remove: (id: number) => axiosClient.delete<ApiResponse<void>>(`/admin/residents/${id}`).then((r) => r.data),
};

export const fileUploadService = {
  uploadPhoto: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosClient
      .post<ApiResponse<{ url: string }>>('/files/photo-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
};
