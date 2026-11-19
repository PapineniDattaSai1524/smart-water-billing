import axiosClient from '@/api/axiosClient';
import type { ApiResponse, PageResponse, PurchaseSummary, WaterPurchase, WaterSourceType } from '@/utils/types';

export interface WaterPurchasePayload {
  apartmentId: number;
  sourceType: WaterSourceType;
  vendorName: string;
  quantityKl: number;
  cost: number;
  purchaseDate: string; // YYYY-MM-DD
  invoiceReference?: string;
  notes?: string;
}

// Week 5-6 Feature 2E: bulk water purchase entry. Reuses the existing Week 3-4
// WaterPurchaseController -- no duplicate purchase-tracking logic.
export const waterPurchaseService = {
  search: (params: {
    apartmentId?: number; sourceType?: WaterSourceType; fromDate?: string; toDate?: string;
    search?: string; page?: number; size?: number;
  }) =>
    axiosClient
      .get<ApiResponse<PageResponse<WaterPurchase>>>('/admin/water-purchases', { params })
      .then((r) => r.data),

  create: (payload: WaterPurchasePayload) =>
    axiosClient.post<ApiResponse<WaterPurchase>>('/admin/water-purchases', payload).then((r) => r.data),

  update: (id: number, payload: WaterPurchasePayload) =>
    axiosClient.put<ApiResponse<WaterPurchase>>(`/admin/water-purchases/${id}`, payload).then((r) => r.data),

  delete: (id: number) =>
    axiosClient.delete<ApiResponse<void>>(`/admin/water-purchases/${id}`).then((r) => r.data),

  summary: () =>
    axiosClient.get<ApiResponse<PurchaseSummary>>('/admin/water-purchases/summary').then((r) => r.data),
};
