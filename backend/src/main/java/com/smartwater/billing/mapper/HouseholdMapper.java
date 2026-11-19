package com.smartwater.billing.mapper;

import com.smartwater.billing.dto.household.HouseholdResponse;
import com.smartwater.billing.entity.Household;
import com.smartwater.billing.entity.RelationType;
import com.smartwater.billing.entity.ResidentAssignment;
import org.springframework.stereotype.Component;

@Component
public class HouseholdMapper {

    public HouseholdResponse toResponse(Household household) {
        return HouseholdResponse.builder()
                .id(household.getId())
                .apartmentId(household.getApartment().getId())
                .apartmentName(household.getApartment().getName())
                .unitNumber(household.getUnitNumber())
                .householdCode(household.getHouseholdCode())
                .areaSqft(household.getAreaSqft())
                .occupancyCount(household.getOccupancyCount())
                .hasMeter(household.isHasMeter())
                .meterConfigured(household.getMeterConfig() != null)
                .residentCount(household.getResidentAssignments() != null
                        ? (int) household.getResidentAssignments().stream().filter(r -> r.isActive()).count()
                        : 0)
                .residentName(primaryResidentName(household))
                .createdAt(household.getCreatedAt())
                .updatedAt(household.getUpdatedAt())
                .build();
    }

    // Prefers the active PRIMARY resident; falls back to any other active resident so a
    // household with only MEMBER assignments (no PRIMARY set yet) still surfaces a name.
    // Returns null -- never a placeholder string -- when nobody is currently assigned.
    private String primaryResidentName(Household household) {
        if (household.getResidentAssignments() == null) {
            return null;
        }
        return household.getResidentAssignments().stream()
                .filter(ResidentAssignment::isActive)
                .filter(a -> a.getRelationType() == RelationType.PRIMARY)
                .findFirst()
                .or(() -> household.getResidentAssignments().stream()
                        .filter(ResidentAssignment::isActive)
                        .findFirst())
                .map(a -> a.getUser().getFullName())
                .orElse(null);
    }
}

