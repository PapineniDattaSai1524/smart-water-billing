package com.smartwater.billing.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Response for the public, debounced "checking availability..." lookup on the Resident
 * registration form (GET /api/v1/auth/household-lookup). Deliberately minimal -- just
 * enough for the form to show a confirming "Unit A-101, Green Valley Residency" or the
 * matching error copy -- never anything else about the household or its residents.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HouseholdLookupResponse {

    public enum Status {
        AVAILABLE,
        ALREADY_REGISTERED,
        NOT_FOUND
    }

    private Status status;
    private String apartmentName;
    private String unitNumber;
}
