import axiosClient from '@/api/axiosClient';
import type {
  ApiResponse, Invoice, InvoiceStatus, PageResponse, RevenueSummary, TariffPlan, TariffTier,
} from '@/utils/types';

export interface TariffPlanPayload {
  apartmentId: number;
  name: string;
  ratePerKl: number;
  fixedCharge: number;
  taxPercentage?: number;
  minimumCharge?: number | null;
  maximumCharge?: number | null;
  /** Optional tiered bands (e.g. 0-10 / 11-20 / 20+ KL). Leave empty for a flat rate. */
  tiers?: TariffTier[];
}

export interface GenerateInvoicesPayload {
  apartmentId: number;
  billingMonth: string; // YYYY-MM
}

export const billingService = {
  listTariffPlans: () => axiosClient.get<ApiResponse<TariffPlan[]>>('/admin/billing/tariff-plans').then((r) => r.data),

  createTariffPlan: (payload: TariffPlanPayload) =>
    axiosClient.post<ApiResponse<TariffPlan>>('/admin/billing/tariff-plans', payload).then((r) => r.data),

  generateInvoices: (payload: GenerateInvoicesPayload) =>
    axiosClient.post<ApiResponse<Invoice[]>>('/admin/billing/invoices/generate', payload).then((r) => r.data),

  listInvoices: (params: { status?: InvoiceStatus; billingMonth?: string; page?: number; size?: number }) =>
    axiosClient
      .get<ApiResponse<PageResponse<Invoice>>>('/admin/billing/invoices', { params })
      .then((r) => r.data),

  markPaid: (id: number) =>
    axiosClient.put<ApiResponse<Invoice>>(`/admin/billing/invoices/${id}/mark-paid`).then((r) => r.data),

  revenueSummary: () =>
    axiosClient.get<ApiResponse<RevenueSummary>>('/admin/billing/revenue-summary').then((r) => r.data),

  myInvoices: () => axiosClient.get<ApiResponse<Invoice[]>>('/residents/me/invoices').then((r) => r.data),
};
