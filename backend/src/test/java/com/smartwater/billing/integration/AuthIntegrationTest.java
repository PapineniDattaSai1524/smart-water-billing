package com.smartwater.billing.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartwater.billing.dto.auth.LoginRequest;
import com.smartwater.billing.dto.auth.RegisterRequest;
import com.smartwater.billing.entity.Apartment;
import com.smartwater.billing.entity.Household;
import com.smartwater.billing.entity.Role;
import com.smartwater.billing.repository.ApartmentRepository;
import com.smartwater.billing.repository.HouseholdRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * End-to-end integration test exercising the full Spring context
 * (Security filter chain, JWT, JPA/H2) for the register -> login flow.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ApartmentRepository apartmentRepository;

    @Autowired
    private HouseholdRepository householdRepository;

    /**
     * Seeds a fresh apartment + household (unique unit number per call, since this test
     * class has no @Transactional rollback) and returns the auto-generated, globally
     * unique household_code a RESIDENT must supply at self-registration time.
     */
    private String seedUnclaimedHousehold() {
        Apartment apartment = apartmentRepository.save(Apartment.builder()
                .name("Auth Test Residency " + System.nanoTime())
                .addressLine("1 Test Lane").city("Chennai").state("Tamil Nadu")
                .zipCode("600001").totalUnits(20).build());

        Household household = householdRepository.save(Household.builder()
                .apartment(apartment).unitNumber("U-" + System.nanoTime())
                .areaSqft(900.0).occupancyCount(3).hasMeter(true).build());

        return household.getHouseholdCode();
    }

    private RegisterRequest buildRegisterRequest(String username, String email) {
        RegisterRequest request = buildRegisterRequest(username, email, Role.RESIDENT);
        request.setHouseholdId(seedUnclaimedHousehold());
        return request;
    }

    private RegisterRequest buildRegisterRequest(String username, String email, Role role) {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Test User");
        request.setEmail(email);
        request.setUsername(username);
        request.setPassword("Password@123");
        request.setPhoneNumber("9876543210");
        request.setRole(role);
        return request;
    }

    @Test
    void register_returns201_withValidPayload() throws Exception {
        RegisterRequest request = buildRegisterRequest("johndoe1", "johndoe1@example.com");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.username").value("johndoe1"))
                .andExpect(jsonPath("$.data.role").value("RESIDENT"));
    }

    @Test
    void register_returns400_whenPasswordDoesNotMeetComplexityRules() throws Exception {
        RegisterRequest request = buildRegisterRequest("weakpassuser", "weakpass@example.com");
        request.setPassword("weak");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void register_returns409_whenUsernameAlreadyTaken() throws Exception {
        RegisterRequest request = buildRegisterRequest("duplicateuser", "duplicateuser@example.com");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        RegisterRequest secondRequest = buildRegisterRequest("duplicateuser", "different@example.com");
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(secondRequest)))
                .andExpect(status().isConflict());
    }

    @Test
    void loginThenAccessProtectedEndpoint_succeeds_withValidCredentials() throws Exception {
        // Uses ADMIN here (not the RESIDENT default) purely to avoid needing to seed a
        // household -- ADMIN and a RESIDENT with a valid Household ID (see
        // residentWithValidHousehold_isEnabledImmediately_andCanLoginRightAway below) are
        // both enabled/APPROVED immediately, so either exercises the register -> login ->
        // JWT flow identically. ADMIN is just less setup for a test whose purpose is the
        // flow itself, not the household-linking behavior.
        RegisterRequest registerRequest = buildRegisterRequest("loginflowadmin", "loginflowadmin@example.com", Role.ADMIN);
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated());

        LoginRequest loginRequest = new LoginRequest("loginflowadmin", "Password@123");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.data.username").value("loginflowadmin"));
    }

    @Test
    void residentWithValidHousehold_isEnabledImmediately_andCanLoginRightAway() throws Exception {
        // Self-registering with a valid, unclaimed Household ID resolves and links the
        // household synchronously (see AuthService#register), so unlike the older
        // no-household pending-approval flow, no separate Building Owner approval step
        // is needed -- the resident is enabled and can log in immediately.
        RegisterRequest registerRequest = buildRegisterRequest("readyresident1", "readyresident1@example.com");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.enabled").value(true));

        LoginRequest loginRequest = new LoginRequest("readyresident1", "Password@123");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.username").value("readyresident1"));
    }

    @Test
    void residentRegistration_rejectsMissingOrUnknownHouseholdId() throws Exception {
        RegisterRequest missingHousehold = buildRegisterRequest("nohouseholduser", "nohousehold@example.com", Role.RESIDENT);
        // buildRegisterRequest(username, email, role) does NOT auto-seed a household --
        // only the 2-arg overload does -- so householdId is left null here on purpose.

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(missingHousehold)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));

        RegisterRequest invalidHousehold = buildRegisterRequest("badhouseholduser", "badhousehold@example.com", Role.RESIDENT);
        invalidHousehold.setHouseholdId("HH-DOES-NOT-EXIST");

        // An unrecognized (as opposed to blank/missing) Household ID is a "resource not
        // found" case in AuthService#resolveHouseholdForRegistration, so it 404s rather
        // than 400s.
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidHousehold)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void login_returns401_withInvalidCredentials() throws Exception {
        LoginRequest loginRequest = new LoginRequest("nonexistentuser", "WrongPassword@123");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());
    }
}
