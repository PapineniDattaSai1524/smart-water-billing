import axiosClient from '@/api/axiosClient';
import type { ApiResponse, BillingCycle, CyclePaymentStatus, PageResponse } from '@/utils/types';

export interface OpenCyclePayload {
  apartmentId: number;
  billingMonth: string; // YYYY-MM
  notes?: string;
}

// Week 5-6 Feature 2C: billing cycle lifecycle controls. Reuses the existing Week 3-4
// BillingCycleController (open/close/finalize/archive/reopen) -- no new backend logic.
export const billingCycleService = {
  search: (params: { apartmentId?: number; status?: string; page?: number; size?: number }) =>
    axiosClient
      .get<ApiResponse<PageResponse<BillingCycle>>>('/admin/billing-cycles', { params })
      .then((r) => r.data),

  open: (payload: OpenCyclePayload) =>
    axiosClient.post<ApiResponse<BillingCycle>>('/admin/billing-cycles/open', payload).then((r) => r.data),

  close: (id: number) =>
    axiosClient.post<ApiResponse<BillingCycle>>(`/admin/billing-cycles/${id}/close`).then((r) => r.data),

  finalize: (id: number) =>
    axiosClient.post<ApiResponse<BillingCycle>>(`/admin/billing-cycles/${id}/finalize`).then((r) => r.data),

  archive: (id: number) =>
    axiosClient.post<ApiResponse<BillingCycle>>(`/admin/billing-cycles/${id}/archive`).then((r) => r.data),

  reopen: (id: number, reason?: string) =>
    axiosClient
      .post<ApiResponse<BillingCycle>>(`/admin/billing-cycles/${id}/reopen`, reason ? { reason } : undefined)
      .then((r) => r.data),

  paymentStatus: (id: number) =>
    axiosClient.get<ApiResponse<CyclePaymentStatus>>(`/admin/billing-cycles/${id}/payment-status`).then((r) => r.data),
};
