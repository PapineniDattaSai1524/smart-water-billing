package com.smartwater.billing.dto.meter;

import com.smartwater.billing.entity.MeterStatus;
import com.smartwater.billing.entity.MeterType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WaterMeterConfigRequest {

    @NotNull(message = "Household id is required")
    private Long householdId;

    @NotBlank(message = "Meter number is required")
    private String meterNumber;

    @NotNull(message = "Meter type is required")
    private MeterType meterType;

    @NotNull(message = "Installation date is required")
    private LocalDate installationDate;

    @PositiveOrZero(message = "Initial reading cannot be negative")
    private Double initialReading = 0.0;

    private MeterStatus status = MeterStatus.ACTIVE;
}
