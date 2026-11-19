import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { auditLogService, communityService } from '@/services/communityService';

export function useCommunities() {
  return useQuery({
    queryKey: ['communities'],
    queryFn: () => communityService.list().then((r) => r.data),
  });
}

export function useSuspendCommunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => communityService.suspend(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['communities'] }),
  });
}

export function useActivateCommunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => communityService.activate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['communities'] }),
  });
}

export function useAuditLogs(page = 0, size = 20) {
  return useQuery({
    queryKey: ['audit-logs', page, size],
    queryFn: () => auditLogService.list(page, size).then((r) => r.data),
  });
}
