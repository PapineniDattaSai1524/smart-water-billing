import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { meterService, type MeterConfigPayload } from '@/services/meterService';

export function useMeterConfigs() {
  return useQuery({
    queryKey: ['meter-configs'],
    queryFn: () => meterService.getAll().then((r) => r.data),
  });
}

export function useMeterConfigByHousehold(householdId: number | undefined) {
  return useQuery({
    queryKey: ['meter-configs', 'household', householdId],
    queryFn: () => meterService.getByHousehold(householdId as number).then((r) => r.data),
    enabled: !!householdId,
    retry: false,
  });
}

export function useConfigureMeter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MeterConfigPayload) => meterService.configure(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meter-configs'] });
      queryClient.invalidateQueries({ queryKey: ['households'] });
    },
  });
}

export function useDeleteMeterConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => meterService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meter-configs'] });
      queryClient.invalidateQueries({ queryKey: ['households'] });
    },
  });
}
