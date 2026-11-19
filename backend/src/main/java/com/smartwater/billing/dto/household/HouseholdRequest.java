package com.smartwater.billing.dto.household;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class HouseholdRequest {

    @NotNull(message = "Apartment id is required")
    private Long apartmentId;

    @NotBlank(message = "Unit number is required")
    @Size(max = 30)
    private String unitNumber;

    @NotNull(message = "Area (sqft) is required")
    @Positive(message = "Area must be a positive number")
    private Double areaSqft;

    @NotNull(message = "Occupancy count is required")
    @Min(value = 1, message = "Occupancy count must be at least 1")
    private Integer occupancyCount;

    private boolean hasMeter = true;
}
