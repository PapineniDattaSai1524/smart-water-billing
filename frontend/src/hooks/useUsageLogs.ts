import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usageService, type UsageLogPayload } from '@/services/usageService';

export function useUsageLogsByHousehold(householdId: number | undefined) {
  return useQuery({
    queryKey: ['usage-logs', 'household', householdId],
    queryFn: () => usageService.getByHousehold(householdId as number).then((r) => r.data),
    enabled: !!householdId,
  });
}

/** Building-wide recent readings across every household the current admin owns. */
export function useRecentUsageLogsForAdmin(limit = 50) {
  return useQuery({
    queryKey: ['usage-logs', 'admin-recent', limit],
    queryFn: () => usageService.getRecentForAdmin(limit).then((r) => r.data),
  });
}

export function useLogUsageReading() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UsageLogPayload) => usageService.logReading(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usage-logs'] }),
  });
}

export function useUploadUsageCsv() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => usageService.uploadCsv(file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usage-logs'] }),
  });
}

export function useDeleteUsageLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => usageService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usage-logs'] }),
  });
}
