import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  billingService, type GenerateInvoicesPayload, type TariffPlanPayload,
} from '@/services/billingService';
import type { InvoiceStatus } from '@/utils/types';

export function useTariffPlans() {
  return useQuery({
    queryKey: ['tariff-plans'],
    queryFn: () => billingService.listTariffPlans().then((r) => r.data),
  });
}

export function useCreateTariffPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TariffPlanPayload) => billingService.createTariffPlan(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tariff-plans'] }),
  });
}

export function useInvoices(params: { status?: InvoiceStatus; billingMonth?: string; page?: number; size?: number }) {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: () => billingService.listInvoices(params).then((r) => r.data),
  });
}

export function useGenerateInvoices() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: GenerateInvoicesPayload) => billingService.generateInvoices(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['revenue-summary'] });
    },
  });
}

export function useMarkInvoicePaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => billingService.markPaid(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['revenue-summary'] });
    },
  });
}

export function useRevenueSummary() {
  return useQuery({
    queryKey: ['revenue-summary'],
    queryFn: () => billingService.revenueSummary().then((r) => r.data),
  });
}

export function useMyInvoices() {
  return useQuery({
    queryKey: ['my-invoices'],
    queryFn: () => billingService.myInvoices().then((r) => r.data),
  });
}
