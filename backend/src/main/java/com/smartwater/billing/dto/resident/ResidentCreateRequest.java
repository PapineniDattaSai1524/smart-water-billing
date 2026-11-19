package com.smartwater.billing.dto.resident;

import com.smartwater.billing.entity.Gender;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResidentCreateRequest {

    @NotNull(message = "Household is required")
    private Long householdId;

    @NotBlank(message = "Full name is required")
    @Size(max = 120)
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Enter a valid email")
    private String email;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[0-9]{10}$", message = "Phone number must be a 10-digit number")
    private String phoneNumber;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100, message = "Password must be at least 8 characters")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#^()_+=-]).+$",
        message = "Password must contain an uppercase letter, a lowercase letter, a digit, and a special character"
    )
    private String password;

    private Gender gender;

    private LocalDate dateOfBirth;

    @Pattern(regexp = "^[0-9]{10}$", message = "Enter a valid 10-digit emergency contact number")
    private String emergencyContact;

    @Size(max = 100)
    private String occupation;

    @Min(value = 0, message = "Family members cannot be negative")
    private Integer familyMembers;

    /** Optional: set via the profile photo upload endpoint before submitting this form. */
    private String profilePhotoUrl;

    private boolean enabled = true;
}
