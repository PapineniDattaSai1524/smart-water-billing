package com.smartwater.billing.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "users_gen")
    @SequenceGenerator(name = "users_gen", sequenceName = "users_id_seq", allocationSize = 1)
    private Long id;

    @NotBlank
    @Column(name = "full_name", nullable = false, length = 120)
    private String fullName;

    @Email
    @NotBlank
    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @NotBlank
    @Column(nullable = false, unique = true, length = 60)
    private String username;

    @NotBlank
    @Column(nullable = false)
    private String password;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Builder.Default
    @Column(nullable = false)
    private boolean enabled = true;

    @Column(name = "profile_photo_url", length = 500)
    private String profilePhotoUrl;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private Gender gender;

    @Column(name = "date_of_birth")
    private java.time.LocalDate dateOfBirth;

    @Column(name = "emergency_contact", length = 20)
    private String emergencyContact;

    @Column(length = 100)
    private String occupation;

    @Column(name = "family_members")
    private Integer familyMembers;

    /** Human-friendly resident identifier (e.g. RES-000123), assigned only to RESIDENT users. */
    @Column(name = "resident_code", length = 30)
    private String residentCode;

    /**
     * Approval state of this account. ADMIN/SUPER_ADMIN accounts and RESIDENT accounts
     * created directly by a Building Owner are APPROVED by default. A RESIDENT who
     * self-registers via the public /auth/register page starts out PENDING (and
     * {@code enabled=false}) until a Building Owner approves or rejects the request
     * from the Resident Management screen.
     */
    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "registration_status", nullable = false, length = 20)
    private RegistrationStatus registrationStatus = RegistrationStatus.APPROVED;

    /** Reason supplied by the Building Owner when rejecting a pending resident registration. */
    @Column(name = "resident_rejection_reason", length = 500)
    private String rejectionReason;
}
