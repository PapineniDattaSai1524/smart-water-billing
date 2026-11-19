import axiosClient from '@/api/axiosClient';
import type { ApiResponse, Household } from '@/utils/types';

export interface HouseholdPayload {
  apartmentId: number;
  unitNumber: string;
  areaSqft: number;
  occupancyCount: number;
  hasMeter: boolean;
}

export const householdService = {
  getAll: () => axiosClient.get<ApiResponse<Household[]>>('/households').then((r) => r.data),
  /** Households across every apartment/building the current admin owns -- use this (not getAll)
   *  for Building Owner screens like Water Usage, so households from other buildings never leak in. */
  getMine: () => axiosClient.get<ApiResponse<Household[]>>('/households/mine').then((r) => r.data),
  getById: (id: number) => axiosClient.get<ApiResponse<Household>>(`/households/${id}`).then((r) => r.data),
  getByApartment: (apartmentId: number) =>
    axiosClient.get<ApiResponse<Household[]>>(`/households/apartment/${apartmentId}`).then((r) => r.data),
  create: (payload: HouseholdPayload) =>
    axiosClient.post<ApiResponse<Household>>('/households', payload).then((r) => r.data),
  update: (id: number, payload: HouseholdPayload) =>
    axiosClient.put<ApiResponse<Household>>(`/households/${id}`, payload).then((r) => r.data),
  delete: (id: number) => axiosClient.delete<ApiResponse<void>>(`/households/${id}`).then((r) => r.data),
};
