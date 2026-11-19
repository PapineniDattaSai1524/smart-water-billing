package com.smartwater.billing.service;

import com.smartwater.billing.dto.dashboard.AdminDashboardResponse;
import com.smartwater.billing.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.YearMonth;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final ApartmentRepository apartmentRepository;
    private final HouseholdRepository householdRepository;
    private final UserRepository userRepository;
    private final WaterMeterConfigRepository waterMeterConfigRepository;
    private final WaterUsageLogRepository waterUsageLogRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public AdminDashboardResponse getStats(Long adminId) {
        YearMonth currentMonth = YearMonth.now();
        YearMonth previousMonth = currentMonth.minusMonths(1);

        double currentConsumption = safeSum(waterUsageLogRepository.sumConsumptionForAdminBetween(
                adminId, currentMonth.atDay(1), currentMonth.atEndOfMonth()));
        double previousConsumption = safeSum(waterUsageLogRepository.sumConsumptionForAdminBetween(
                adminId, previousMonth.atDay(1), previousMonth.atEndOfMonth()));

        return AdminDashboardResponse.builder()
                .totalApartments(apartmentRepository.countByAdminId(adminId))
                .totalHouseholds(householdRepository.countByApartmentAdminId(adminId))
                .totalResidents(userRepository.countResidentsForAdmin(adminId))
                .activeMeters(waterMeterConfigRepository.countActiveByAdminId(adminId))
                .currentMonthConsumptionKl(currentConsumption)
                .previousMonthConsumptionKl(previousConsumption)
                .unreadNotifications(notificationService.unreadCount(adminId))
                .build();
    }

    private double safeSum(Double value) {
        return value != null ? value : 0.0;
    }
}
