import axiosClient from '@/api/axiosClient';
import type { ApiResponse, RelationType, ResidentAssignment } from '@/utils/types';

export interface ResidentAssignmentPayload {
  householdId: number;
  userId: number;
  relationType: RelationType;
  moveInDate: string;
  moveOutDate?: string | null;
}

export const residentService = {
  getByHousehold: (householdId: number) =>
    axiosClient.get<ApiResponse<ResidentAssignment[]>>(`/resident-assignments/household/${householdId}`).then((r) => r.data),
  getByUser: (userId: number) =>
    axiosClient.get<ApiResponse<ResidentAssignment[]>>(`/resident-assignments/user/${userId}`).then((r) => r.data),
  assign: (payload: ResidentAssignmentPayload) =>
    axiosClient.post<ApiResponse<ResidentAssignment>>('/resident-assignments', payload).then((r) => r.data),
  update: (id: number, payload: ResidentAssignmentPayload) =>
    axiosClient.put<ApiResponse<ResidentAssignment>>(`/resident-assignments/${id}`, payload).then((r) => r.data),
  deactivate: (id: number) =>
    axiosClient.patch<ApiResponse<void>>(`/resident-assignments/${id}/deactivate`).then((r) => r.data),
  delete: (id: number) =>
    axiosClient.delete<ApiResponse<void>>(`/resident-assignments/${id}`).then((r) => r.data),
};
