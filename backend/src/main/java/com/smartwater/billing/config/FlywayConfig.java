package com.smartwater.billing.config;

import org.flywaydb.core.Flyway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Makes the app resilient to Flyway "migration checksum mismatch" failures on startup.
 *
 * This happens whenever an already-applied migration file (e.g. V3__..., V15__...) is
 * edited after it has run against a given database - Flyway hashes each migration and
 * refuses to start if the file on disk no longer matches the hash recorded in
 * flyway_schema_history, since replaying an edited script could leave the schema in an
 * inconsistent state.
 *
 * The safest fix is usually to never edit an already-applied migration (add a new
 * V16__... file instead) or to drop/recreate the dev database. But for local/dev
 * environments where migration files get tweaked repeatedly, this strategy calls
 * Flyway's repair() before migrate() so the stored checksums are automatically
 * reconciled with whatever is on disk instead of the app refusing to start.
 *
 * Set app.flyway.auto-repair=false (e.g. in a production profile) to disable this
 * and fall back to strict validation.
 */
@Configuration
public class FlywayConfig {

    private static final Logger log = LoggerFactory.getLogger(FlywayConfig.class);

    @Value("${app.flyway.auto-repair:true}")
    private boolean autoRepair;

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return (Flyway flyway) -> {
            if (autoRepair) {
                var repairResult = flyway.repair();
                if (!repairResult.migrationsRemoved.isEmpty() || !repairResult.migrationsDeleted.isEmpty()
                        || !repairResult.migrationsAligned.isEmpty()) {
                    log.warn("Flyway repair reconciled schema history before migrate: {} aligned, "
                                    + "{} removed, {} deleted. Verify db/migration files reflect the "
                                    + "schema you actually intend - repair rewrites recorded checksums, "
                                    + "it does not re-run migrations.",
                            repairResult.migrationsAligned.size(),
                            repairResult.migrationsRemoved.size(),
                            repairResult.migrationsDeleted.size());
                }
            }
            flyway.migrate();
        };
    }
}
