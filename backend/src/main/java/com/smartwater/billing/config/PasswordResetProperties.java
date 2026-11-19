package com.smartwater.billing.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Settings for the self-service "Forgot password" flow, bound from
 * {@code app.password-reset.*} in application.properties.
 */
@Configuration
@ConfigurationProperties(prefix = "app.password-reset")
@Getter
@Setter
public class PasswordResetProperties {

    /** How long a reset link stays valid after being issued. */
    private int tokenExpiryMinutes = 30;

    /**
     * Base URL of the frontend app, used to build the reset link that gets emailed
     * (e.g. {@code https://app.example.com} -> {@code https://app.example.com/reset-password?token=...}).
     */
    private String frontendUrl = "http://localhost:5173";
}
