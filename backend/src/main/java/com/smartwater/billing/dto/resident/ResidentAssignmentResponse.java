package com.smartwater.billing.dto.resident;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResidentAssignmentResponse {
    private Long id;
    private Long householdId;
    private String unitNumber;
    private Long userId;
    private String userFullName;
    private String userEmail;
    private String relationType;
    private LocalDate moveInDate;
    private LocalDate moveOutDate;
    private boolean active;
}
