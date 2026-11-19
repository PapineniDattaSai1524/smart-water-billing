package com.smartwater.billing.dto.auth;

import com.smartwater.billing.entity.Role;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "Full name is required")
    @Size(max = 120, message = "Full name must not exceed 120 characters")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be a valid email address")
    private String email;

    @NotBlank(message = "Username is required")
    @Size(min = 4, max = 60, message = "Username must be between 4 and 60 characters")
    @Pattern(regexp = "^[a-zA-Z0-9._-]+$", message = "Username may only contain letters, digits, dot, underscore, and hyphen")
    private String username;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100, message = "Password must be at least 8 characters")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#^()_+=-]).+$",
        message = "Password must contain an uppercase letter, a lowercase letter, a digit, and a special character"
    )
    private String password;

    @Pattern(regexp = "^[0-9]{10}$", message = "Phone number must be a 10-digit number")
    private String phoneNumber;

    @NotNull(message = "Role is required")
    private Role role;

    /**
     * Required only when {@link #role} is RESIDENT (enforced in AuthService, not here,
     * since ADMIN registration must not require it). Must match an existing, unclaimed
     * household's globally unique {@code household_code} -- see
     * {@link com.smartwater.billing.entity.Household#getHouseholdCode()}.
     */
    @Size(max = 60, message = "Household ID is too long")
    private String householdId;
}
