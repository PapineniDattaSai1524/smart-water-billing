package com.smartwater.billing.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;

/**
 * A prospective community's onboarding submission. Created publicly via the
 * registration page; reviewed by a Super Admin who either approves it
 * (spinning up a {@link Community}, {@link Apartment}, and ADMIN {@link User})
 * or rejects it.
 */
@Entity
@Table(name = "registration_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistrationRequest extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "registration_requests_gen")
    @SequenceGenerator(name = "registration_requests_gen", sequenceName = "registration_requests_id_seq", allocationSize = 1)
    private Long id;

    @NotBlank
    @Column(name = "community_name", nullable = false, length = 150)
    private String communityName;

    @NotBlank
    @Column(name = "apartment_name", nullable = false, length = 150)
    private String apartmentName;

    @NotBlank
    @Column(name = "address_line", nullable = false, length = 255)
    private String addressLine;

    @NotBlank
    @Column(nullable = false, length = 100)
    private String city;

    @NotBlank
    @Column(nullable = false, length = 100)
    private String state;

    @NotBlank
    @Column(nullable = false, length = 20)
    private String pincode;

    @NotBlank
    @Column(name = "admin_full_name", nullable = false, length = 120)
    private String adminFullName;

    @NotBlank
    @Column(name = "admin_email", nullable = false, length = 150)
    private String adminEmail;

    @NotBlank
    @Column(name = "admin_phone_number", nullable = false, length = 20)
    private String adminPhoneNumber;

    /** Already BCrypt-hashed at submission time; never stored in plain text. */
    @NotBlank
    @Column(name = "admin_password_hash", nullable = false)
    private String adminPasswordHash;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false, length = 20)
    private RegistrationStatus status = RegistrationStatus.PENDING;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_community_id")
    private Community createdCommunity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_apartment_id")
    private Apartment createdApartment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_admin_user_id")
    private User createdAdminUser;
}
