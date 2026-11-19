package com.smartwater.billing.dto.purchase;

import com.smartwater.billing.entity.WaterSourceType;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WaterPurchaseRequest {

    @NotNull(message = "Apartment is required")
    private Long apartmentId;

    @NotNull(message = "Source type is required (TANKER or MUNICIPAL)")
    private WaterSourceType sourceType;

    @NotBlank(message = "Vendor name is required")
    @Size(max = 150)
    private String vendorName;

    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Quantity must be greater than zero")
    private BigDecimal quantityKl;

    @NotNull(message = "Cost is required")
    @DecimalMin(value = "0.0", message = "Cost cannot be negative")
    private BigDecimal cost;

    @NotNull(message = "Purchase date is required")
    @PastOrPresent(message = "Purchase date cannot be in the future")
    private LocalDate purchaseDate;

    @Size(max = 100)
    private String invoiceReference;

    @Size(max = 500)
    private String notes;
}
