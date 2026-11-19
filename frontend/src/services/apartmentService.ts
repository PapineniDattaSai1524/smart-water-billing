import axiosClient from '@/api/axiosClient';
import type { ApiResponse, Apartment } from '@/utils/types';

export interface ApartmentPayload {
  name: string;
  addressLine: string;
  city: string;
  state: string;
  zipCode: string;
  totalUnits: number;
  adminId?: number;
}

export const apartmentService = {
  getAll: () => axiosClient.get<ApiResponse<Apartment[]>>('/apartments').then((r) => r.data),
  getById: (id: number) => axiosClient.get<ApiResponse<Apartment>>(`/apartments/${id}`).then((r) => r.data),
  create: (payload: ApartmentPayload) =>
    axiosClient.post<ApiResponse<Apartment>>('/apartments', payload).then((r) => r.data),
  update: (id: number, payload: ApartmentPayload) =>
    axiosClient.put<ApiResponse<Apartment>>(`/apartments/${id}`, payload).then((r) => r.data),
  delete: (id: number) => axiosClient.delete<ApiResponse<void>>(`/apartments/${id}`).then((r) => r.data),
};
