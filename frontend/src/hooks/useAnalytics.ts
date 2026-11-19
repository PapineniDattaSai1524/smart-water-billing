import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analyticsService';

export function useAdminRevenueAnalytics() {
  return useQuery({
    queryKey: ['admin-revenue-analytics'],
    queryFn: () => analyticsService.revenue().then((r) => r.data),
  });
}

export function useAdminWaterAnalytics() {
  return useQuery({
    queryKey: ['admin-water-analytics'],
    queryFn: () => analyticsService.water().then((r) => r.data),
  });
}
