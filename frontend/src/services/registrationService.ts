import axiosClient from '@/api/axiosClient';
import type {
  ApiResponse, RegistrationRequest, RegistrationStatus, SuperAdminDashboardStats,
} from '@/utils/types';

export interface RegistrationSubmitPayload {
  communityName: string;
  apartmentName: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  adminFullName: string;
  adminEmail: string;
  adminPhoneNumber: string;
  password: string;
  confirmPassword: string;
}

export const registrationService = {
  submit: (payload: RegistrationSubmitPayload) =>
    axiosClient.post<ApiResponse<RegistrationRequest>>('/registration-requests', payload).then((r) => r.data),

  list: (status?: RegistrationStatus) =>
    axiosClient
      .get<ApiResponse<RegistrationRequest[]>>('/registration-requests', { params: status ? { status } : {} })
      .then((r) => r.data),

  getById: (id: number) =>
    axiosClient.get<ApiResponse<RegistrationRequest>>(`/registration-requests/${id}`).then((r) => r.data),

  approve: (id: number) =>
    axiosClient.post<ApiResponse<RegistrationRequest>>(`/registration-requests/${id}/approve`).then((r) => r.data),

  reject: (id: number, reason: string) =>
    axiosClient
      .post<ApiResponse<RegistrationRequest>>(`/registration-requests/${id}/reject`, { reason })
      .then((r) => r.data),

  getDashboardStats: () =>
    axiosClient.get<ApiResponse<SuperAdminDashboardStats>>('/super-admin/dashboard').then((r) => r.data),
};
