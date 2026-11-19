package com.smartwater.billing.dto.useradmin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformUserResponse {
    private Long id;
    private String fullName;
    private String email;
    private String username;
    private String role;
    private boolean enabled;
    private String createdAt;
}
