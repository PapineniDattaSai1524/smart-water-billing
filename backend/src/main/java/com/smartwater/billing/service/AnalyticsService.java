package com.smartwater.billing.service;

import com.smartwater.billing.dto.analytics.MonthlyValue;
import com.smartwater.billing.dto.analytics.RevenueAnalyticsResponse;
import com.smartwater.billing.dto.analytics.TopConsumerResponse;
import com.smartwater.billing.dto.analytics.WaterAnalyticsResponse;
import com.smartwater.billing.repository.HouseholdRepository;
import com.smartwater.billing.repository.InvoiceRepository;
import com.smartwater.billing.repository.WaterUsageLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.YearMonth;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final InvoiceRepository invoiceRepository;
    private final WaterUsageLogRepository waterUsageLogRepository;
    private final HouseholdRepository householdRepository;

    @Transactional(readOnly = true)
    public RevenueAnalyticsResponse getRevenueAnalytics(Long adminId) {
        List<MonthlyValue> monthly = invoiceRepository.monthlyRevenueForAdmin(adminId).stream()
                .map(row -> MonthlyValue.builder()
                        .month((String) row[0])
                        .value(((Number) row[1]).doubleValue())
                        .build())
                .toList();

        return RevenueAnalyticsResponse.builder()
                .totalCollected(invoiceRepository.sumPaidRevenueForAdmin(adminId))
                .totalOutstanding(invoiceRepository.sumOutstandingForAdmin(adminId))
                .monthlyRevenue(monthly)
                .build();
    }

    @Transactional(readOnly = true)
    public WaterAnalyticsResponse getWaterAnalytics(Long adminId) {
        List<com.smartwater.billing.entity.WaterUsageLog> logs =
                waterUsageLogRepository.findAllForAdminOrderByReadingDateAsc(adminId);

        java.util.LinkedHashMap<String, Double> byMonth = new java.util.LinkedHashMap<>();
        for (com.smartwater.billing.entity.WaterUsageLog log : logs) {
            String month = YearMonth.from(log.getReadingDate()).toString();
            byMonth.merge(month, log.getConsumptionKl(), Double::sum);
        }

        YearMonth currentMonth = YearMonth.now();

        // Last 6 *actual* calendar months of data, most recent first in byMonth's natural
        // (chronological) order -- never zero-filled placeholder months. If the database only
        // has 3 real months of readings, exactly 3 points are returned, not 6.
        List<MonthlyValue> monthly = byMonth.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .skip(Math.max(0, byMonth.size() - 6))
                .map(e -> MonthlyValue.builder().month(e.getKey()).value(Math.round(e.getValue() * 100) / 100.0).build())
                .toList();

        List<Object[]> top = waterUsageLogRepository.topConsumersForAdmin(
                adminId, currentMonth.atDay(1), currentMonth.atEndOfMonth());

        // Full household roster across every apartment this admin owns -- this, not the usage-log
        // query above, is the source of truth for "which households exist". A household with no
        // reading logged yet for the current month must still appear (at 0 kL) in the comparison.
        List<com.smartwater.billing.entity.Household> allHouseholds =
                householdRepository.findByApartmentAdminIdOrderByUnitNumberAsc(adminId);

        Map<Long, String> unitByHouseholdId = allHouseholds.stream()
                .collect(java.util.stream.Collectors.toMap(
                        com.smartwater.billing.entity.Household::getId,
                        com.smartwater.billing.entity.Household::getUnitNumber,
                        (a, b) -> a));

        List<TopConsumerResponse> topConsumers = top.stream()
                .limit(10)
                .map(row -> TopConsumerResponse.builder()
                        .unitNumber(unitByHouseholdId.getOrDefault((Long) row[0], "Unit #" + row[0]))
                        .consumptionKl(((Number) row[1]).doubleValue())
                        .build())
                .toList();

        Map<Long, Double> currentMonthConsumptionByHouseholdId = top.stream()
                .collect(java.util.stream.Collectors.toMap(
                        row -> (Long) row[0],
                        row -> ((Number) row[1]).doubleValue()));

        List<TopConsumerResponse> householdUsage = allHouseholds.stream()
                .map(h -> TopConsumerResponse.builder()
                        .unitNumber(h.getUnitNumber())
                        .consumptionKl(Math.round(
                                currentMonthConsumptionByHouseholdId.getOrDefault(h.getId(), 0.0) * 100) / 100.0)
                        .build())
                .toList();

        double allTimeTotal = byMonth.values().stream().mapToDouble(Double::doubleValue).sum();
        double currentMonthTotal = byMonth.getOrDefault(currentMonth.toString(), 0.0);
        double previousMonthTotal = byMonth.getOrDefault(currentMonth.minusMonths(1).toString(), 0.0);

        return WaterAnalyticsResponse.builder()
                .totalConsumptionKl(Math.round(allTimeTotal * 100) / 100.0)
                .currentMonthConsumptionKl(Math.round(currentMonthTotal * 100) / 100.0)
                .previousMonthConsumptionKl(Math.round(previousMonthTotal * 100) / 100.0)
                .monthlyConsumption(monthly)
                .topConsumers(topConsumers)
                .householdUsage(householdUsage)
                .build();
    }
}
