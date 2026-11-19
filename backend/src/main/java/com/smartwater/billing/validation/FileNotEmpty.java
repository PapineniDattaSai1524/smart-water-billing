package com.smartwater.billing.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

/**
 * Ensures an uploaded MultipartFile (e.g. CSV usage upload) is present and non-empty.
 */
@Documented
@Constraint(validatedBy = FileNotEmptyValidator.class)
@Target({ElementType.PARAMETER, ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
public @interface FileNotEmpty {
    String message() default "Uploaded file must not be empty";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
