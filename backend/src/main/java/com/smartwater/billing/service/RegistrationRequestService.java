package com.smartwater.billing.service;

import com.smartwater.billing.dto.registration.RegistrationDecisionRequest;
import com.smartwater.billing.dto.registration.RegistrationRequestResponse;
import com.smartwater.billing.dto.registration.RegistrationSubmitRequest;
import com.smartwater.billing.entity.*;
import com.smartwater.billing.exception.DuplicateResourceException;
import com.smartwater.billing.exception.InvalidRequestException;
import com.smartwater.billing.exception.ResourceNotFoundException;
import com.smartwater.billing.mapper.RegistrationRequestMapper;
import com.smartwater.billing.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RegistrationRequestService {

    private final RegistrationRequestRepository registrationRequestRepository;
    private final CommunityRepository communityRepository;
    private final ApartmentRepository apartmentRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RegistrationRequestMapper mapper;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    @Transactional
    public RegistrationRequestResponse submit(RegistrationSubmitRequest request) {
        // Case-insensitive, whitespace-trimmed check against ALL existing users regardless
        // of role -- the same email must never be usable for a Building Owner, Apartment
        // Administrator, or Resident account.
        String normalizedEmail = normalizeEmail(request.getAdminEmail());
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new DuplicateResourceException("An account with this email already exists.");
        }
        if (registrationRequestRepository.existsByAdminEmailIgnoreCaseAndStatus(
                normalizedEmail, RegistrationStatus.PENDING)) {
            throw new DuplicateResourceException(
                    "A registration request for '" + normalizedEmail + "' is already pending approval");
        }

        RegistrationRequest entity = RegistrationRequest.builder()
                .communityName(request.getCommunityName())
                .apartmentName(request.getApartmentName())
                .addressLine(request.getAddressLine())
                .city(request.getCity())
                .state(request.getState())
                .pincode(request.getPincode())
                .adminFullName(request.getAdminFullName())
                .adminEmail(normalizedEmail)
                .adminPhoneNumber(request.getAdminPhoneNumber())
                .adminPasswordHash(passwordEncoder.encode(request.getPassword()))
                .status(RegistrationStatus.PENDING)
                .build();

        return mapper.toResponse(registrationRequestRepository.save(entity));
    }

    @Transactional(readOnly = true)
    public List<RegistrationRequestResponse> list(RegistrationStatus status) {
        List<RegistrationRequest> requests = status != null
                ? registrationRequestRepository.findByStatusOrderByCreatedAtDesc(status)
                : registrationRequestRepository.findAllByOrderByCreatedAtDesc();
        return requests.stream().map(mapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public RegistrationRequestResponse getById(Long id) {
        return mapper.toResponse(findOrThrow(id));
    }

    @Transactional
    public RegistrationRequestResponse approve(Long id, Long superAdminId) {
        RegistrationRequest request = findOrThrow(id);
        if (request.getStatus() != RegistrationStatus.PENDING) {
            throw new InvalidRequestException("Only pending requests can be approved");
        }
        if (userRepository.existsByEmailIgnoreCase(request.getAdminEmail())) {
            throw new DuplicateResourceException("An account with this email already exists.");
        }

        Community community = communityRepository.save(Community.builder()
                .name(request.getCommunityName())
                .city(request.getCity())
                .state(request.getState())
                .active(true)
                .build());

        String username = generateUniqueUsername(request.getAdminEmail());

        User admin = userRepository.save(User.builder()
                .fullName(request.getAdminFullName())
                .email(request.getAdminEmail())
                .username(username)
                .password(request.getAdminPasswordHash())
                .phoneNumber(request.getAdminPhoneNumber())
                .role(Role.ADMIN)
                .enabled(true)
                .build());

        Apartment apartment = apartmentRepository.save(Apartment.builder()
                .name(request.getApartmentName())
                .addressLine(request.getAddressLine())
                .city(request.getCity())
                .state(request.getState())
                .zipCode(request.getPincode())
                .totalUnits(0)
                .admin(admin)
                .community(community)
                .build());

        request.setStatus(RegistrationStatus.APPROVED);
        request.setReviewedAt(LocalDateTime.now());
        request.setReviewedBy(resolveSuperAdmin(superAdminId));
        request.setCreatedCommunity(community);
        request.setCreatedApartment(apartment);
        request.setCreatedAdminUser(admin);

        notificationService.notify(admin, NotificationType.REGISTRATION_APPROVED,
                "Welcome to the platform",
                "Your community '" + community.getName() + "' has been approved. You can now sign in as its administrator.");

        auditLogService.record(superAdminId, "APPROVE_REGISTRATION", "RegistrationRequest", request.getId(),
                "Approved community '" + community.getName() + "'");

        return mapper.toResponse(registrationRequestRepository.save(request));
    }

    @Transactional
    public RegistrationRequestResponse reject(Long id, RegistrationDecisionRequest decision, Long superAdminId) {
        RegistrationRequest request = findOrThrow(id);
        if (request.getStatus() != RegistrationStatus.PENDING) {
            throw new InvalidRequestException("Only pending requests can be rejected");
        }

        request.setStatus(RegistrationStatus.REJECTED);
        request.setRejectionReason(decision.getReason());
        request.setReviewedAt(LocalDateTime.now());
        request.setReviewedBy(resolveSuperAdmin(superAdminId));

        auditLogService.record(superAdminId, "REJECT_REGISTRATION", "RegistrationRequest", request.getId(),
                "Rejected: " + decision.getReason());

        return mapper.toResponse(registrationRequestRepository.save(request));
    }

    /**
     * Trims leading/trailing whitespace from a submitted email before it is ever compared
     * or persisted. Case is intentionally left as typed -- uniqueness is enforced via the
     * case-insensitive existsByEmailIgnoreCase repository method, not by lower-casing the
     * stored value.
     */
    private String normalizeEmail(String rawEmail) {
        return rawEmail == null ? null : rawEmail.trim();
    }

    private RegistrationRequest findOrThrow(Long id) {
        return registrationRequestRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Registration request", id));
    }

    private User resolveSuperAdmin(Long superAdminId) {
        if (superAdminId == null) {
            return null;
        }
        return userRepository.findById(superAdminId).orElse(null);
    }

    /**
     * Derives a unique login username from the admin's email local-part,
     * appending a numeric suffix on collision.
     */
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
}
