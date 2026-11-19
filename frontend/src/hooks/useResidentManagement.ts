import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  residentManagementService, type ApproveResidentPayload, type ResidentCreatePayload,
  type ResidentListParams, type ResidentUpdatePayload,
} from '@/services/residentManagementService';

export function usePendingResidents() {
  return useQuery({
    queryKey: ['resident-management', 'pending'],
    queryFn: () => residentManagementService.listPending().then((r) => r.data),
  });
}

export function useAssignableResidents() {
  return useQuery({
    queryKey: ['resident-management', 'assignable'],
    queryFn: () => residentManagementService.listAssignable().then((r) => r.data),
  });
}

export function useResidentList(params: ResidentListParams) {
  return useQuery({
    queryKey: ['resident-management', params],
    queryFn: () => residentManagementService.list(params).then((r) => r.data),
  });
}

function useInvalidateResidents() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['resident-management'] });
    queryClient.invalidateQueries({ queryKey: ['residents'] });
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    // Adding/enabling/disabling a resident changes a household's residentCount, which the
    // Add Resident household dropdown uses to mark a household "Already Assigned" -- keep
    // it in sync so a freshly-assigned household is correctly shown as unavailable.
    queryClient.invalidateQueries({ queryKey: ['households'] });
  };
}

export function useApproveResident() {
  const invalidate = useInvalidateResidents();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ApproveResidentPayload }) =>
      residentManagementService.approve(id, payload),
    onSuccess: invalidate,
  });
}

export function useRejectResident() {
  const invalidate = useInvalidateResidents();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      residentManagementService.reject(id, reason),
    onSuccess: invalidate,
  });
}

export function useCreateResident() {
  const invalidate = useInvalidateResidents();
  return useMutation({
    mutationFn: (payload: ResidentCreatePayload) => residentManagementService.create(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateResident() {
  const invalidate = useInvalidateResidents();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ResidentUpdatePayload }) =>
      residentManagementService.update(id, payload),
    onSuccess: invalidate,
  });
}

export function useSetResidentEnabled() {
  const invalidate = useInvalidateResidents();
  return useMutation({
    mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) =>
      enabled ? residentManagementService.enable(id) : residentManagementService.disable(id),
    onSuccess: invalidate,
  });
}

export function useResetResidentPassword() {
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: number; newPassword: string }) =>
      residentManagementService.resetPassword(id, newPassword),
  });
}

export function useDeleteResident() {
  const invalidate = useInvalidateResidents();
  return useMutation({
    mutationFn: (id: number) => residentManagementService.remove(id),
    onSuccess: invalidate,
  });
}
