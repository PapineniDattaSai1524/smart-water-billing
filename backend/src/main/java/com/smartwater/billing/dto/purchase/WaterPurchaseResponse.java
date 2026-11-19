package com.smartwater.billing.dto.purchase;

import com.smartwater.billing.entity.WaterSourceType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WaterPurchaseResponse {
    private Long id;
    private Long apartmentId;
    private String apartmentName;
    private WaterSourceType sourceType;
    private String vendorName;
    private BigDecimal quantityKl;
    private BigDecimal cost;
    private BigDecimal costPerKl;
    private LocalDate purchaseDate;
    private String invoiceReference;
    private String notes;
    private boolean distributed;
    private LocalDateTime distributedAt;
    private LocalDateTime createdAt;
}
