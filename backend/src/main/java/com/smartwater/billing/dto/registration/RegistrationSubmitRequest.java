package com.smartwater.billing.dto.registration;

import com.smartwater.billing.validation.FieldsMatch;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@FieldsMatch(field = "password", confirmField = "confirmPassword", message = "Password and confirm password must match")
public class RegistrationSubmitRequest {

    @NotBlank(message = "Community name is required")
    @Size(max = 150)
    private String communityName;

    @NotBlank(message = "Apartment name is required")
    @Size(max = 150)
    private String apartmentName;

    @NotBlank(message = "Apartment address is required")
    @Size(max = 255)
    private String addressLine;

    @NotBlank(message = "City is required")
    @Size(max = 100)
    private String city;

    @NotBlank(message = "State is required")
    @Size(max = 100)
    private String state;

    @NotBlank(message = "Pincode is required")
    @Pattern(regexp = "^[0-9]{4,10}$", message = "Enter a valid pincode")
    private String pincode;

    @NotBlank(message = "Administrator name is required")
    @Size(max = 120)
    private String adminFullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Enter a valid email address")
    private String adminEmail;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[0-9]{10}$", message = "Phone number must be a 10-digit number")
    private String adminPhoneNumber;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100, message = "Password must be at least 8 characters")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#^()_+=-]).+$",
        message = "Password must contain an uppercase letter, a lowercase letter, a digit, and a special character"
    )
    private String password;

    @NotBlank(message = "Please confirm your password")
    private String confirmPassword;
}
