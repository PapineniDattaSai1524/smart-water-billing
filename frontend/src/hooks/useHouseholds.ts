import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { householdService, type HouseholdPayload } from '@/services/householdService';

export function useHouseholds() {
  return useQuery({
    queryKey: ['households'],
    queryFn: () => householdService.getAll().then((r) => r.data),
  });
}

/** Households across every building the current admin owns -- for Building Owner dashboards. */
export function useMyHouseholds() {
  return useQuery({
    queryKey: ['households', 'mine'],
    queryFn: () => householdService.getMine().then((r) => r.data),
  });
}

export function useHouseholdsByApartment(apartmentId: number | undefined) {
  return useQuery({
    queryKey: ['households', 'apartment', apartmentId],
    queryFn: () => householdService.getByApartment(apartmentId as number).then((r) => r.data),
    enabled: !!apartmentId,
  });
}

export function useHousehold(id: number | undefined) {
  return useQuery({
    queryKey: ['households', id],
    queryFn: () => householdService.getById(id as number).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateHousehold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: HouseholdPayload) => householdService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['households'] }),
  });
}

export function useUpdateHousehold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: HouseholdPayload }) =>
      householdService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['households'] }),
  });
}

export function useDeleteHousehold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => householdService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['households'] }),
  });
}
