package com.smartwater.billing.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Security guardrail: application.properties externalizes app.jwt.secret via
 * ${JWT_SECRET:...}, but the fallback value after the colon is a fixed string
 * committed to source control (see JwtService). That default is safe for the
 * 'dev' profile (local runs, demo data, this take-home project) but must never
 * reach a production deployment, since anyone with read access to the repo
 * could forge valid JWTs for any role.
 *
 * This validator only runs under the 'prod' profile (spring.profiles.active=prod)
 * and refuses to finish starting up if JWT_SECRET was left unset -- i.e. the
 * signing key still equals the known, public default. It does nothing under
 * 'dev', so local/demo behavior is unchanged.
 */
@Component
@Profile("prod")
public class JwtSecretStartupValidator {

    /** Must match the literal fallback in application.properties' ${JWT_SECRET:...}. */
    private static final String INSECURE_DEFAULT_SECRET =
            "404E635266546A576E5A7234753778214125442A472D4B6150645367566B59";

    @Value("${app.jwt.secret}")
    private String secret;

    @EventListener(ApplicationReadyEvent.class)
    public void validateSecretIsOverridden() {
        if (INSECURE_DEFAULT_SECRET.equals(secret)) {
            throw new IllegalStateException(
                    "Refusing to start with spring.profiles.active=prod: JWT_SECRET is unset, so the "
                            + "application is signing tokens with the default development secret that is "
                            + "committed to source control. Set the JWT_SECRET environment variable to a "
                            + "unique, high-entropy value before deploying to production.");
        }
        if (secret == null || secret.getBytes().length < 32) {
            throw new IllegalStateException(
                    "Refusing to start with spring.profiles.active=prod: JWT_SECRET must be at least 32 "
                            + "bytes (HS256 requires a >=256-bit key).");
        }
    }
}
