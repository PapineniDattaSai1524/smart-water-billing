package com.smartwater.billing.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.springframework.beans.BeanWrapper;
import org.springframework.beans.PropertyAccessorFactory;

import java.time.LocalDate;

public class DateRangeValidator implements ConstraintValidator<ValidDateRange, Object> {

    private String startField;
    private String endField;

    @Override
    public void initialize(ValidDateRange constraintAnnotation) {
        this.startField = constraintAnnotation.startField();
        this.endField = constraintAnnotation.endField();
    }

    @Override
    public boolean isValid(Object value, ConstraintValidatorContext context) {
        if (value == null) {
            return true;
        }
        BeanWrapper wrapper = PropertyAccessorFactory.forBeanPropertyAccess(value);
        Object startValue = wrapper.getPropertyValue(startField);
        Object endValue = wrapper.getPropertyValue(endField);

        if (!(startValue instanceof LocalDate) || endValue == null) {
            // end date is optional (ongoing residency); nothing to validate if absent
            return true;
        }
        if (!(endValue instanceof LocalDate)) {
            return true;
        }

        LocalDate start = (LocalDate) startValue;
        LocalDate end = (LocalDate) endValue;
        return !end.isBefore(start);
    }
}
