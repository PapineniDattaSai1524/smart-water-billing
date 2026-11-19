package com.smartwater.billing.service;

import com.smartwater.billing.config.AlertProperties;
import com.smartwater.billing.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * Sends the Alert & Notification Engine's email notifications.
 *
 * <p>Email is entirely optional: {@code spring-boot-starter-mail} auto-configures a
 * {@link JavaMailSender} bean even when no SMTP host is set, so the application always
 * starts. This service additionally gates on {@code app.alert.email-enabled} and on
 * {@code spring.mail.host} actually being set, and swallows/logs any send failure, so a
 * misconfigured or unreachable SMTP server can never break the alert scheduler or any
 * other request.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailNotificationService {

    private final JavaMailSender mailSender;
    private final AlertProperties alertProperties;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${mail.from:no-reply@smartwater.local}")
    private String fromAddress;

    /**
     * Sends a plain-text alert email (overuse / anomaly). No-ops (with a log line)
     * whenever email is disabled, unconfigured, or the recipient has no email address.
     * Never throws.
     */
    public void sendAlertEmail(User recipient, String subject, String body) {
        send(recipient, subject, body, "Alert");
    }

    /**
     * Week 5-6 Feature 5: monthly bill notification email. Same safe-send gating and
     * failure handling as {@link #sendAlertEmail}, reusing this one email sender rather
     * than standing up a second mail pathway.
     */
    public void sendBillEmail(User recipient, String subject, String body) {
        send(recipient, subject, body, "Bill");
    }

    /**
     * Forgot-password reset link email. Unlike {@link #sendAlertEmail}/{@link #sendBillEmail},
     * this is NOT gated on {@code app.alert.email-enabled} -- password reset is a core auth
     * feature, not an optional alert, so it should attempt to send whenever SMTP is configured
     * at all. Returns whether the email was actually sent, so the caller (AuthService) knows
     * whether it needs to fall back to logging the link for local/dev use.
     */
    public boolean sendPasswordResetEmail(User recipient, String resetLink, int expiryMinutes) {
        if (!StringUtils.hasText(mailHost) || !StringUtils.hasText(mailUsername)) {
            log.warn("Password reset email skipped: SMTP is not fully configured (MAIL_HOST/"
                    + "MAIL_USERNAME/MAIL_PASSWORD env vars not set).");
            return false;
        }
        if (recipient == null || !StringUtils.hasText(recipient.getEmail())) {
            log.debug("Password reset email skipped: recipient has no email address.");
            return false;
        }

        String subject = "Reset your Smart Water Billing password";
        String body = "Hello " + recipient.getFullName() + ",\n\n"
                + "We received a request to reset your Smart Water Billing password.\n\n"
                + "Click the link below to choose a new password. This link expires in "
                + expiryMinutes + " minutes and can only be used once:\n\n"
                + resetLink + "\n\n"
                + "If you didn't request this, you can safely ignore this email -- your "
                + "password will not be changed.\n\n"
                + "-- Smart Water Billing";

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(recipient.getEmail());
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Password reset email sent to {}", recipient.getEmail());
            return true;
        } catch (Exception ex) {
            // Deliberately broad: an SMTP outage must never surface as a 500 to the user --
            // AuthService falls back to a dev-log/dev-response path when this returns false.
            log.warn("Failed to send password reset email to {}: {}", recipient.getEmail(), ex.getMessage());
            return false;
        }
    }

    private void send(User recipient, String subject, String body, String kind) {
        if (!alertProperties.isEmailEnabled()) {
            log.debug("{} email skipped (app.alert.email-enabled=false): '{}'", kind, subject);
            return;
        }
        if (!StringUtils.hasText(mailHost) || !StringUtils.hasText(mailUsername)) {
            // spring.mail.host still defaults to smtp.gmail.com even with no account
            // configured, so host alone isn't a reliable "is this actually set up" check --
            // require a username too, which has no default (see application.properties).
            log.warn("{} email skipped: SMTP is not fully configured (MAIL_HOST/MAIL_USERNAME/"
                    + "MAIL_PASSWORD env vars not set). Subject would have been: '{}'", kind, subject);
            return;
        }
        if (recipient == null || !StringUtils.hasText(recipient.getEmail())) {
            log.debug("{} email skipped: recipient has no email address.", kind);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(recipient.getEmail());
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("{} email sent to {} : '{}'", kind, recipient.getEmail(), subject);
        } catch (Exception ex) {
            // Deliberately broad: an SMTP outage must never break the scheduler, the
            // billing flow, or the in-app notification that was already saved to the DB.
            log.warn("Failed to send {} email to {} ('{}'): {}", kind, recipient.getEmail(), subject, ex.getMessage());
        }
    }
}
