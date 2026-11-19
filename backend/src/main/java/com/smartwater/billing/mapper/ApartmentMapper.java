package com.smartwater.billing.mapper;

import com.smartwater.billing.dto.apartment.ApartmentResponse;
import com.smartwater.billing.entity.Apartment;
import org.springframework.stereotype.Component;

@Component
public class ApartmentMapper {

    public ApartmentResponse toResponse(Apartment apartment) {
        return ApartmentResponse.builder()
                .id(apartment.getId())
                .name(apartment.getName())
                .addressLine(apartment.getAddressLine())
                .city(apartment.getCity())
                .state(apartment.getState())
                .zipCode(apartment.getZipCode())
                .totalUnits(apartment.getTotalUnits())
                .adminId(apartment.getAdmin() != null ? apartment.getAdmin().getId() : null)
                .adminName(apartment.getAdmin() != null ? apartment.getAdmin().getFullName() : null)
                .householdCount(apartment.getHouseholds() != null ? apartment.getHouseholds().size() : 0)
                .createdAt(apartment.getCreatedAt())
                .updatedAt(apartment.getUpdatedAt())
                .build();
    }
}
