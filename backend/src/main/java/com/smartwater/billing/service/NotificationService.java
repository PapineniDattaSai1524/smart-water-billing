package com.smartwater.billing.service;

import com.smartwater.billing.dto.common.PageResponse;
import com.smartwater.billing.dto.notification.NotificationResponse;
import com.smartwater.billing.dto.notification.OwnerNotificationBatchResponse;
import com.smartwater.billing.entity.Apartment;
import com.smartwater.billing.entity.Household;
import com.smartwater.billing.entity.Notification;
import com.smartwater.billing.entity.NotificationSeverity;
import com.smartwater.billing.entity.NotificationType;
import com.smartwater.billing.entity.User;
import com.smartwater.billing.entity.WaterUsageLog;
import com.smartwater.billing.exception.InvalidRequestException;
import com.smartwater.billing.exception.ResourceNotFoundException;
import com.smartwater.billing.exception.UnauthorizedActionException;
import com.smartwater.billing.mapper.NotificationMapper;
import com.smartwater.billing.repository.ApartmentRepository;
import com.smartwater.billing.repository.NotificationRepository;
import com.smartwater.billing.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final ApartmentRepository apartmentRepository;
    private final NotificationMapper notificationMapper;

    /** Fire-and-forget notification creation; never lets a notification failure break the calling workflow. */
    @Transactional
    public void notify(Long recipientUserId, NotificationType type, String title, String message) {
        if (recipientUserId == null) {
            return;
        }
        userRepository.findById(recipientUserId).ifPresent(recipient -> {
            Notification notification = Notification.builder()
                    .recipient(recipient)
                    .type(type)
                    .title(title)
                    .message(message)
                    .read(false)
                    .build();
            notificationRepository.save(notification);
        });
    }

    @Transactional
    public void notify(User recipient, NotificationType type, String title, String message) {
        if (recipient == null) {
            return;
        }
        notificationRepository.save(Notification.builder()
                .recipient(recipient)
                .type(type)
                .title(title)
                .message(message)
                .read(false)
                .build());
    }

    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> list(Long userId, Pageable pageable) {
        return PageResponse.from(notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId, pageable)
                .map(notificationMapper::toResponse));
    }

    @Transactional(readOnly = true)
    public long unreadCount(Long userId) {
        return notificationRepository.countByRecipientIdAndReadFalse(userId);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsRead(userId);
    }

    /**
     * Marks a single notification as read, scoped to the requesting user so nobody
     * can mark someone else's notification as read by guessing an id.
     *
     * @return true if a notification was updated, false if it doesn't exist or isn't theirs.
     */
    @Transactional
    public boolean markAsRead(Long notificationId, Long userId) {
        return notificationRepository.markAsRead(notificationId, userId) > 0;
    }

    /**
     * Used by the Alert & Notification Engine (and available for any future
     * alert-style notification) to raise a notification carrying full
     * household/apartment/usage-log/severity context. Existing {@code notify(...)}
     * call sites are untouched and keep producing plain INFO notifications.
     */
    @Transactional
    public void notifyAlert(User recipient, NotificationType type, String title, String message,
                             NotificationSeverity severity, Household household, Apartment apartment,
                             WaterUsageLog relatedUsageLog, String billingMonth) {
        if (recipient == null) {
            return;
        }
        notificationRepository.save(Notification.builder()
                .recipient(recipient)
                .type(type)
                .title(title)
                .message(message)
                .read(false)
                .severity(severity != null ? severity : NotificationSeverity.INFO)
                .household(household)
                .apartment(apartment)
                .relatedUsageLog(relatedUsageLog)
                .billingMonth(billingMonth)
                .build());
    }

    /** True if an alert of this type has already been raised for this exact household + usage reading. */
    @Transactional(readOnly = true)
    public boolean alertAlreadySent(Long householdId, NotificationType type, Long usageLogId) {
        return notificationRepository.existsByHouseholdIdAndTypeAndRelatedUsageLogId(householdId, type, usageLogId);
    }

    /** A resident's own notifications, with optional type/read-status/date-range filters. */
    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> search(Long userId, NotificationType type, Boolean read,
                                                       LocalDateTime from, LocalDateTime to, Pageable pageable) {
        return PageResponse.from(notificationRepository.search(userId, type, read, from, to, pageable)
                .map(notificationMapper::toResponse));
    }

    /** Apartment-admin view of every alert/notification raised for their apartment, ownership-checked. */
    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> searchByApartment(Long apartmentId, Long adminId, NotificationType type,
                                                                  Boolean read, LocalDateTime from, LocalDateTime to,
                                                                  Pageable pageable) {
        Apartment apartment = apartmentRepository.findById(apartmentId)
                .orElseThrow(() -> ResourceNotFoundException.of("Apartment", apartmentId));
        if (apartment.getAdmin() == null || !apartment.getAdmin().getId().equals(adminId)) {
            throw new UnauthorizedActionException("You do not manage this apartment");
        }
        return PageResponse.from(notificationRepository.searchByApartment(apartmentId, type, read, from, to, pageable)
                .map(notificationMapper::toResponse));
    }

    /** Sends a platform-wide announcement to every user, or only those with the given role. */
    @Transactional
    public int broadcast(String title, String message, com.smartwater.billing.entity.Role targetRole) {
        java.util.List<User> recipients = targetRole != null
                ? userRepository.findByRole(targetRole)
                : userRepository.findAll();

        recipients.forEach(recipient -> notificationRepository.save(Notification.builder()
                .recipient(recipient)
                .type(NotificationType.GLOBAL_ANNOUNCEMENT)
                .title(title)
                .message(message)
                .read(false)
                .build()));

        return recipients.size();
    }

    /**
     * Building Owner "send notification to my residents" feature. The audience is never
     * taken from the request -- it is always resolved server-side from the authenticated
     * Building Owner's own apartments, using the exact same ownership-scoped query as
     * every other resident-management screen. Fans out into one Notification row per
     * resident (existing per-recipient model, existing resident Notifications page reads
     * these unchanged), sharing one batchId so this send can be shown as a single entry
     * in the owner's Notification History.
     */
    @Transactional
    public OwnerNotificationBatchResponse sendOwnerBroadcastToResidents(Long ownerId, String title, String message) {
        User sender = userRepository.findById(ownerId)
                .orElseThrow(() -> ResourceNotFoundException.of("User", ownerId));

        List<User> residents = userRepository.findActiveResidentsForAdmin(ownerId);
        if (residents.isEmpty()) {
            throw new InvalidRequestException(
                    "You don't have any residents to notify yet. Add households and residents to your building first.");
        }

        UUID batchId = UUID.randomUUID();
        LocalDateTime sentAt = LocalDateTime.now();

        residents.forEach(resident -> notificationRepository.save(Notification.builder()
                .recipient(resident)
                .sender(sender)
                .batchId(batchId)
                .type(NotificationType.OWNER_ANNOUNCEMENT)
                .title(title)
                .message(message)
                .read(false)
                .deliveryStatus("SENT")
                .createdAt(sentAt)
                .build()));

        return OwnerNotificationBatchResponse.builder()
                .batchId(batchId.toString())
                .title(title)
                .message(message)
                .audience("Residents Only")
                .sentAt(sentAt)
                .sentByName(sender.getFullName())
                .status("SENT")
                .recipientCount(residents.size())
                .build();
    }

    /** Real, current count of the residents a Building Owner's broadcast would reach right now. */
    @Transactional(readOnly = true)
    public long countRecipientsForOwnerBroadcast(Long ownerId) {
        return userRepository.findActiveResidentsForAdmin(ownerId).size();
    }

    /** A Building Owner's own sent-notification history, one row per "send" action, most recent first. */
    @Transactional(readOnly = true)
    public PageResponse<OwnerNotificationBatchResponse> ownerBroadcastHistory(
            Long ownerId, String search, String status, Pageable pageable) {
        Page<Object[]> rows = notificationRepository.findBroadcastBatchesBySender(
                ownerId, (search == null || search.isBlank()) ? null : search.trim(), status, pageable);

        User sender = userRepository.findById(ownerId).orElse(null);
        String sentByName = sender != null ? sender.getFullName() : null;

        return PageResponse.from(rows.map(row -> toBatchResponse(row, sentByName)));
    }

    /** A single sent batch's full detail, ownership-scoped so an owner can only view their own sends. */
    @Transactional(readOnly = true)
    public OwnerNotificationBatchResponse ownerBroadcastDetail(Long ownerId, UUID batchId) {
        List<Object[]> rows = notificationRepository.findBroadcastBatchByIdAndSender(ownerId, batchId);
        if (rows.isEmpty()) {
            throw ResourceNotFoundException.of("Notification", batchId);
        }
        User sender = userRepository.findById(ownerId).orElse(null);
        return toBatchResponse(rows.get(0), sender != null ? sender.getFullName() : null);
    }

    private OwnerNotificationBatchResponse toBatchResponse(Object[] row, String sentByName) {
        return OwnerNotificationBatchResponse.builder()
                .batchId(row[0].toString())
                .title((String) row[1])
                .message((String) row[2])
                .audience("Residents Only")
                .sentAt((LocalDateTime) row[3])
                .sentByName(sentByName)
                .status((String) row[4])
                .recipientCount((Long) row[5])
                .build();
    }
}
