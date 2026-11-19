import axiosClient from '@/api/axiosClient';
import type {
  ApiResponse, ConsumptionComparison, Household, ResidentDashboardStats, UsageTrendPoint, WaterUsageLog,
} from '@/utils/types';

export const residentSelfService = {
  getDashboard: () =>
    axiosClient.get<ApiResponse<ResidentDashboardStats>>('/residents/me/dashboard').then((r) => r.data),

  getMyHousehold: () => axiosClient.get<ApiResponse<Household>>('/residents/me/household').then((r) => r.data),

  getMyUsageHistory: () =>
    axiosClient.get<ApiResponse<WaterUsageLog[]>>('/residents/me/usage-history').then((r) => r.data),

  // Week 5-6 Feature 1: dashboard trend charts
  getDailyTrend: (days = 30) =>
    axiosClient.get<ApiResponse<UsageTrendPoint[]>>('/residents/me/usage-trend/daily', { params: { days } })
      .then((r) => r.data),

  getMonthlyTrend: (months = 6) =>
    axiosClient.get<ApiResponse<UsageTrendPoint[]>>('/residents/me/usage-trend/monthly', { params: { months } })
      .then((r) => r.data),

  // Week 5-6 Feature 4: peer benchmarking
  getConsumptionComparison: () =>
    axiosClient.get<ApiResponse<ConsumptionComparison>>('/residents/me/consumption-comparison').then((r) => r.data),
};
