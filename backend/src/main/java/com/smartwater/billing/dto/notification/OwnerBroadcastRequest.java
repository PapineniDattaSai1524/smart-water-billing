package com.smartwater.billing.dto.notification;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/**
 * A Building Owner's "send notification to my residents" request.
 *
 * Deliberately carries no audience, building, or recipient field: the audience
 * is always "the enabled residents of the apartments this Building Owner
 * administers", resolved and enforced entirely server-side from the
 * authenticated caller's id. There is nothing here a client could tamper with
 * to reach another building's residents or any other role.
 */
@Getter
@Setter
public class OwnerBroadcastRequest {

    @NotBlank(message = "Notification title is required.")
    @Size(max = 100, message = "Title cannot exceed 100 characters.")
    private String title;

    @NotBlank(message = "Message is required.")
    @Size(max = 1000, message = "Message cannot exceed 1000 characters.")
    private String message;
}
