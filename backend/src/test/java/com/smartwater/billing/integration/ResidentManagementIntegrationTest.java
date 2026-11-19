package com.smartwater.billing.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartwater.billing.dto.apartment.ApartmentRequest;
import com.smartwater.billing.dto.auth.LoginRequest;
import com.smartwater.billing.dto.auth.RegisterRequest;
import com.smartwater.billing.dto.household.HouseholdRequest;
import com.smartwater.billing.dto.resident.ResidentCreateRequest;
import com.smartwater.billing.entity.Role;
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
 * End-to-end coverage for Building Owner -&gt; Resident Management -&gt; Add Resident,
 * matching the TEST 1-9 scenarios from the fix request. @Transactional rolls back
 * every test's data so each one starts clean (see the note on
 * {@link ApartmentHouseholdIntegrationTest}).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ResidentManagementIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String adminAccessToken;
    private long apartmentA101Id;
    private long apartmentA102Id;
    private long hhd001Id;
    private long hhd002Id;
    private long hhd003InA102Id;

    @BeforeEach
    void setUp() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setFullName("Building Owner");
        registerRequest.setEmail("owner@example.com");
        registerRequest.setUsername("buildingowner");
        registerRequest.setPassword("Password@123");
        registerRequest.setPhoneNumber("9876543210");
        registerRequest.setRole(Role.ADMIN);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated());

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("buildingowner", "Password@123"))))
                .andExpect(status().isOk())
                .andReturn();
        adminAccessToken = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .get("data").get("accessToken").asText();

        apartmentA101Id = createApartment("A-101");
        apartmentA102Id = createApartment("A-102");
        hhd001Id = createHousehold(apartmentA101Id, "HHD-001");
        hhd002Id = createHousehold(apartmentA101Id, "HHD-002");
        hhd003InA102Id = createHousehold(apartmentA102Id, "HHD-003");
    }

    private long createApartment(String name) throws Exception {
        ApartmentRequest request = new ApartmentRequest();
        request.setName(name);
        request.setAddressLine("1 Test Street");
        request.setCity("Chennai");
        request.setState("Tamil Nadu");
        request.setZipCode("600001");
        request.setTotalUnits(20);

        MvcResult result = mockMvc.perform(post("/api/v1/apartments")
                        .header("Authorization", "Bearer " + adminAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("data").get("id").asLong();
    }

    private long createHousehold(long apartmentId, String unitNumber) throws Exception {
        HouseholdRequest request = new HouseholdRequest();
        request.setApartmentId(apartmentId);
        request.setUnitNumber(unitNumber);
        request.setAreaSqft(1000.0);
        request.setOccupancyCount(2);
        request.setHasMeter(true);

        MvcResult result = mockMvc.perform(post("/api/v1/households")
                        .header("Authorization", "Bearer " + adminAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("data").get("id").asLong();
    }

    private ResidentCreateRequest residentRequest(long householdId, String fullName, String email) {
        ResidentCreateRequest request = new ResidentCreateRequest();
        request.setHouseholdId(householdId);
        request.setFullName(fullName);
        request.setEmail(email);
        request.setPhoneNumber("9123456780");
        request.setPassword("Password@123");
        request.setEnabled(true);
        return request;
    }

    // TEST 1: Apartment A-101 + Household HHD-001 + Resident Ravi -> SUCCESS
    @Test
    void addResident_succeeds_forFirstResidentOfHousehold() throws Exception {
        mockMvc.perform(post("/api/v1/admin/residents")
                        .header("Authorization", "Bearer " + adminAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(residentRequest(hhd001Id, "Ravi Kumar", "ravi@example.com"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.fullName").value("Ravi Kumar"));
    }

    // TEST 2: same Apartment + same Household HHD-001 + Resident Priya -> 409 CONFLICT,
    // Resident B is NOT created.
    @Test
    void addResident_returns409_whenHouseholdAlreadyAssigned() throws Exception {
        mockMvc.perform(post("/api/v1/admin/residents")
                        .header("Authorization", "Bearer " + adminAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(residentRequest(hhd001Id, "Ravi Kumar", "ravi@example.com"))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/admin/residents")
                        .header("Authorization", "Bearer " + adminAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(residentRequest(hhd001Id, "Priya", "priya@example.com"))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("HHD-001")))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("A-101")));

        // Resident B ("priya@example.com") was not created.
        mockMvc.perform(get("/api/v1/admin/residents")
                        .header("Authorization", "Bearer " + adminAccessToken)
                        .param("search", "priya@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(0));

        // TEST 8: the existing resident (Ravi) is untouched and can still log in.
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("ravi", "Password@123"))))
                .andExpect(status().isOk());
    }

    // TEST 3: different household (HHD-002), same apartment -> SUCCESS
    @Test
    void addResident_succeeds_forDifferentHouseholdSameApartment() throws Exception {
        mockMvc.perform(post("/api/v1/admin/residents")
                        .header("Authorization", "Bearer " + adminAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(residentRequest(hhd001Id, "Ravi Kumar", "ravi@example.com"))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/admin/residents")
                        .header("Authorization", "Bearer " + adminAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(residentRequest(hhd002Id, "Ananya", "ananya@example.com"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.fullName").value("Ananya"));
    }

    // TEST 4: different apartment (A-102, HHD-003) -> SUCCESS, unaffected by A-101/HHD-001.
    @Test
    void addResident_succeeds_forDifferentApartment() throws Exception {
        mockMvc.perform(post("/api/v1/admin/residents")
                        .header("Authorization", "Bearer " + adminAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(residentRequest(hhd001Id, "Ravi Kumar", "ravi@example.com"))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/admin/residents")
                        .header("Authorization", "Bearer " + adminAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(residentRequest(hhd003InA102Id, "Karthik", "karthik@example.com"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.fullName").value("Karthik"));
    }

    // TEST 5: unknown household id -> 404
    @Test
    void addResident_returns404_forUnknownHousehold() throws Exception {
        mockMvc.perform(post("/api/v1/admin/residents")
                        .header("Authorization", "Bearer " + adminAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(residentRequest(999999L, "Nobody", "nobody@example.com"))))
                .andExpect(status().isNotFound());
    }

    // TEST 9: rejecting a duplicate must not disturb a completely unrelated, valid household.
    @Test
    void addResident_duplicateRejection_leavesOtherHouseholdsUnaffected() throws Exception {
        mockMvc.perform(post("/api/v1/admin/residents")
                        .header("Authorization", "Bearer " + adminAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(residentRequest(hhd001Id, "Ravi Kumar", "ravi@example.com"))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/admin/residents")
                        .header("Authorization", "Bearer " + adminAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(residentRequest(hhd001Id, "Priya", "priya@example.com"))))
                .andExpect(status().isConflict());

        // HHD-002 (untouched by the rejected request) still accepts a resident normally.
        mockMvc.perform(post("/api/v1/admin/residents")
                        .header("Authorization", "Bearer " + adminAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(residentRequest(hhd002Id, "Ananya", "ananya@example.com"))))
                .andExpect(status().isCreated());
    }

    // ------------------------------------------------------------------
    // GET /api/v1/admin/residents -- covers the "Unable to load residents" /
    // LOWER(bytea) regression (see V22__fix_bytea_text_column_drift.sql).
    // Every one of these hits the search LOWER(full_name/email/resident_code)
    // path at least once via the default/no-filter call, so a recurrence of the
    // BYTEA drift would fail every test in this section with a 500, not just a
    // dedicated one -- test (i) below adds an explicit non-empty `search` value
    // on every text column as the most direct regression guard.
    // ------------------------------------------------------------------

    // (a) GET returns 200 with the resident in content when one exists.
    @Test
    void listResidents_returns200WithResident_whenResidentExists() throws Exception {
        mockMvc.perform(post("/api/v1/admin/residents")
                        .header("Authorization", "Bearer " + adminAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(residentRequest(hhd001Id, "Ravi Kumar", "ravi@example.com"))))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/admin/residents")
                        .header("Authorization", "Bearer " + adminAccessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.content[0].fullName").value("Ravi Kumar"));
    }

    // (b) GET returns 200 + an empty page when the owner has no residents yet
    // (not "Unable to load residents" -- this is the "no residents yet" case).
    @Test
    void listResidents_returns200WithEmptyPage_whenOwnerHasNoResidents() throws Exception {
        mockMvc.perform(get("/api/v1/admin/residents")
                        .header("Authorization", "Bearer " + adminAccessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(0))
                .andExpect(jsonPath("$.data.content").isEmpty());
    }

    // (c)/(d)/(e)/(i) Search by full name, email, and resident code all exercise the
    // LOWER(full_name)/LOWER(email)/LOWER(resident_code) branches of the query with a
    // real, non-empty `search` term and mixed case -- exactly the query shape that
    // threw "function lower(bytea) does not exist" when any of those columns had
    // drifted to BYTEA.
    @Test
    void listResidents_searchByFullName_matchesCaseInsensitively() throws Exception {
        mockMvc.perform(post("/api/v1/admin/residents")
                        .header("Authorization", "Bearer " + adminAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(residentRequest(hhd001Id, "Ravi Kumar", "ravi@example.com"))))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/admin/residents")
                        .header("Authorization", "Bearer " + adminAccessToken)
                        .param("search", "RAVI ku"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.content[0].fullName").value("Ravi Kumar"));
    }

    @Test
    void listResidents_searchByEmail_matchesCaseInsensitively() throws Exception {
        mockMvc.perform(post("/api/v1/admin/residents")
                        .header("Authorization", "Bearer " + adminAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(residentRequest(hhd001Id, "Ravi Kumar", "ravi@example.com"))))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/admin/residents")
                        .header("Authorization", "Bearer " + adminAccessToken)
                        .param("search", "RAVI@EXAMPLE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1));
    }

    @Test
    void listResidents_searchByResidentCode_matchesCaseInsensitively() throws Exception {
        MvcResult created = mockMvc.perform(post("/api/v1/admin/residents")
                        .header("Authorization", "Bearer " + adminAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(residentRequest(hhd001Id, "Ravi Kumar", "ravi@example.com"))))
                .andExpect(status().isCreated())
                .andReturn();
        String residentCode = objectMapper.readTree(created.getResponse().getContentAsString())
                .get("data").get("residentCode").asText();

        mockMvc.perform(get("/api/v1/admin/residents")
                        .header("Authorization", "Bearer " + adminAccessToken)
                        .param("search", residentCode.toLowerCase()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1));
    }

    // (f) Apartment filter -- only residents in the requested apartment come back.
    @Test
    void listResidents_apartmentFilter_scopesToRequestedApartment() throws Exception {
        mockMvc.perform(post("/api/v1/admin/residents")
                        .header("Authorization", "Bearer " + adminAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(residentRequest(hhd001Id, "Ravi Kumar", "ravi@example.com"))))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/v1/admin/residents")
                        .header("Authorization", "Bearer " + adminAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(residentRequest(hhd003InA102Id, "Karthik", "karthik@example.com"))))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/admin/residents")
                        .header("Authorization", "Bearer " + adminAccessToken)
                        .param("apartmentId", String.valueOf(apartmentA102Id)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.content[0].fullName").value("Karthik"));
    }

    // (g) Enabled/disabled filter.
    @Test
    void listResidents_enabledFilter_scopesToRequestedStatus() throws Exception {
        MvcResult created = mockMvc.perform(post("/api/v1/admin/residents")
                        .header("Authorization", "Bearer " + adminAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(residentRequest(hhd001Id, "Ravi Kumar", "ravi@example.com"))))
                .andExpect(status().isCreated())
                .andReturn();
        long residentId = objectMapper.readTree(created.getResponse().getContentAsString())
                .get("data").get("id").asLong();

        mockMvc.perform(put("/api/v1/admin/residents/" + residentId + "/disable")
                        .header("Authorization", "Bearer " + adminAccessToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/admin/residents")
                        .header("Authorization", "Bearer " + adminAccessToken)
                        .param("enabled", "false"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.content[0].fullName").value("Ravi Kumar"));

        mockMvc.perform(get("/api/v1/admin/residents")
                        .header("Authorization", "Bearer " + adminAccessToken)
                        .param("enabled", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(0));
    }

    // (h) A second Building Owner, with their own apartment/household/resident, must
    // never see the first owner's residents (or vice versa).
    @Test
    void listResidents_buildingOwnerOnlySeesOwnResidents() throws Exception {
        mockMvc.perform(post("/api/v1/admin/residents")
                        .header("Authorization", "Bearer " + adminAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(residentRequest(hhd001Id, "Ravi Kumar", "ravi@example.com"))))
                .andExpect(status().isCreated());

        RegisterRequest secondOwner = new RegisterRequest();
        secondOwner.setFullName("Second Owner");
        secondOwner.setEmail("owner2@example.com");
        secondOwner.setUsername("secondowner");
        secondOwner.setPassword("Password@123");
        secondOwner.setPhoneNumber("9111111111");
        secondOwner.setRole(Role.ADMIN);
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(secondOwner)))
                .andExpect(status().isCreated());

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("secondowner", "Password@123"))))
                .andExpect(status().isOk())
                .andReturn();
        String secondOwnerToken = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .get("data").get("accessToken").asText();

        // Second owner has no apartments/households/residents of their own yet --
        // they must see an empty page, never the first owner's "Ravi Kumar".
        mockMvc.perform(get("/api/v1/admin/residents")
                        .header("Authorization", "Bearer " + secondOwnerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(0));

        // First owner's own list is unaffected by the second owner existing.
        mockMvc.perform(get("/api/v1/admin/residents")
                        .header("Authorization", "Bearer " + adminAccessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.content[0].fullName").value("Ravi Kumar"));
    }
}
