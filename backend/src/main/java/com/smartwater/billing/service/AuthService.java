package com.smartwater.billing.service;

import com.smartwater.billing.config.PasswordResetProperties;
import com.smartwater.billing.dto.auth.*;
import com.smartwater.billing.dto.resident.ResidentAssignmentRequest;
import com.smartwater.billing.entity.Household;
import com.smartwater.billing.entity.NotificationType;
import com.smartwater.billing.entity.PasswordResetToken;
import com.smartwater.billing.entity.RegistrationStatus;
import com.smartwater.billing.entity.RelationType;
import com.smartwater.billing.entity.Role;
import com.smartwater.billing.entity.User;
import com.smartwater.billing.exception.DuplicateResourceException;
import com.smartwater.billing.exception.InvalidRequestException;
import com.smartwater.billing.exception.ResourceNotFoundException;
import com.smartwater.billing.exception.UnauthorizedActionException;
import com.smartwater.billing.mapper.UserMapper;
import com.smartwater.billing.repository.HouseholdRepository;
import com.smartwater.billing.repository.PasswordResetTokenRepository;
import com.smartwater.billing.repository.ResidentAssignmentRepository;
import com.smartwater.billing.repository.UserRepository;
import com.smartwater.billing.security.CustomUserDetails;
import com.smartwater.billing.security.jwt.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserMapper userMapper;
    private final TenantAccessService tenantAccessService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailNotificationService emailNotificationService;
    private final PasswordResetProperties passwordResetProperties;
    private final Environment environment;
    private final HouseholdRepository householdRepository;
    private final ResidentAssignmentRepository residentAssignmentRepository;
    private final ResidentAssignmentService residentAssignmentService;
    private final NotificationService notificationService;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Transactional
    public UserProfileResponse register(RegisterRequest request) {
        // SUPER_ADMIN is a platform-level account and must never be created
        // through public self-registration -- there can be exactly one, and
        // it is only ever bootstrapped by the application startup process.
        // The frontend already omits SUPER_ADMIN from the role dropdown,
        // but that alone doesn't stop a direct API call, so it's enforced
        // here too.
        if (request.getRole() == Role.SUPER_ADMIN) {
            throw new InvalidRequestException("SUPER_ADMIN cannot be selected during registration");
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("Username '" + request.getUsername() + "' is already taken");
        }
        // Case-insensitive, whitespace-trimmed check against ALL existing users regardless
        // of role -- the same email must never be usable for a Building Owner, Apartment
        // Administrator, or Resident account. Normalized once here and reused below so the
        // stored email and the checked email are always the same trimmed value.
        String normalizedEmail = normalizeEmail(request.getEmail());
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new DuplicateResourceException("An account with this email already exists.");
        }

        // A self-registering RESIDENT must supply a valid, unclaimed Household ID (see
        // resolveHouseholdForRegistration) -- resolved and validated BEFORE the user row
        // is created, so a bad/claimed Household ID never leaves an orphaned account
        // behind. Since the household is already verified here, the resident is linked
        // and enabled immediately -- no separate Building Owner approval step needed,
        // unlike the older no-household-specified pending-approval flow this reuses the
        // linking logic of (ResidentAssignmentService#assign, also used by
        // ResidentManagementService#approve). ADMIN self-registration is unaffected and
        // remains immediately enabled/approved as before.
        boolean isSelfRegisteringResident = request.getRole() == Role.RESIDENT;
        Household household = isSelfRegisteringResident
                ? resolveHouseholdForRegistration(request.getHouseholdId())
                : null;

        User user = User.builder()
                .fullName(request.getFullName())
                .email(normalizedEmail)
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhoneNumber())
                .role(request.getRole())
                .enabled(true)
                .registrationStatus(RegistrationStatus.APPROVED)
                .build();

        User saved = userRepository.save(user);

        if (household != null) {
            saved.setResidentCode("RES-" + String.format("%06d", saved.getId()));
            saved = userRepository.save(saved);
            linkResidentToHousehold(saved, household);
        }

        return userMapper.toProfileResponse(saved);
    }

    /**
     * Public, authoritative Household ID validation shared by both POST /auth/register
     * and the debounced GET /auth/household-lookup convenience check -- the frontend may
     * also call the lookup live as the resident types, but this method (invoked again on
     * submit) is the only check that actually gates account creation.
     */
    private Household resolveHouseholdForRegistration(String rawHouseholdId) {
        if (rawHouseholdId == null || rawHouseholdId.isBlank()) {
            throw new InvalidRequestException("Household ID is required");
        }
        Household household = householdRepository.findByHouseholdCodeIgnoreCase(rawHouseholdId.trim())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "We couldn't find a household with this ID. Check with your building owner and try again."));
        if (isHouseholdClaimed(household)) {
            throw new DuplicateResourceException(
                    "This household is already registered. Please contact your building owner if you believe "
                            + "this is a mistake.");
        }
        return household;
    }

    /**
     * Trims leading/trailing whitespace from a submitted email before it is ever compared
     * or persisted. Case is intentionally left as typed -- uniqueness is enforced via the
     * case-insensitive existsByEmailIgnoreCase/findByEmailIgnoreCase repository methods,
     * not by lower-casing the stored value.
     */
    private String normalizeEmail(String rawEmail) {
        return rawEmail == null ? null : rawEmail.trim();
    }

    private boolean isHouseholdClaimed(Household household) {
        return !residentAssignmentRepository.findByHouseholdIdAndActiveTrue(household.getId()).isEmpty();
    }

    /**
     * Same linking step ResidentManagementService#approve delegates to for a Building
     * Owner-approved pending registration -- reused here so a self-registered resident
     * with a valid Household ID ends up in exactly the same state (an active PRIMARY
     * ResidentAssignment) without duplicating the assignment logic.
     */
    private void linkResidentToHousehold(User resident, Household household) {
        residentAssignmentService.assign(new ResidentAssignmentRequest(
                household.getId(), resident.getId(), RelationType.PRIMARY, LocalDate.now(), null));

        if (household.getApartment().getAdmin() != null) {
            notificationService.notify(household.getApartment().getAdmin().getId(), NotificationType.RESIDENT_ADDED,
                    "New resident added",
                    resident.getFullName() + " registered with household ID " + household.getHouseholdCode()
                            + " and was linked to " + household.getApartment().getName() + " - "
                            + household.getUnitNumber());
        }
    }

    /**
     * Backs the debounced "checking availability..." indicator on the registration form.
     * Deliberately read-only and side-effect free -- unlike register(), which performs
     * the same NOT_FOUND/already-claimed checks again, authoritatively, at submit time.
     */
    @Transactional(readOnly = true)
    public HouseholdLookupResponse lookupHousehold(String rawHouseholdId) {
        if (rawHouseholdId == null || rawHouseholdId.isBlank()) {
            return HouseholdLookupResponse.builder().status(HouseholdLookupResponse.Status.NOT_FOUND).build();
        }
        return householdRepository.findByHouseholdCodeIgnoreCase(rawHouseholdId.trim())
                .map(household -> HouseholdLookupResponse.builder()
                        .status(isHouseholdClaimed(household)
                                ? HouseholdLookupResponse.Status.ALREADY_REGISTERED
                                : HouseholdLookupResponse.Status.AVAILABLE)
                        .apartmentName(household.getApartment().getName())
                        .unitNumber(household.getUnitNumber())
                        .build())
                .orElseGet(() -> HouseholdLookupResponse.builder()
                        .status(HouseholdLookupResponse.Status.NOT_FOUND)
                        .build());
    }

    public JwtResponse login(LoginRequest request) {
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsernameOrEmail(), request.getPassword()));
        } catch (BadCredentialsException ex) {
            throw new BadCredentialsException("Invalid username/email or password");
        }

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        if (tenantAccessService.isCommunitySuspended(
                userDetails.getId(), com.smartwater.billing.entity.Role.valueOf(userDetails.getRole()))) {
            throw new com.smartwater.billing.exception.UnauthorizedActionException(
                    "Your community has been suspended by the platform administrator. Please contact support.");
        }

        String accessToken = jwtService.generateAccessToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        return JwtResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(userDetails.getId())
                .username(userDetails.getUsername())
                .role(userDetails.getRole())
                .expiresInMs(jwtService.getAccessExpirationMs())
                .build();
    }

    public JwtResponse refreshToken(RefreshTokenRequest request) {
        String token = request.getRefreshToken();
        String username = jwtService.extractUsername(token);

        if (!"REFRESH".equals(jwtService.extractTokenType(token))) {
            throw new InvalidRequestException("Provided token is not a valid refresh token");
        }
        if (jwtService.isTokenExpired(token)) {
            throw new InvalidRequestException("Refresh token has expired, please log in again");
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> ResourceNotFoundException.of("User", username));
        CustomUserDetails userDetails = new CustomUserDetails(user);

        String newAccessToken = jwtService.generateAccessToken(userDetails);
        String newRefreshToken = jwtService.generateRefreshToken(userDetails);

        return JwtResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .userId(userDetails.getId())
                .username(userDetails.getUsername())
                .role(userDetails.getRole())
                .expiresInMs(jwtService.getAccessExpirationMs())
                .build();
    }

    /**
     * Step 1 of the self-service "Forgot password" flow: looks up the account for the
     * given username/email AND role (see {@link ForgotPasswordRequest#getRole()} for why
     * role is required), issues a fresh single-use token, invalidates any previously
     * outstanding tokens for that user, and emails a reset link.
     *
     * <p>Note on account enumeration: this deliberately returns a distinct "account not
     * found" error (via {@link ResourceNotFoundException}, mapped to 404) rather than the
     * generic "if an account exists..." message some public-internet auth flows use. That
     * tradeoff is intentional here per the explicit product requirement to surface an
     * "Account not found" state to the user, appropriate for this kind of
     * internally-facing, community-operated system.
     */
    @Transactional
    public ForgotPasswordResponse forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByUsernameOrEmail(request.getUsernameOrEmail(), request.getUsernameOrEmail())
                .filter(u -> u.getRole() == request.getRole())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No account found with that username/email for the selected role"));

        if (!user.isEnabled()) {
            throw new UnauthorizedActionException(
                    "This account is not active. Please contact your administrator.");
        }

        // Only one live token per user at a time -- a new request supersedes any older,
        // still-unused one so a stale earlier email link can't be used after a newer one
        // was issued.
        passwordResetTokenRepository.deleteUnusedTokensForUser(user);

        String rawToken = generateRawToken();
        PasswordResetToken tokenEntity = PasswordResetToken.builder()
                .user(user)
                .tokenHash(hashToken(rawToken))
                .expiresAt(LocalDateTime.now().plusMinutes(passwordResetProperties.getTokenExpiryMinutes()))
                .build();
        passwordResetTokenRepository.save(tokenEntity);

        String resetLink = passwordResetProperties.getFrontendUrl() + "/reset-password?token=" + rawToken;
        boolean emailed = emailNotificationService.sendPasswordResetEmail(
                user, resetLink, passwordResetProperties.getTokenExpiryMinutes());

        ForgotPasswordResponse.ForgotPasswordResponseBuilder response = ForgotPasswordResponse.builder()
                .message("If the account is eligible, a password reset link has been sent to the "
                        + "registered email address.");

        // Local/dev-only convenience: if we couldn't actually deliver an email (no SMTP
        // configured), surface the link directly so the flow can still be tested
        // end-to-end -- but ONLY outside the 'prod' profile. In prod this stays null and
        // the caller must configure real SMTP, matching how JwtSecretStartupValidator
        // already refuses unsafe dev defaults in that profile.
        if (!emailed && !isProdProfile()) {
            log.warn("[DEV ONLY] Password reset link for {} (email not sent, SMTP unconfigured): {}",
                    user.getUsername(), resetLink);
            response.devResetLink(resetLink);
        }

        return response.build();
    }

    /**
     * Lets the frontend check whether a reset link is still usable before showing the
     * "choose a new password" form, without consuming the token.
     */
    @Transactional(readOnly = true)
    public ValidateResetTokenResponse validateResetToken(String rawToken) {
        return passwordResetTokenRepository.findByTokenHash(hashToken(rawToken))
                .filter(PasswordResetToken::isValid)
                .map(t -> ValidateResetTokenResponse.builder().valid(true).role(t.getUser().getRole()).build())
                .orElseGet(() -> ValidateResetTokenResponse.builder().valid(false).build());
    }

    /**
     * Step 2 of the self-service "Forgot password" flow: consumes a valid token and sets
     * the new password using the same {@link PasswordEncoder} (BCrypt) as registration and
     * login, so the account can be signed into immediately afterward.
     */
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new InvalidRequestException("Passwords do not match");
        }

        PasswordResetToken tokenEntity = passwordResetTokenRepository.findByTokenHash(hashToken(request.getToken()))
                .orElseThrow(() -> new InvalidRequestException("This reset link is invalid"));

        if (tokenEntity.isUsed()) {
            throw new InvalidRequestException("This reset link has already been used. Please request a new one.");
        }
        if (tokenEntity.isExpired()) {
            throw new InvalidRequestException("This reset link has expired. Please request a new one.");
        }

        User user = tokenEntity.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        tokenEntity.setUsedAt(LocalDateTime.now());
        passwordResetTokenRepository.save(tokenEntity);

        // Defense in depth: also clear out any other outstanding tokens for this user
        // (e.g. from an earlier, abandoned request) now that the password has changed.
        passwordResetTokenRepository.deleteUnusedTokensForUser(user);

        log.info("Password reset completed for user {}", user.getUsername());
    }

    private boolean isProdProfile() {
        for (String profile : environment.getActiveProfiles()) {
            if ("prod".equalsIgnoreCase(profile)) {
                return true;
            }
        }
        return false;
    }

    /** 256 bits of randomness, URL-safe so it can go straight into a query string unescaped. */
    private String generateRawToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException ex) {
            // SHA-256 is guaranteed available on every standard JVM; this can't actually happen.
            throw new IllegalStateException("SHA-256 algorithm not available", ex);
        }
    }
}
