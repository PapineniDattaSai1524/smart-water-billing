import axiosClient from '@/api/axiosClient';
import type { ApiResponse, PaymentMethod, PaymentRecord } from '@/utils/types';

export interface PaymentPayload {
  method: PaymentMethod;
  transactionRef?: string;
}

export const paymentService = {
  payInvoice: (invoiceId: number, payload: PaymentPayload) =>
    axiosClient.post<ApiResponse<PaymentRecord>>(`/residents/me/invoices/${invoiceId}/pay`, payload).then((r) => r.data),

  myPayments: () =>
    axiosClient.get<ApiResponse<PaymentRecord[]>>('/residents/me/payments').then((r) => r.data),

  collectPayment: (invoiceId: number, payload: PaymentPayload) =>
    axiosClient.post<ApiResponse<PaymentRecord>>(`/admin/invoices/${invoiceId}/collect`, payload).then((r) => r.data),

  adminPayments: () =>
    axiosClient.get<ApiResponse<PaymentRecord[]>>('/admin/payments').then((r) => r.data),
};
