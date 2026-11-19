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
public class ResidentUpdateRequest {

    @NotBlank(message = "Full name is required")
    @Size(max = 120)
    private String fullName;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[0-9]{10}$", message = "Phone number must be a 10-digit number")
    private String phoneNumber;

    private Gender gender;

    private LocalDate dateOfBirth;

    @Pattern(regexp = "^[0-9]{10}$", message = "Enter a valid 10-digit emergency contact number")
    private String emergencyContact;

    @Size(max = 100)
    private String occupation;

    @Min(value = 0, message = "Family members cannot be negative")
    private Integer familyMembers;

    private String profilePhotoUrl;
}
