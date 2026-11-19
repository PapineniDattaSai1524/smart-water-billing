import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentService, type PaymentPayload } from '@/services/paymentService';

export function useMyPayments() {
  return useQuery({
    queryKey: ['my-payments'],
    queryFn: () => paymentService.myPayments().then((r) => r.data),
  });
}

export function usePayInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, payload }: { invoiceId: number; payload: PaymentPayload }) =>
      paymentService.payInvoice(invoiceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['my-payments'] });
    },
  });
}

export function useAdminPayments() {
  return useQuery({
    queryKey: ['admin-payments'],
    queryFn: () => paymentService.adminPayments().then((r) => r.data),
  });
}

export function useCollectPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, payload }: { invoiceId: number; payload: PaymentPayload }) =>
      paymentService.collectPayment(invoiceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      queryClient.invalidateQueries({ queryKey: ['revenue-summary'] });
    },
  });
}
