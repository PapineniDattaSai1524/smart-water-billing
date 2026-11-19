package com.smartwater.billing.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "invoices", uniqueConstraints = @UniqueConstraint(columnNames = {"household_id", "billing_month"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "invoices_gen")
    @SequenceGenerator(name = "invoices_gen", sequenceName = "invoices_id_seq", allocationSize = 1)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "household_id", nullable = false)
    private Household household;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tariff_plan_id")
    private TariffPlan tariffPlan;

    /** Format: YYYY-MM */
    @Column(name = "billing_month", nullable = false, length = 7)
    private String billingMonth;

    @Column(name = "consumption_kl", nullable = false, precision = 10, scale = 2)
    private BigDecimal consumptionKl;

    @Column(name = "rate_per_kl", nullable = false, precision = 10, scale = 2)
    private BigDecimal ratePerKl;

    @Column(name = "fixed_charge", nullable = false, precision = 10, scale = 2)
    private BigDecimal fixedCharge;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    /** Consumption charge only, before fixed charge / shared charge / tax. Null for pre-V9 invoices. */
    @Column(name = "base_charge", precision = 15, scale = 2)
    private BigDecimal baseCharge;

    @Builder.Default
    @Column(name = "tax_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    /** JSON-serialized {@link com.smartwater.billing.dto.billing.BillingBreakdownResponse} for full auditability. */
    @Column(name = "breakdown_json", columnDefinition = "TEXT")
    private String breakdownJson;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "billing_cycle_id")
    private BillingCycle billingCycle;

    /** True once the owning billing cycle has been finalized — the bill is now immutable. */
    @Builder.Default
    @Column(nullable = false)
    private boolean finalized = false;

    @Column(name = "finalized_at")
    private LocalDateTime finalizedAt;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false, length = 20)
    private InvoiceStatus status = InvoiceStatus.UNPAID;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "generated_at", nullable = false, updatable = false)
    private LocalDateTime generatedAt;

    @PrePersist
    void onCreate() {
        if (generatedAt == null) {
            generatedAt = LocalDateTime.now();
        }
    }
}
