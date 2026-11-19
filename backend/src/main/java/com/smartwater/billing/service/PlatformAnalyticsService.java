package com.smartwater.billing.service;

import com.smartwater.billing.dto.analytics.MonthlyValue;
import com.smartwater.billing.dto.analytics.RevenueAnalyticsResponse;
import com.smartwater.billing.dto.analytics.WaterAnalyticsResponse;
import com.smartwater.billing.dto.platform.PlatformAnalyticsResponse;
import com.smartwater.billing.entity.Role;
import com.smartwater.billing.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PlatformAnalyticsService {

    private final CommunityRepository communityRepository;
    private final ApartmentRepository apartmentRepository;
    private final HouseholdRepository householdRepository;
    private final UserRepository userRepository;
    private final InvoiceRepository invoiceRepository;
    private final WaterUsageLogRepository waterUsageLogRepository;

    @Transactional(readOnly = true)
    public PlatformAnalyticsResponse getPlatformAnalytics() {
        return PlatformAnalyticsResponse.builder()
                .totalCommunities(communityRepository.count())
                .totalApartments(apartmentRepository.count())
                .totalHouseholds(householdRepository.count())
                .totalAdministrators(userRepository.findByRole(Role.ADMIN).size())
                .totalResidents(userRepository.findByRole(Role.RESIDENT).size())
                .totalRevenueCollected(invoiceRepository.sumPaidRevenueGlobal())
                .totalOutstanding(invoiceRepository.sumOutstandingGlobal())
                .totalWaterConsumptionKl(waterUsageLogRepository.sumConsumptionGlobal() == null
                        ? 0 : waterUsageLogRepository.sumConsumptionGlobal())
                .build();
    }

    @Transactional(readOnly = true)
    public RevenueAnalyticsResponse getRevenueAnalytics() {
        List<MonthlyValue> monthly = invoiceRepository.monthlyRevenueGlobal().stream()
                .map(row -> MonthlyValue.builder()
                        .month((String) row[0])
                        .value(((Number) row[1]).doubleValue())
                        .build())
                .toList();

        return RevenueAnalyticsResponse.builder()
                .totalCollected(invoiceRepository.sumPaidRevenueGlobal())
                .totalOutstanding(invoiceRepository.sumOutstandingGlobal())
                .monthlyRevenue(monthly)
                .build();
    }

    @Transactional(readOnly = true)
    public WaterAnalyticsResponse getWaterAnalytics() {
        java.util.List<com.smartwater.billing.entity.WaterUsageLog> logs =
                waterUsageLogRepository.findAllOrderByReadingDateAsc();

        java.util.LinkedHashMap<String, Double> byMonth = new java.util.LinkedHashMap<>();
        for (com.smartwater.billing.entity.WaterUsageLog log : logs) {
            String month = java.time.YearMonth.from(log.getReadingDate()).toString();
            byMonth.merge(month, log.getConsumptionKl(), Double::sum);
        }

        java.time.YearMonth currentMonth = java.time.YearMonth.now();

        // Last 6 *actual* calendar months of data -- never zero-filled placeholder months.
        List<MonthlyValue> monthly = byMonth.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .skip(Math.max(0, byMonth.size() - 6))
                .map(e -> MonthlyValue.builder().month(e.getKey()).value(Math.round(e.getValue() * 100) / 100.0).build())
                .toList();

        Double total = waterUsageLogRepository.sumConsumptionGlobal();
        double currentMonthTotal = byMonth.getOrDefault(currentMonth.toString(), 0.0);
        double previousMonthTotal = byMonth.getOrDefault(currentMonth.minusMonths(1).toString(), 0.0);

        return WaterAnalyticsResponse.builder()
                .totalConsumptionKl(total == null ? 0 : Math.round(total * 100) / 100.0)
                .currentMonthConsumptionKl(Math.round(currentMonthTotal * 100) / 100.0)
                .previousMonthConsumptionKl(Math.round(previousMonthTotal * 100) / 100.0)
                .monthlyConsumption(monthly)
                .topConsumers(List.of())
                .build();
    }
}
