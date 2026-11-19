package com.smartwater.billing.dto.apartment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApartmentResponse {
    private Long id;
    private String name;
    private String addressLine;
    private String city;
    private String state;
    private String zipCode;
    private Integer totalUnits;
    private Long adminId;
    private String adminName;
    private int householdCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
