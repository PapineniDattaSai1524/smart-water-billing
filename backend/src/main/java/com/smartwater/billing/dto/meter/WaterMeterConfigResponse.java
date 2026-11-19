package com.smartwater.billing.dto.meter;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WaterMeterConfigResponse {
    private Long id;
    private Long householdId;
    private String unitNumber;
    private String meterNumber;
    private String meterType;
    private LocalDate installationDate;
    private Double initialReading;
    private String status;
}
