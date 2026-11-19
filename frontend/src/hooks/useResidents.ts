import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { residentService, type ResidentAssignmentPayload } from '@/services/residentService';

export function useResidentsByHousehold(householdId: number | undefined) {
  return useQuery({
    queryKey: ['residents', 'household', householdId],
    queryFn: () => residentService.getByHousehold(householdId as number).then((r) => r.data),
    enabled: !!householdId,
  });
}

export function useAssignResident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ResidentAssignmentPayload) => residentService.assign(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['residents'] }),
  });
}

export function useDeactivateResident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => residentService.deactivate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['residents'] }),
  });
}

export function useDeleteResidentAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => residentService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['residents'] }),
  });
}
