package com.smartwater.billing.mapper;

import com.smartwater.billing.dto.notification.NotificationResponse;
import com.smartwater.billing.entity.Notification;
import org.springframework.stereotype.Component;

@Component
public class NotificationMapper {

    public NotificationResponse toResponse(Notification notification) {
        NotificationResponse.NotificationResponseBuilder builder = NotificationResponse.builder()
                .id(notification.getId())
                .type(notification.getType().name())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .read(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .severity(notification.getSeverity() != null ? notification.getSeverity().name() : null)
                .billingMonth(notification.getBillingMonth());

        if (notification.getHousehold() != null) {
            builder.householdId(notification.getHousehold().getId())
                    .householdUnitNumber(notification.getHousehold().getUnitNumber());
        }
        if (notification.getApartment() != null) {
            builder.apartmentId(notification.getApartment().getId())
                    .apartmentName(notification.getApartment().getName());
        }
        if (notification.getRelatedUsageLog() != null) {
            builder.relatedUsageLogId(notification.getRelatedUsageLog().getId());
        }

        return builder.build();
    }
}
