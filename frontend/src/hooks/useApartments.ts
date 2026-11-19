import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apartmentService, type ApartmentPayload } from '@/services/apartmentService';

export function useApartments() {
  return useQuery({
    queryKey: ['apartments'],
    queryFn: () => apartmentService.getAll().then((r) => r.data),
  });
}

export function useApartment(id: number | undefined) {
  return useQuery({
    queryKey: ['apartments', id],
    queryFn: () => apartmentService.getById(id as number).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateApartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ApartmentPayload) => apartmentService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['apartments'] }),
  });
}

export function useUpdateApartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ApartmentPayload }) =>
      apartmentService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['apartments'] }),
  });
}

export function useDeleteApartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apartmentService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['apartments'] }),
  });
}
