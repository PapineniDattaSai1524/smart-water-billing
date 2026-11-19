package com.smartwater.billing.migration;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Regression coverage for "GET /api/v1/admin/residents" -> 500
 * "ERROR: function lower(bytea) does not exist", fixed by
 * V22__fix_bytea_text_column_drift.sql.
 * <p>
 * {@code ResidentManagementIntegrationTest} runs on H2 with
 * {@code spring.flyway.enabled=false} and {@code ddl-auto=create-drop}, so its schema is
 * generated straight from the {@code User} JPA entity ({@code java.lang.String} fields ->
 * always a correct VARCHAR/CHARACTER column). It never reads or executes a single Flyway
 * SQL file, so it cannot detect a BYTEA-drifted column in the real migration history --
 * not "doesn't currently", but structurally cannot, no matter what V22 (or any future
 * migration) does or doesn't do. Every test in that class would pass identically if V22
 * were deleted, broken, or if the real target database's {@code users.full_name} were
 * BYTEA right now.
 * <p>
 * This test runs the actual {@code db/migration} SQL files, unmodified, against a real
 * PostgreSQL 16 container (matching the {@code postgres:16-alpine} image used in
 * docker-compose.yml), and is the one that can actually catch this bug class.
 */
@Testcontainers
class ResidentSearchBinaryDriftMigrationIT {

    @Container
    static final PostgreSQLContainer<?> POSTGRES =
            new PostgreSQLContainer<>("postgres:16-alpine");

    private static final AtomicInteger DB_COUNTER = new AtomicInteger();

    /** The exact predicate shape used by UserRepository#searchResidentsForAdmin. */
    private static final String RESIDENT_SEARCH_PREDICATE = """
            SELECT id, full_name, email, resident_code FROM users
            WHERE lower(full_name) LIKE lower(?)
               OR lower(email) LIKE lower(?)
               OR lower(resident_code) LIKE lower(?)
            """;

    /** Creates a fresh, isolated database inside the shared container and returns its JDBC URL. */
    private String freshDatabase() throws Exception {
        String dbName = "regression_" + DB_COUNTER.incrementAndGet();
        try (Connection admin = DriverManager.getConnection(
                POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword());
             Statement st = admin.createStatement()) {
            st.execute("CREATE DATABASE " + dbName);
        }
        return "jdbc:postgresql://" + POSTGRES.getHost() + ":" + POSTGRES.getMappedPort(5432) + "/" + dbName;
    }

    private Flyway flywayFor(String jdbcUrl) {
        return flywayFor(jdbcUrl, org.flywaydb.core.api.MigrationVersion.LATEST);
    }

    /**
     * target() lives on FluentConfiguration and must be set before load() is called --
     * Flyway itself (the object load() returns) has no target(...) method, so this has to
     * be its own overload rather than a call chained onto flywayFor(String).
     */
    private Flyway flywayFor(String jdbcUrl, org.flywaydb.core.api.MigrationVersion target) {
        return Flyway.configure()
                .dataSource(jdbcUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration")
                .target(target)
                .load();
    }

    /**
     * Baseline: a clean migrate to the current latest version must leave the resident-search
     * text columns as real text columns, and the exact search predicate the repository issues
     * must run without error.
     */
    @Test
    void cleanMigration_keepsResidentSearchColumnsAsText_andSearchQuerySucceeds() throws Exception {
        String url = freshDatabase();
        flywayFor(url).migrate();

        try (Connection conn = DriverManager.getConnection(url, POSTGRES.getUsername(), POSTGRES.getPassword())) {
            Map<String, String> types = columnTypes(conn);
            assertThat(types.get("full_name")).isEqualTo("character varying");
            assertThat(types.get("email")).isEqualTo("character varying");
            assertThat(types.get("resident_code")).isEqualTo("character varying");

            assertQueryRunsWithoutError(conn);
        }
    }

    /**
     * Reproduces the real-world failure mode: an existing database whose text columns had
     * already drifted to BYTEA (V1-V21 applied, then something outside Flyway corrupted the
     * column types) before V22 ships. Migrating that database up to the latest version must
     * heal the columns back to text, preserve the data exactly, and the search predicate must
     * run cleanly afterward -- proving the fix that GET /api/v1/admin/residents depends on.
     */
    @Test
    void driftedBinaryColumns_areHealedOnUpgrade_dataPreserved_andSearchQuerySucceeds() throws Exception {
        String url = freshDatabase();

        // Bring the DB up to the state it would have been in right before V22 shipped.
        flywayFor(url, org.flywaydb.core.api.MigrationVersion.fromVersion("21")).migrate();

        try (Connection conn = DriverManager.getConnection(url, POSTGRES.getUsername(), POSTGRES.getPassword())) {
            try (Statement st = conn.createStatement()) {
                st.execute("""
                        INSERT INTO users (full_name, email, username, password, role, resident_code)
                        VALUES ('Ravi Kumar', 'ravi@example.com', 'ravikumar', 'hash', 'RESIDENT', 'RES-000123')
                        """);
                // Simulate the reported drift on every column the search touches with LOWER().
                st.execute("ALTER TABLE users ALTER COLUMN full_name TYPE BYTEA USING convert_to(full_name, 'UTF8')");
                st.execute("ALTER TABLE users ALTER COLUMN email TYPE BYTEA USING convert_to(email, 'UTF8')");
                st.execute("ALTER TABLE users ALTER COLUMN resident_code TYPE BYTEA USING convert_to(resident_code, 'UTF8')");
            }

            // Confirm the exact reported error reproduces pre-fix, so this test would actually
            // have failed before V22 existed (a regression test that can't fail isn't one).
            org.junit.jupiter.api.Assertions.assertThrows(
                    java.sql.SQLException.class,
                    () -> assertQueryRunsWithoutError(conn),
                    "expected lower(bytea) to fail before the healing migration runs");
        }

        // Ship the rest of the migrations, including V22.
        flywayFor(url).migrate();

        try (Connection conn = DriverManager.getConnection(url, POSTGRES.getUsername(), POSTGRES.getPassword())) {
            Map<String, String> types = columnTypes(conn);
            assertThat(types.get("full_name")).isEqualTo("character varying");
            assertThat(types.get("email")).isEqualTo("character varying");
            assertThat(types.get("resident_code")).isEqualTo("character varying");

            assertQueryRunsWithoutError(conn);

            try (Statement st = conn.createStatement();
                 ResultSet rs = st.executeQuery(
                         "SELECT full_name, email, resident_code FROM users WHERE username = 'ravikumar'")) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getString("full_name")).isEqualTo("Ravi Kumar");
                assertThat(rs.getString("email")).isEqualTo("ravi@example.com");
                assertThat(rs.getString("resident_code")).isEqualTo("RES-000123");
            }
        }
    }

    private Map<String, String> columnTypes(Connection conn) throws Exception {
        Map<String, String> types = new java.util.HashMap<>();
        try (Statement st = conn.createStatement();
             ResultSet rs = st.executeQuery("""
                     SELECT column_name, data_type FROM information_schema.columns
                     WHERE table_name = 'users'
                       AND column_name IN ('full_name', 'email', 'username', 'resident_code')
                     """)) {
            while (rs.next()) {
                types.put(rs.getString("column_name"), rs.getString("data_type"));
            }
        }
        return types;
    }

    private void assertQueryRunsWithoutError(Connection conn) throws java.sql.SQLException {
        try (var ps = conn.prepareStatement(RESIDENT_SEARCH_PREDICATE)) {
            ps.setString(1, "%ravi%");
            ps.setString(2, "%ravi%");
            ps.setString(3, "%res%");
            ps.executeQuery().close();
        }
    }
}
