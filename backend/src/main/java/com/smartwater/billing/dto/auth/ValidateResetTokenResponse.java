package com.smartwater.billing.dto.auth;

import com.smartwater.billing.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ValidateResetTokenResponse {

    private boolean valid;

    /** So the frontend can send the user back to the correct login portal after a successful reset. */
    private Role role;
}
