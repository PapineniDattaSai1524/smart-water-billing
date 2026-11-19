package com.smartwater.billing.entity;

public enum CycleStatus {
    /** Invoices for this month can be generated/recalculated. */
    OPEN,
    /** Invoices are locked in for review; no further recalculation without reopening. */
    CLOSED,
    /** Bills are final and immutable — ready to send to residents. */
    FINALIZED,
    /** Historical, read-only. Terminal state. */
    ARCHIVED
}
