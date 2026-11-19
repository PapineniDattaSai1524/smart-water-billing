package com.smartwater.billing.entity;

public enum AllocationBasis {
    /** Household has a meter and a reading for the period — billed on actual consumption. */
    METERED,
    /** Household has no reading this period, but a metered-peer density estimate was available. */
    AREA_ESTIMATED,
    /** No metered data exists anywhere in the apartment for the period — pure area-proportional split. */
    AREA_FALLBACK
}
