import axiosClient from '@/api/axiosClient';
import type { AlertThresholdConfig, AlertThresholdConfigPayload, ApiResponse } from '@/utils/types';

/** Admin: get/update the alert threshold override for an apartment they manage. */
export const alertConfigService = {
  get: (apartmentId: number) =>
    axiosClient.get<ApiResponse<AlertThresholdConfig>>(`/apartments/${apartmentId}/alert-config`).then((r) => r.data),

  update: (apartmentId: number, payload: AlertThresholdConfigPayload) =>
    axiosClient
      .put<ApiResponse<AlertThresholdConfig>>(`/apartments/${apartmentId}/alert-config`, payload)
      .then((r) => r.data),
};
