import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { registrationService } from '@/services/registrationService';
import type { RegistrationStatus } from '@/utils/types';

export function useRegistrationRequests(status?: RegistrationStatus) {
  return useQuery({
    queryKey: ['registration-requests', status ?? 'ALL'],
    queryFn: () => registrationService.list(status).then((r) => r.data),
  });
}

export function useApproveRegistrationRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => registrationService.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registration-requests'] });
      queryClient.invalidateQueries({ queryKey: ['super-admin-dashboard'] });
    },
  });
}

export function useRejectRegistrationRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => registrationService.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registration-requests'] });
      queryClient.invalidateQueries({ queryKey: ['super-admin-dashboard'] });
    },
  });
}

export function useSuperAdminDashboard() {
  return useQuery({
    queryKey: ['super-admin-dashboard'],
    queryFn: () => registrationService.getDashboardStats().then((r) => r.data),
  });
}
