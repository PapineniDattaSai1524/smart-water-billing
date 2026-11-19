package com.smartwater.billing.dto.resident;

import com.smartwater.billing.entity.RelationType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ApproveResidentRequest {

    @NotNull(message = "Household id is required")
    private Long householdId;

    @NotNull(message = "Relation type is required")
    private RelationType relationType;
}
