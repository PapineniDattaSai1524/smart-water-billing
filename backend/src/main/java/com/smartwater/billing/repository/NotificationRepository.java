package com.smartwater.billing.repository;

import com.smartwater.billing.entity.Notification;
import com.smartwater.billing.entity.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId, Pageable pageable);

    long countByRecipientIdAndReadFalse(Long recipientId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Notification n SET n.read = true WHERE n.recipient.id = :recipientId AND n.read = false")
    void markAllAsRead(@Param("recipientId") Long recipientId);

    /** Marks a single notification as read, scoped to its owner. Returns rows updated (0 = not found/not owned). */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Notification n SET n.read = true WHERE n.id = :id AND n.recipient.id = :recipientId")
    int markAsRead(@Param("id") Long id, @Param("recipientId") Long recipientId);

    /**
     * Used by the Alert & Notification Engine scheduler to avoid raising the
     * same alert (household + type + specific usage reading) more than once.
     */
    boolean existsByHouseholdIdAndTypeAndRelatedUsageLogId(Long householdId, NotificationType type, Long relatedUsageLogId);

    /** A resident's own notifications, with optional type/read-status/date filters. */
    @Query("""
            SELECT n FROM Notification n
            WHERE n.recipient.id = :recipientId
              AND (:type IS NULL OR n.type = :type)
              AND (:read IS NULL OR n.read = :read)
              AND (:from IS NULL OR n.createdAt >= :from)
              AND (:to IS NULL OR n.createdAt <= :to)
            ORDER BY n.createdAt DESC
            """)
    Page<Notification> search(
            @Param("recipientId") Long recipientId,
            @Param("type") NotificationType type,
            @Param("read") Boolean read,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable);

    /** Apartment-admin view: every alert/notification raised for that apartment (any recipient), with optional filters. */
    @Query("""
            SELECT n FROM Notification n
            WHERE n.apartment.id = :apartmentId
              AND (:type IS NULL OR n.type = :type)
              AND (:read IS NULL OR n.read = :read)
              AND (:from IS NULL OR n.createdAt >= :from)
              AND (:to IS NULL OR n.createdAt <= :to)
            ORDER BY n.createdAt DESC
            """)
    Page<Notification> searchByApartment(
            @Param("apartmentId") Long apartmentId,
            @Param("type") NotificationType type,
            @Param("read") Boolean read,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable);

    /**
     * A Building Owner's own sent-notification history, grouped back into one row per
     * "send" action (batch_id) even though each send fanned out into one row per resident.
     * One representative row's title/message/createdAt/deliveryStatus stands in for the
     * whole batch since every row in a batch shares identical title/message/timestamp/status
     * by construction. COUNT(n) is the real, current recipient count for that batch.
     */
    @Query(value = """
            SELECT n.batchId, n.title, n.message, n.createdAt, n.deliveryStatus, COUNT(n)
            FROM Notification n
            WHERE n.sender.id = :senderId
              AND n.batchId IS NOT NULL
              AND (:search IS NULL
                   OR LOWER(n.title) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(n.message) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:status IS NULL OR n.deliveryStatus = :status)
            GROUP BY n.batchId, n.title, n.message, n.createdAt, n.deliveryStatus
            ORDER BY n.createdAt DESC
            """,
            countQuery = """
            SELECT COUNT(DISTINCT n.batchId) FROM Notification n
            WHERE n.sender.id = :senderId
              AND n.batchId IS NOT NULL
              AND (:search IS NULL
                   OR LOWER(n.title) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(n.message) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:status IS NULL OR n.deliveryStatus = :status)
            """)
    Page<Object[]> findBroadcastBatchesBySender(
            @Param("senderId") Long senderId,
            @Param("search") String search,
            @Param("status") String status,
            Pageable pageable);

    /** A single batch's title/message/createdAt/status/recipient-count, ownership-scoped to its sender. */
    @Query("""
            SELECT n.batchId, n.title, n.message, n.createdAt, n.deliveryStatus, COUNT(n)
            FROM Notification n
            WHERE n.sender.id = :senderId AND n.batchId = :batchId
            GROUP BY n.batchId, n.title, n.message, n.createdAt, n.deliveryStatus
            """)
    java.util.List<Object[]> findBroadcastBatchByIdAndSender(
            @Param("senderId") Long senderId,
            @Param("batchId") java.util.UUID batchId);
}
