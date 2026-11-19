import axiosClient from '@/api/axiosClient';
import type { ApiResponse, MeterStatus, MeterType, WaterMeterConfig } from '@/utils/types';

export interface MeterConfigPayload {
  householdId: number;
  meterNumber: string;
  meterType: MeterType;
  installationDate: string;
  initialReading: number;
  status: MeterStatus;
}

export const meterService = {
  getAll: () => axiosClient.get<ApiResponse<WaterMeterConfig[]>>('/meter-configs').then((r) => r.data),
  getByHousehold: (householdId: number) =>
    axiosClient.get<ApiResponse<WaterMeterConfig>>(`/meter-configs/household/${householdId}`).then((r) => r.data),
  configure: (payload: MeterConfigPayload) =>
    axiosClient.post<ApiResponse<WaterMeterConfig>>('/meter-configs', payload).then((r) => r.data),
  update: (id: number, payload: MeterConfigPayload) =>
    axiosClient.put<ApiResponse<WaterMeterConfig>>(`/meter-configs/${id}`, payload).then((r) => r.data),
  delete: (id: number) => axiosClient.delete<ApiResponse<void>>(`/meter-configs/${id}`).then((r) => r.data),
};
