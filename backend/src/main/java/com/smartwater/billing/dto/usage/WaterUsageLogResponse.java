package com.smartwater.billing.dto.usage;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WaterUsageLogResponse {
    private Long id;
    private Long householdId;
    private String unitNumber;
    private LocalDate readingDate;
    private Double meterReadingKl;
    private Double consumptionKl;
    private String source;
    private String recordedByName;
    private String remarks;
}
