package com.smartwater.billing.dto.cycle;

import com.smartwater.billing.entity.CycleStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillingCycleResponse {
    private Long id;
    private Long apartmentId;
    private String apartmentName;
    private String billingMonth;
    private CycleStatus status;
    private String openedByAdminName;
    private LocalDateTime openedAt;
    private LocalDateTime closedAt;
    private LocalDateTime finalizedAt;
    private LocalDateTime archivedAt;
    private LocalDateTime reopenedAt;
    private int recalculationCount;
    private int invoiceCount;
    private String notes;
}
