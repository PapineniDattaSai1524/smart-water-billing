package com.smartwater.billing.dto.resident;

import com.smartwater.billing.entity.RelationType;
import com.smartwater.billing.validation.ValidDateRange;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ValidDateRange(startField = "moveInDate", endField = "moveOutDate",
        message = "Move-out date cannot be earlier than move-in date")
public class ResidentAssignmentRequest {

    @NotNull(message = "Household id is required")
    private Long householdId;

    @NotNull(message = "User id is required")
    private Long userId;

    @NotNull(message = "Relation type is required")
    private RelationType relationType;

    @NotNull(message = "Move-in date is required")
    private LocalDate moveInDate;

    private LocalDate moveOutDate;
}
