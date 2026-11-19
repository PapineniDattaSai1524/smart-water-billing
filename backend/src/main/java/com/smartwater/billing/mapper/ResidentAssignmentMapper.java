package com.smartwater.billing.mapper;

import com.smartwater.billing.dto.resident.ResidentAssignmentResponse;
import com.smartwater.billing.entity.ResidentAssignment;
import org.springframework.stereotype.Component;

@Component
public class ResidentAssignmentMapper {

    public ResidentAssignmentResponse toResponse(ResidentAssignment assignment) {
        return ResidentAssignmentResponse.builder()
                .id(assignment.getId())
                .householdId(assignment.getHousehold().getId())
                .unitNumber(assignment.getHousehold().getUnitNumber())
                .userId(assignment.getUser().getId())
                .userFullName(assignment.getUser().getFullName())
                .userEmail(assignment.getUser().getEmail())
                .relationType(assignment.getRelationType().name())
                .moveInDate(assignment.getMoveInDate())
                .moveOutDate(assignment.getMoveOutDate())
                .active(assignment.isActive())
                .build();
    }
}
