import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { platformService } from '@/services/platformService';
import type { Role } from '@/utils/types';

export function usePlatformAnalytics() {
  return useQuery({
    queryKey: ['platform-analytics'],
    queryFn: () => platformService.analytics().then((r) => r.data),
  });
}

export function usePlatformRevenueAnalytics() {
  return useQuery({
    queryKey: ['platform-revenue-analytics'],
    queryFn: () => platformService.revenue().then((r) => r.data),
  });
}

export function usePlatformWaterAnalytics() {
  return useQuery({
    queryKey: ['platform-water-analytics'],
    queryFn: () => platformService.water().then((r) => r.data),
  });
}

export function useSystemHealth() {
  return useQuery({
    queryKey: ['system-health'],
    queryFn: () => platformService.systemHealth().then((r) => r.data),
    refetchInterval: 30_000,
  });
}

export function usePlatformUsers(role?: Role) {
  return useQuery({
    queryKey: ['platform-users', role ?? 'ALL'],
    queryFn: () => platformService.listUsers(role).then((r) => r.data),
  });
}

export function useSetUserEnabled() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) =>
      enabled ? platformService.enableUser(id) : platformService.disableUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform-users'] }),
  });
}

export function useChangeUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: number; role: Role }) => platformService.changeRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform-users'] }),
  });
}

export function useBroadcastNotification() {
  return useMutation({
    mutationFn: (payload: { title: string; message: string; targetRole?: Role }) =>
      platformService.broadcast(payload),
  });
}

export function useRunAlertCheckNow() {
  return useMutation({
    mutationFn: () => platformService.runAlertCheckNow(),
  });
}
