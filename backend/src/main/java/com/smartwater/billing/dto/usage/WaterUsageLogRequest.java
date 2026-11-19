package com.smartwater.billing.dto.usage;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
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
public class WaterUsageLogRequest {

    @NotNull(message = "Household id is required")
    private Long householdId;

    @NotNull(message = "Reading date is required")
    @PastOrPresent(message = "Reading date cannot be in the future")
    private LocalDate readingDate;

    @NotNull(message = "Meter reading is required")
    @PositiveOrZero(message = "Meter reading cannot be negative")
    private Double meterReadingKl;

    private String remarks;
}
