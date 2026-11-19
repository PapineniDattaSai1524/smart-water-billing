package com.smartwater.billing.dto.notification;

import com.smartwater.billing.entity.Role;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BroadcastRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Message is required")
    private String message;

    /** Null = send to every user on the platform. */
    private Role targetRole;
}
