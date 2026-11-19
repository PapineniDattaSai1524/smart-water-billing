import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { billingCycleService, type OpenCyclePayload } from '@/services/billingCycleService';

export function useBillingCycles(params: { apartmentId?: number; status?: string; page?: number; size?: number }) {
  return useQuery({
    queryKey: ['billing-cycles', params],
    queryFn: () => billingCycleService.search(params).then((r) => r.data),
  });
}

export function useOpenBillingCycle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: OpenCyclePayload) => billingCycleService.open(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['billing-cycles'] }),
  });
}

export function useCloseBillingCycle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => billingCycleService.close(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['billing-cycles'] }),
  });
}

export function useFinalizeBillingCycle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => billingCycleService.finalize(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['billing-cycles'] }),
  });
}

export function useArchiveBillingCycle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => billingCycleService.archive(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['billing-cycles'] }),
  });
}

export function useReopenBillingCycle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => billingCycleService.reopen(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['billing-cycles'] }),
  });
}
