package com.smartwater.billing.service;

import com.smartwater.billing.dto.common.PageResponse;
import com.smartwater.billing.dto.resident.AdminResetPasswordRequest;
import com.smartwater.billing.dto.resident.ApproveResidentRequest;
import com.smartwater.billing.dto.resident.AssignableResidentResponse;
import com.smartwater.billing.dto.resident.PendingResidentResponse;
import com.smartwater.billing.dto.resident.RejectResidentRequest;
import com.smartwater.billing.dto.resident.ResidentAssignmentRequest;
import com.smartwater.billing.dto.resident.ResidentCreateRequest;
import com.smartwater.billing.dto.resident.ResidentResponse;
import com.smartwater.billing.dto.resident.ResidentUpdateRequest;
import com.smartwater.billing.entity.*;
import com.smartwater.billing.exception.DuplicateResourceException;
import com.smartwater.billing.exception.InvalidRequestException;
import com.smartwater.billing.exception.ResourceNotFoundException;
import com.smartwater.billing.exception.UnauthorizedActionException;
import com.smartwater.billing.mapper.ResidentManagementMapper;
import com.smartwater.billing.repository.HouseholdRepository;
import com.smartwater.billing.repository.ResidentAssignmentRepository;
import com.smartwater.billing.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ResidentManagementService {

    private final UserRepository userRepository;
    private final HouseholdRepository householdRepository;
    private final ResidentAssignmentRepository residentAssignmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final ResidentManagementMapper mapper;
    private final NotificationService notificationService;
    // Reused (not duplicated) so approving a pending registration performs the exact
    // same household-assignment logic as the existing Resident Assignments screen.
    private final ResidentAssignmentService residentAssignmentService;

    @Transactional
    public ResidentResponse create(ResidentCreateRequest request, Long adminId) {
        Household household = householdRepository.findById(request.getHouseholdId())
                .orElseThrow(() -> ResourceNotFoundException.of("Household", request.getHouseholdId()));
        assertOwnedByAdmin(household, adminId);
        // Core business rule: within a single apartment, a household can have only one
        // resident assigned through this "Add Resident" flow. Checked BEFORE touching the
        // users table so a rejected request never creates an orphaned user account. This is
        // deliberately scoped to this admin-facing create flow only -- it does not affect the
        // separate Resident Assignments screen (ResidentAssignmentService), which intentionally
        // continues to allow multiple family MEMBER residents per household.
        assertHouseholdAvailable(household);

        // Case-insensitive, whitespace-trimmed check so this admin-facing "Add Resident"
        // flow can never end up with two accounts for the same email differing only in
        // case or surrounding whitespace.
        String normalizedEmail = normalizeEmail(request.getEmail());
        Optional<User> existing = userRepository.findByEmailIgnoreCase(normalizedEmail);
        if (existing.isPresent()) {
            User existingUser = existing.get();
            boolean alreadyHasHousehold = residentAssignmentRepository.findByUserId(existingUser.getId())
                    .stream().anyMatch(ResidentAssignment::isActive);

            if (existingUser.getRole() != Role.RESIDENT || alreadyHasHousehold) {
                // A genuine duplicate: either the email belongs to a non-resident account,
                // or this resident is already actively linked to a household elsewhere.
                throw new DuplicateResourceException("An account with this email already exists.");
            }

            // This is a resident who already self-registered via the public /auth/register
            // page (their account exists with its own username and password, but was never
            // linked to a household). Adopt the existing account into this household instead
            // of creating a duplicate: KEEP their original username and password hash so they
            // keep logging in with the password they chose at registration -- no reset needed.
            return linkExistingResidentToHousehold(existingUser, request, household, adminId);
        }

        String username = generateUniqueUsername(normalizedEmail);

        User resident = userRepository.save(User.builder()
                .fullName(request.getFullName())
                .email(normalizedEmail)
                .username(username)
                .password(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhoneNumber())
                .role(Role.RESIDENT)
                .enabled(request.isEnabled())
                .gender(request.getGender())
                .dateOfBirth(request.getDateOfBirth())
                .emergencyContact(request.getEmergencyContact())
                .occupation(request.getOccupation())
                .familyMembers(request.getFamilyMembers())
                .profilePhotoUrl(request.getProfilePhotoUrl())
                .build());

        resident.setResidentCode("RES-" + String.format("%06d", resident.getId()));
        resident = userRepository.save(resident);

        assignPrimaryOrMemberAndNotify(resident, household, adminId);

        return mapper.toResponse(resident, household);
    }

    /**
     * Links an existing, unassigned, self-registered RESIDENT account (created via the
     * public POST /api/v1/auth/register endpoint) to a household. The account's original
     * username and password hash are left untouched -- the resident keeps signing in with
     * the exact credentials they chose at registration; nothing here calls
     * passwordEncoder.encode(...) or resets any credential.
     */
    private ResidentResponse linkExistingResidentToHousehold(
            User resident, ResidentCreateRequest request, Household household, Long adminId) {

        resident.setFullName(request.getFullName());
        resident.setPhoneNumber(request.getPhoneNumber());
        resident.setEnabled(request.isEnabled());
        resident.setGender(request.getGender());
        resident.setDateOfBirth(request.getDateOfBirth());
        resident.setEmergencyContact(request.getEmergencyContact());
        resident.setOccupation(request.getOccupation());
        resident.setFamilyMembers(request.getFamilyMembers());
        if (request.getProfilePhotoUrl() != null) {
            resident.setProfilePhotoUrl(request.getProfilePhotoUrl());
        }
        if (resident.getResidentCode() == null) {
            resident.setResidentCode("RES-" + String.format("%06d", resident.getId()));
        }
        resident = userRepository.save(resident);

        assignPrimaryOrMemberAndNotify(resident, household, adminId);

        return mapper.toResponse(resident, household);
    }

    /**
     * Creates the (sole) resident assignment for this household. Always PRIMARY: the
     * household-availability check in {@link #create} already guarantees no active
     * assignment exists at this point, for this flow. The save is guarded against a
     * concurrent request winning the same race (two admins/tabs submitting the same
     * Apartment + Household at once, or the frontend being bypassed) via the DB-level
     * partial unique index added in V21 -- a violation of that index is translated into
     * the same 409 Conflict the app-level check produces, instead of a raw 500.
     */
    private void assignPrimaryOrMemberAndNotify(User resident, Household household, Long adminId) {
        try {
            residentAssignmentRepository.save(ResidentAssignment.builder()
                    .household(household)
                    .user(resident)
                    .relationType(RelationType.PRIMARY)
                    .moveInDate(LocalDate.now())
                    .active(true)
                    .build());
        } catch (DataIntegrityViolationException ex) {
            throw new DuplicateResourceException(
                    "Household " + household.getUnitNumber() + " is already assigned to another resident in Apartment "
                            + household.getApartment().getName() + ". Please select a different household.");
        }

        notificationService.notify(adminId, NotificationType.RESIDENT_ADDED,
                "New resident added",
                resident.getFullName() + " was added to " + household.getApartment().getName() + " - " + household.getUnitNumber());
    }

    /**
     * Enforces the core business rule: for the same apartment, the same household can be
     * assigned to only one resident via the "Add Resident" flow. Household is already
     * apartment-scoped (each row belongs to exactly one apartment), so checking the
     * household alone is equivalent to checking Apartment + Household ID together.
     */
    private void assertHouseholdAvailable(Household household) {
        if (!residentAssignmentRepository.findByHouseholdIdAndActiveTrue(household.getId()).isEmpty()) {
            throw new DuplicateResourceException(
                    "Household " + household.getUnitNumber() + " is already assigned to another resident in Apartment "
                            + household.getApartment().getName() + ". Please select a different household.");
        }
    }

    @Transactional
    public ResidentResponse update(Long residentId, ResidentUpdateRequest request, Long adminId) {
        User resident = findResidentOrThrow(residentId);
        Household household = assertAdminManagesResident(resident, adminId);

        resident.setFullName(request.getFullName());
        resident.setPhoneNumber(request.getPhoneNumber());
        resident.setGender(request.getGender());
        resident.setDateOfBirth(request.getDateOfBirth());
        resident.setEmergencyContact(request.getEmergencyContact());
        resident.setOccupation(request.getOccupation());
        resident.setFamilyMembers(request.getFamilyMembers());
        if (request.getProfilePhotoUrl() != null) {
            resident.setProfilePhotoUrl(request.getProfilePhotoUrl());
        }

        User saved = userRepository.save(resident);

        notificationService.notify(adminId, NotificationType.RESIDENT_UPDATED,
                "Resident updated", saved.getFullName() + "'s profile was updated");

        return mapper.toResponse(saved, household);
    }

    @Transactional(readOnly = true)
    public ResidentResponse getById(Long residentId, Long adminId) {
        User resident = findResidentOrThrow(residentId);
        Household household = assertAdminManagesResident(resident, adminId);
        return mapper.toResponse(resident, household);
    }

    @Transactional(readOnly = true)
    public PageResponse<ResidentResponse> list(
            Long adminId, Long apartmentId, Boolean enabled, String search, Pageable pageable) {
        Page<User> page = userRepository.searchResidentsForAdmin(adminId, apartmentId, enabled, search, pageable);
        return PageResponse.from(page.map(resident -> mapper.toResponse(resident, activeHouseholdFor(resident))));
    }

    /**
     * Approved, enabled residents available to pick in the "Assign a Resident" dropdown,
     * replacing the old manual numeric Resident User ID field. Not restricted to residents
     * without a household already -- a resident can legitimately be linked to more than
     * one household (e.g. a family member across units), matching the existing assign()
     * behaviour which only rejects a duplicate assignment to the *same* household.
     */
    @Transactional(readOnly = true)
    public List<AssignableResidentResponse> listAssignable() {
        return userRepository.findByRoleAndEnabledTrueOrderByFullNameAsc(Role.RESIDENT)
                .stream()
                .map(mapper::toAssignableResponse)
                .toList();
    }

    /**
     * Residents who self-registered via the public /auth/register page and are
     * awaiting approval. Not scoped to a single admin: the resident has no household
     * yet, so any Building Owner may review and claim them into one of their own
     * households (mirrors the existing self-registered-resident adoption logic in
     * {@link #create}).
     */
    @Transactional(readOnly = true)
    public List<PendingResidentResponse> listPending() {
        return userRepository.findByRoleAndRegistrationStatusOrderByCreatedAtAsc(Role.RESIDENT, RegistrationStatus.PENDING)
                .stream()
                .map(mapper::toPendingResponse)
                .toList();
    }

    /**
     * Approves a pending resident registration: assigns them to the chosen household
     * by delegating to the existing {@link ResidentAssignmentService#assign}, then
     * enables the account. Username, email, and the BCrypt password hash chosen at
     * registration are left completely untouched -- no reset, no new user created.
     */
    @Transactional
    public ResidentResponse approve(Long residentId, ApproveResidentRequest request, Long adminId) {
        User resident = findResidentOrThrow(residentId);
        if (resident.getRegistrationStatus() != RegistrationStatus.PENDING) {
            throw new InvalidRequestException("This resident registration is not pending approval");
        }

        Household household = householdRepository.findById(request.getHouseholdId())
                .orElseThrow(() -> ResourceNotFoundException.of("Household", request.getHouseholdId()));
        assertOwnedByAdmin(household, adminId);

        residentAssignmentService.assign(new ResidentAssignmentRequest(
                household.getId(), resident.getId(), request.getRelationType(), LocalDate.now(), null));

        resident.setEnabled(true);
        resident.setRegistrationStatus(RegistrationStatus.APPROVED);
        resident.setRejectionReason(null);
        if (resident.getResidentCode() == null) {
            resident.setResidentCode("RES-" + String.format("%06d", resident.getId()));
        }
        User saved = userRepository.save(resident);

        notificationService.notify(saved.getId(), NotificationType.REGISTRATION_APPROVED,
                "Registration approved", "Your registration has been approved. You may now login.");

        return mapper.toResponse(saved, household);
    }

    /** Rejects a pending resident registration; the account stays disabled and cannot log in. */
    @Transactional
    public void reject(Long residentId, RejectResidentRequest request, Long adminId) {
        User resident = findResidentOrThrow(residentId);
        if (resident.getRegistrationStatus() != RegistrationStatus.PENDING) {
            throw new InvalidRequestException("This resident registration is not pending approval");
        }

        resident.setRegistrationStatus(RegistrationStatus.REJECTED);
        resident.setRejectionReason(request.getReason());
        resident.setEnabled(false);
        userRepository.save(resident);

        notificationService.notify(resident.getId(), NotificationType.REGISTRATION_REJECTED,
                "Registration rejected", "Your registration request has been rejected.");
    }

    @Transactional
    public ResidentResponse setEnabled(Long residentId, boolean enabled, Long adminId) {
        User resident = findResidentOrThrow(residentId);
        Household household = assertAdminManagesResident(resident, adminId);
        resident.setEnabled(enabled);
        User saved = userRepository.save(resident);

        notificationService.notify(adminId,
                enabled ? NotificationType.RESIDENT_ENABLED : NotificationType.RESIDENT_DISABLED,
                enabled ? "Resident account enabled" : "Resident account disabled",
                saved.getFullName() + "'s account was " + (enabled ? "enabled" : "disabled"));

        return mapper.toResponse(saved, household);
    }

    @Transactional
    public void resetPassword(Long residentId, AdminResetPasswordRequest request, Long adminId) {
        User resident = findResidentOrThrow(residentId);
        assertAdminManagesResident(resident, adminId);
        resident.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(resident);

        notificationService.notify(adminId, NotificationType.PASSWORD_RESET,
                "Password reset", resident.getFullName() + "'s password was reset by the administrator");
    }

    @Transactional
    public void delete(Long residentId, Long adminId) {
        User resident = findResidentOrThrow(residentId);
        assertAdminManagesResident(resident, adminId);
        userRepository.delete(resident);
    }

    // ------------------------------------------------------------------

    private User findResidentOrThrow(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Resident", id));
        if (user.getRole() != Role.RESIDENT) {
            throw ResourceNotFoundException.of("Resident", id);
        }
        return user;
    }

    private Household assertAdminManagesResident(User resident, Long adminId) {
        Household household = activeHouseholdFor(resident);
        if (household == null || !household.getApartment().getAdmin().getId().equals(adminId)) {
            throw new UnauthorizedActionException("You do not manage this resident");
        }
        return household;
    }

    private void assertOwnedByAdmin(Household household, Long adminId) {
        if (household.getApartment().getAdmin() == null
                || !household.getApartment().getAdmin().getId().equals(adminId)) {
            throw new UnauthorizedActionException("You do not manage this household");
        }
    }

    private Household activeHouseholdFor(User resident) {
        List<ResidentAssignment> assignments = residentAssignmentRepository.findByUserId(resident.getId());
        Optional<ResidentAssignment> active = assignments.stream().filter(ResidentAssignment::isActive).findFirst();
        return active.map(ResidentAssignment::getHousehold).orElse(null);
    }

    private String generateUniqueUsername(String email) {
        String base = email.substring(0, email.indexOf('@'))
                .replaceAll("[^a-zA-Z0-9._-]", "")
                .toLowerCase();
        if (base.length() < 4) {
            base = (base + "user").substring(0, Math.max(4, base.length()));
        }
        String candidate = base;
        int suffix = 1;
        while (userRepository.existsByUsername(candidate)) {
            candidate = base + suffix;
            suffix++;
        }
        return candidate;
    }

    /**
     * Trims leading/trailing whitespace from a submitted email before it is ever compared
     * or persisted. Case is intentionally left as typed -- uniqueness is enforced via the
     * case-insensitive findByEmailIgnoreCase repository method, not by lower-casing the
     * stored value.
     */
    private String normalizeEmail(String rawEmail) {
        return rawEmail == null ? null : rawEmail.trim();
    }
}
