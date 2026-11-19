package com.smartwater.billing.dto.household;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HouseholdResponse {
    private Long id;
    private Long apartmentId;
    private String apartmentName;
    private String unitNumber;
    /** Globally unique id the Building Owner shares with a resident so they can self-register
     *  and be linked to this exact household automatically. See AuthService#register. */
    private String householdCode;
    private Double areaSqft;
    private Integer occupancyCount;
    private boolean hasMeter;
    private boolean meterConfigured;
    private int residentCount;
    /** Full name of the household's active PRIMARY resident (falls back to any other active
     *  resident if no PRIMARY is set, or null if the household currently has nobody assigned).
     *  Used by staff-facing exports (e.g. the Water Usage Excel template) that need a human
     *  label alongside the household id -- never populated with placeholder/demo data. */
    private String residentName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
