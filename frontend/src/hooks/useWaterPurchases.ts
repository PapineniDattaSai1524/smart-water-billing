import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { waterPurchaseService, type WaterPurchasePayload } from '@/services/waterPurchaseService';
import type { WaterSourceType } from '@/utils/types';

export function useWaterPurchases(params: {
  apartmentId?: number; sourceType?: WaterSourceType; fromDate?: string; toDate?: string;
  search?: string; page?: number; size?: number;
}) {
  return useQuery({
    queryKey: ['water-purchases', params],
    queryFn: () => waterPurchaseService.search(params).then((r) => r.data),
  });
}

export function useWaterPurchaseSummary() {
  return useQuery({
    queryKey: ['water-purchase-summary'],
    queryFn: () => waterPurchaseService.summary().then((r) => r.data),
  });
}

export function useCreateWaterPurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: WaterPurchasePayload) => waterPurchaseService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['water-purchases'] });
      queryClient.invalidateQueries({ queryKey: ['water-purchase-summary'] });
    },
  });
}

export function useUpdateWaterPurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: WaterPurchasePayload }) =>
      waterPurchaseService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['water-purchases'] });
      queryClient.invalidateQueries({ queryKey: ['water-purchase-summary'] });
    },
  });
}

export function useDeleteWaterPurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => waterPurchaseService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['water-purchases'] });
      queryClient.invalidateQueries({ queryKey: ['water-purchase-summary'] });
    },
  });
}
