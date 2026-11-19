package com.smartwater.billing.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartwater.billing.dto.apartment.ApartmentRequest;
import com.smartwater.billing.dto.auth.LoginRequest;
import com.smartwater.billing.dto.auth.RegisterRequest;
import com.smartwater.billing.dto.household.HouseholdRequest;
import com.smartwater.billing.entity.Role;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Full end-to-end flow: register an ADMIN, log in, create an apartment,
 * then create a household under it - verifying JWT-protected, role-guarded
 * endpoints work together correctly.
 *
 * @Transactional: the H2 test datasource (DB_CLOSE_DELAY=-1) and the
 * Spring context are shared across every @Test method in this class, and
 * @BeforeEach re-registers the same hardcoded "apartmentadmin" user before
 * each test. Without a per-test rollback, the 2nd/3rd tests' registration
 * fails with 409 Conflict because the user already exists from the 1st
 * test. @Transactional makes Spring Test wrap each test (and its preceding
 * @BeforeEach) in a transaction that is rolled back afterward, so every
 * test starts from a clean database.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ApartmentHouseholdIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String adminAccessToken;

    @BeforeEach
    void registerAndLoginAdmin() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setFullName("Apartment Admin");
        registerRequest.setEmail("apartmentadmin@example.com");
        registerRequest.setUsername("apartmentadmin");
        registerRequest.setPassword("Password@123");
        registerRequest.setPhoneNumber("9876543210");
        registerRequest.setRole(Role.ADMIN);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated());

        LoginRequest loginRequest = new LoginRequest("apartmentadmin", "Password@123");
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode json = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        adminAccessToken = json.get("data").get("accessToken").asText();
    }

    @Test
    void createApartment_thenCreateHouseholdUnderIt_succeeds() throws Exception {
        ApartmentRequest apartmentRequest = new ApartmentRequest();
        apartmentRequest.setName("Lakeview Towers");
        apartmentRequest.setAddressLine("45 Lake Road");
        apartmentRequest.setCity("Chennai");
        apartmentRequest.setState("Tamil Nadu");
        apartmentRequest.setZipCode("600028");
        apartmentRequest.setTotalUnits(30);

        MvcResult apartmentResult = mockMvc.perform(post("/api/v1/apartments")
                        .header("Authorization", "Bearer " + adminAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(apartmentRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("Lakeview Towers"))
                .andReturn();

        JsonNode apartmentJson = objectMapper.readTree(apartmentResult.getResponse().getContentAsString());
        long apartmentId = apartmentJson.get("data").get("id").asLong();

        HouseholdRequest householdRequest = new HouseholdRequest();
        householdRequest.setApartmentId(apartmentId);
        householdRequest.setUnitNumber("B-202");
        householdRequest.setAreaSqft(1100.0);
        householdRequest.setOccupancyCount(3);
        householdRequest.setHasMeter(true);

        mockMvc.perform(post("/api/v1/households")
                        .header("Authorization", "Bearer " + adminAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(householdRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.unitNumber").value("B-202"))
                .andExpect(jsonPath("$.data.apartmentId").value(apartmentId));
    }

    @Test
    void createApartment_withoutToken_returns401() throws Exception {
        ApartmentRequest apartmentRequest = new ApartmentRequest();
        apartmentRequest.setName("Unauthorized Towers");
        apartmentRequest.setAddressLine("1 No Access St");
        apartmentRequest.setCity("Chennai");
        apartmentRequest.setState("Tamil Nadu");
        apartmentRequest.setZipCode("600001");
        apartmentRequest.setTotalUnits(10);

        mockMvc.perform(post("/api/v1/apartments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(apartmentRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getAllApartments_isAccessible_toAnyAuthenticatedUser() throws Exception {
        mockMvc.perform(get("/api/v1/apartments")
                        .header("Authorization", "Bearer " + adminAccessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
