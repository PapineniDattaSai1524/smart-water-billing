package com.smartwater.billing.entity;

/**
 * Application-wide user roles.
 * SUPER_ADMIN - platform owner (approves community registrations, oversees all tenants)
 * ADMIN       - community/apartment administrator (manages apartments, households, meters, tariffs)
 * RESIDENT    - household resident (views own profile and usage data)
 */
public enum Role {
    SUPER_ADMIN,
    ADMIN,
    RESIDENT
}
