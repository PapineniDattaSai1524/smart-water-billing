package com.smartwater.billing.dto.resident;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignableResidentResponse {
    private Long id;
    private String fullName;
    private String email;
    private String username;
}
