package com.smartwater.billing.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResidentDashboardResponse {
    /** ACTIVE (normal dashboard below is populated), PENDING_APPROVAL, REJECTED, or UNASSIGNED. */
    @Builder.Default
    private String status = "ACTIVE";
    /** Human-readable explanation, set whenever status != ACTIVE. */
    private String message;

    private String apartmentName;
    private String unitNumber;
    private Double currentMonthUsageKl;
    private Double previousMonthUsageKl;
    private Double averageUsageKl;
    private Double latestReadingKl;
    private LocalDate latestReadingDate;
    private long unreadNotifications;
}
