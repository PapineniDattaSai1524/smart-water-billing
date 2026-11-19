package com.smartwater.billing.exception;

import com.smartwater.billing.dto.common.ApiError;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.springframework.dao.InvalidDataAccessResourceUsageException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Regression coverage for the "raw JDBC/SQL exception rendered verbatim in the Resident
 * Accounts UI" bug: GET /api/v1/admin/residents previously surfaced
 * "ERROR: function lower(bytea) does not exist ... Position: 707" straight from the
 * PostgreSQL driver into the API response body, because the old handler did
 * "An unexpected error occurred: " + ex.getMessage() for every uncaught exception,
 * including database ones.
 */
class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void databaseException_doesNotLeakRawSqlTextToClient() {
        HttpServletRequest req = mock(HttpServletRequest.class);
        when(req.getRequestURI()).thenReturn("/api/v1/admin/residents");
        when(req.getMethod()).thenReturn("GET");

        // The exact shape of the reported failure: a Spring DataAccessException wrapping the
        // PostgreSQL driver's own message, which contains the raw SQL/column/position detail.
        InvalidDataAccessResourceUsageException dbEx = new InvalidDataAccessResourceUsageException(
                "JDBC exception executing SQL [select ... lower(u1_0.full_name) ...]; "
                        + "ERROR: function lower(bytea) does not exist\n"
                        + "  Hint: No function matches the given name and argument types.\n"
                        + "  Position: 707");

        ResponseEntity<ApiError> response = handler.handleDataAccess(dbEx, req);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        String clientMessage = response.getBody().getMessage();
        assertThat(clientMessage).doesNotContain("lower(bytea)");
        assertThat(clientMessage).doesNotContainIgnoringCase("sql");
        assertThat(clientMessage).doesNotContainIgnoringCase("jdbc");
        assertThat(clientMessage).doesNotContain("Position: 707");
    }

    @Test
    void genericUnexpectedException_doesNotLeakExceptionMessageToClient() {
        HttpServletRequest req = mock(HttpServletRequest.class);
        when(req.getRequestURI()).thenReturn("/api/v1/admin/residents");
        when(req.getMethod()).thenReturn("GET");

        RuntimeException ex = new RuntimeException(
                "some internal detail that must never reach the browser: connection string, stack frame, etc.");

        ResponseEntity<ApiError> response = handler.handleGeneric(ex, req);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody().getMessage())
                .isEqualTo("An unexpected error occurred. Please try again later.");
    }
}
