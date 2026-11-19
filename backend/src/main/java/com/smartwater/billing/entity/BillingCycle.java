package com.smartwater.billing.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * The monthly billing lifecycle for one apartment: OPEN (invoices can be
 * generated/recalculated) -> CLOSED (locked for review) -> FINALIZED
 * (immutable, ready to send) -> ARCHIVED (historical). REOPEN moves CLOSED
 * or FINALIZED back to OPEN; ARCHIVED is terminal.
 */
@Entity
@Table(name = "billing_cycles",
        uniqueConstraints = @UniqueConstraint(columnNames = {"apartment_id", "billing_month"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BillingCycle extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "billing_cycles_gen")
    @SequenceGenerator(name = "billing_cycles_gen", sequenceName = "billing_cycles_id_seq", allocationSize = 1)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "apartment_id", nullable = false)
    private Apartment apartment;

    /** YYYY-MM, matches {@link Invoice#getBillingMonth()}. */
    @Column(name = "billing_month", nullable = false, length = 7)
    private String billingMonth;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CycleStatus status = CycleStatus.OPEN;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "opened_by_admin_id")
    private User openedByAdmin;

    @Column(name = "opened_at")
    private LocalDateTime openedAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(name = "finalized_at")
    private LocalDateTime finalizedAt;

    @Column(name = "archived_at")
    private LocalDateTime archivedAt;

    @Column(name = "reopened_at")
    private LocalDateTime reopenedAt;

    @Builder.Default
    @Column(name = "recalculation_count", nullable = false)
    private Integer recalculationCount = 0;

    @Column(length = 500)
    private String notes;
}
