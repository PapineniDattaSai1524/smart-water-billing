package com.smartwater.billing.service;

import com.smartwater.billing.dto.useradmin.PlatformUserResponse;
import com.smartwater.billing.entity.NotificationType;
import com.smartwater.billing.entity.Role;
import com.smartwater.billing.entity.User;
import com.smartwater.billing.exception.InvalidRequestException;
import com.smartwater.billing.exception.ResourceNotFoundException;
import com.smartwater.billing.repository.UserRepository;
import com.smartwater.billing.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Super Admin's platform-wide people management: covers the "User
 * Management", "Building Owner Management" (role == ADMIN), and
 * "Role Management" screens, which are all views/actions over the same
 * underlying user directory.
 */
@Service
@RequiredArgsConstructor
public class PlatformUserService {

    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<PlatformUserResponse> listUsers(Role role) {
        List<User> users = role != null ? userRepository.findByRole(role) : userRepository.findAll();
        return users.stream().map(this::toResponse).toList();
    }

    @Transactional
    public PlatformUserResponse setEnabled(Long userId, boolean enabled) {
        User user = findOrThrow(userId);
        if (user.getRole() == Role.SUPER_ADMIN && !enabled) {
            throw new InvalidRequestException("A Super Admin account cannot be disabled");
        }
        user.setEnabled(enabled);
        User saved = userRepository.save(user);

        auditLogService.record(SecurityUtils.getCurrentUserId(),
                enabled ? "ENABLE_USER" : "DISABLE_USER", "User", userId,
                (enabled ? "Enabled " : "Disabled ") + "account for " + user.getUsername());
        notificationService.notify(user.getId(),
                enabled ? NotificationType.RESIDENT_ENABLED : NotificationType.RESIDENT_DISABLED,
                enabled ? "Account enabled" : "Account disabled",
                "Your account has been " + (enabled ? "enabled" : "disabled") + " by a platform administrator");

        return toResponse(saved);
    }

    @Transactional
    public PlatformUserResponse changeRole(Long userId, Role newRole) {
        User user = findOrThrow(userId);
        if (user.getRole() == Role.SUPER_ADMIN && newRole != Role.SUPER_ADMIN) {
            throw new InvalidRequestException("Cannot demote the last line of Super Admin access this way");
        }
        // Platform invariant: exactly one SUPER_ADMIN account may exist.
        // Promoting a second user to SUPER_ADMIN through Role Management
        // would violate that, so it's blocked here regardless of what the
        // frontend dropdown allows.
        if (newRole == Role.SUPER_ADMIN && user.getRole() != Role.SUPER_ADMIN) {
            throw new InvalidRequestException(
                    "Cannot promote a user to Super Admin. Only one Super Admin account may exist on the platform.");
        }
        Role previous = user.getRole();
        user.setRole(newRole);
        User saved = userRepository.save(user);

        auditLogService.record(SecurityUtils.getCurrentUserId(), "CHANGE_ROLE", "User", userId,
                "Changed role for " + user.getUsername() + " from " + previous + " to " + newRole);

        return toResponse(saved);
    }

    private User findOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.of("User", userId));
    }

    private PlatformUserResponse toResponse(User user) {
        return PlatformUserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .username(user.getUsername())
                .role(user.getRole().name())
                .enabled(user.isEnabled())
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
                .build();
    }
}
