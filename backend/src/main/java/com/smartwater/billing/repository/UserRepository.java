package com.smartwater.billing.repository;

import com.smartwater.billing.entity.RegistrationStatus;
import com.smartwater.billing.entity.Role;
import com.smartwater.billing.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    Optional<User> findByUsernameOrEmail(String username, String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    /**
     * Case-insensitive email lookup/existence checks used by every account-creation flow
     * (public self-registration, community/admin registration requests, admin-created
     * residents) so that e.g. "User@Gmail.com" and "user@gmail.com" are treated as the
     * same account and can never both be registered.
     */
    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    List<User> findByRole(Role role);

    /** Self-registered residents awaiting Building Owner approval, oldest first. */
    List<User> findByRoleAndRegistrationStatusOrderByCreatedAtAsc(Role role, RegistrationStatus registrationStatus);

    /** Approved, enabled residents -- the pool available to pick from in the Assign Resident dropdown. */
    List<User> findByRoleAndEnabledTrueOrderByFullNameAsc(Role role);

    /**
     * Residents managed by a given Apartment Administrator, i.e. residents
     * with an active assignment to a household in one of the admin's
     * apartments. Optional search (name/email/resident code), apartment,
     * and enabled-status filters.
     */
    @Query("""
            SELECT DISTINCT u FROM User u
            JOIN ResidentAssignment ra ON ra.user = u AND ra.active = true
            JOIN ra.household h
            JOIN h.apartment a
            WHERE a.admin.id = :adminId
              AND u.role = com.smartwater.billing.entity.Role.RESIDENT
              AND (:apartmentId IS NULL OR a.id = :apartmentId)
              AND (:enabled IS NULL OR u.enabled = :enabled)
              AND (:search IS NULL
                   OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(u.residentCode) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<User> searchResidentsForAdmin(
            @Param("adminId") Long adminId,
            @Param("apartmentId") Long apartmentId,
            @Param("enabled") Boolean enabled,
            @Param("search") String search,
            Pageable pageable);

    @Query("""
            SELECT COUNT(DISTINCT u) FROM User u
            JOIN ResidentAssignment ra ON ra.user = u AND ra.active = true
            JOIN ra.household h
            JOIN h.apartment a
            WHERE a.admin.id = :adminId AND u.role = com.smartwater.billing.entity.Role.RESIDENT
            """)
    long countResidentsForAdmin(@Param("adminId") Long adminId);

    /**
     * Every enabled resident belonging to any apartment/building managed by this
     * Building Owner -- the exact, real recipient set for the Building Owner's
     * "send notification to my residents" feature. Deliberately mirrors the
     * ownership scoping in {@link #searchResidentsForAdmin} / {@link #countResidentsForAdmin}
     * so the notification recipient boundary can never drift from the boundary
     * already enforced for resident management.
     */
    @Query("""
            SELECT DISTINCT u FROM User u
            JOIN ResidentAssignment ra ON ra.user = u AND ra.active = true
            JOIN ra.household h
            JOIN h.apartment a
            WHERE a.admin.id = :adminId
              AND u.role = com.smartwater.billing.entity.Role.RESIDENT
              AND u.enabled = true
            ORDER BY u.fullName ASC
            """)
    List<User> findActiveResidentsForAdmin(@Param("adminId") Long adminId);
}
