package com.smartwater.billing.dto.auth;

import com.smartwater.billing.entity.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ForgotPasswordRequest {

    @NotBlank(message = "Username or email is required")
    private String usernameOrEmail;

    /**
     * The portal/role the user picked on the login screen. Required so the reset
     * flow only ever touches the account for that role -- e.g. if the same
     * person somehow knew a Resident's username, selecting the Building Owner
     * portal must never let them reset the Resident's password.
     */
    @NotNull(message = "Role is required")
    private Role role;
}
