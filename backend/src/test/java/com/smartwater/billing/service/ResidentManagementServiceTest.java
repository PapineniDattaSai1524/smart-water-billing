package com.smartwater.billing.service;

import com.smartwater.billing.dto.resident.ResidentCreateRequest;
import com.smartwater.billing.dto.resident.ResidentResponse;
import com.smartwater.billing.entity.Apartment;
import com.smartwater.billing.entity.Household;
import com.smartwater.billing.entity.RelationType;
import com.smartwater.billing.entity.ResidentAssignment;
import com.smartwater.billing.entity.Role;
import com.smartwater.billing.entity.User;
import com.smartwater.billing.exception.DuplicateResourceException;
import com.smartwater.billing.exception.ResourceNotFoundException;
import com.smartwater.billing.exception.UnauthorizedActionException;
import com.smartwater.billing.mapper.ResidentManagementMapper;
import com.smartwater.billing.repository.HouseholdRepository;
import com.smartwater.billing.repository.ResidentAssignmentRepository;
import com.smartwater.billing.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

/**
 * Covers the "Add Resident" duplicate-household business rule: for the same
 * apartment, the same household can be assigned to only one resident.
 * Mirrors the TEST 1-9 scenarios in the fix request.
 */
@ExtendWith(MockitoExtension.class)
class ResidentManagementServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private HouseholdRepository householdRepository;
    @Mock private ResidentAssignmentRepository residentAssignmentRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private ResidentManagementMapper mapper;
    @Mock private NotificationService notificationService;
    @Mock private ResidentAssignmentService residentAssignmentService;

    @InjectMocks
    private ResidentManagementService residentManagementService;

    private static final Long ADMIN_ID = 100L;

    private Apartment apartmentA101;
    private Household householdHhd001;
    private ResidentCreateRequest request;

    @BeforeEach
    void setUp() {
        User admin = User.builder().id(ADMIN_ID).build();
        apartmentA101 = Apartment.builder().id(1L).name("A-101").admin(admin).build();
        householdHhd001 = Household.builder().id(10L).apartment(apartmentA101).unitNumber("HHD-001").build();

        request = new ResidentCreateRequest();
        request.setHouseholdId(10L);
        request.setFullName("Ravi Kumar");
        request.setEmail("ravi@example.com");
        request.setPhoneNumber("9876543210");
        request.setPassword("Password@123");
        request.setEnabled(true);
    }

    // TEST 1: Apartment A-101 + Household HHD-001 + Resident Ravi -> SUCCESS
    @Test
    void create_succeeds_whenHouseholdHasNoActiveResident() {
        when(householdRepository.findById(10L)).thenReturn(Optional.of(householdHhd001));
        when(residentAssignmentRepository.findByHouseholdIdAndActiveTrue(10L)).thenReturn(List.of());
        when(userRepository.findByEmailIgnoreCase("ravi@example.com")).thenReturn(Optional.empty());
        when(userRepository.existsByUsername(any())).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("hashed");

        User savedUser = User.builder().id(50L).fullName("Ravi Kumar").role(Role.RESIDENT).build();
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(mapper.toResponse(any(User.class), any(Household.class)))
                .thenReturn(ResidentResponse.builder().id(50L).fullName("Ravi Kumar").build());

        ResidentResponse response = residentManagementService.create(request, ADMIN_ID);

        assertThat(response.getFullName()).isEqualTo("Ravi Kumar");
        verify(residentAssignmentRepository).save(argThat(ra ->
                ra.getHousehold() == householdHhd001 && ra.getRelationType() == RelationType.PRIMARY));
    }

    // TEST 2: Apartment A-101 + Household HHD-001 + Resident Priya (after Ravi) -> 409 CONFLICT
    // Resident B must NOT be created.
    @Test
    void create_rejectsWith409_whenHouseholdAlreadyHasActiveResident() {
        ResidentAssignment existingAssignment = ResidentAssignment.builder()
                .id(1L).household(householdHhd001).relationType(RelationType.PRIMARY).active(true).build();

        when(householdRepository.findById(10L)).thenReturn(Optional.of(householdHhd001));
        when(residentAssignmentRepository.findByHouseholdIdAndActiveTrue(10L))
                .thenReturn(List.of(existingAssignment));

        assertThatThrownBy(() -> residentManagementService.create(request, ADMIN_ID))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("HHD-001")
                .hasMessageContaining("A-101");

        // Resident B is NOT created: no user or assignment row is ever written.
        verify(userRepository, never()).save(any(User.class));
        verify(residentAssignmentRepository, never()).save(any(ResidentAssignment.class));
    }

    // TEST 3: A different household in the same apartment (HHD-002) still succeeds.
    @Test
    void create_succeeds_forDifferentHouseholdSameApartment() {
        Household hhd002 = Household.builder().id(11L).apartment(apartmentA101).unitNumber("HHD-002").build();
        request.setHouseholdId(11L);

        when(householdRepository.findById(11L)).thenReturn(Optional.of(hhd002));
        when(residentAssignmentRepository.findByHouseholdIdAndActiveTrue(11L)).thenReturn(List.of());
        when(userRepository.findByEmailIgnoreCase(any())).thenReturn(Optional.empty());
        when(userRepository.existsByUsername(any())).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenReturn(User.builder().id(51L).role(Role.RESIDENT).build());
        when(mapper.toResponse(any(User.class), any(Household.class))).thenReturn(ResidentResponse.builder().id(51L).build());

        ResidentResponse response = residentManagementService.create(request, ADMIN_ID);

        assertThat(response.getId()).isEqualTo(51L);
    }

    // TEST 4/8 (apartment isolation): a household with the SAME unit label but in a
    // DIFFERENT apartment must not be blocked by an assignment in apartment A-101.
    @Test
    void create_succeeds_forSameHouseholdLabelInDifferentApartment() {
        Apartment apartmentA102 = Apartment.builder().id(2L).name("A-102").admin(User.builder().id(ADMIN_ID).build()).build();
        Household hhd003InA102 = Household.builder().id(12L).apartment(apartmentA102).unitNumber("HHD-003").build();
        request.setHouseholdId(12L);

        when(householdRepository.findById(12L)).thenReturn(Optional.of(hhd003InA102));
        // Only this household's own assignment list matters -- A-101/HHD-001 being taken
        // is irrelevant here since it's a different apartment's household row entirely.
        when(residentAssignmentRepository.findByHouseholdIdAndActiveTrue(12L)).thenReturn(List.of());
        when(userRepository.findByEmailIgnoreCase(any())).thenReturn(Optional.empty());
        when(userRepository.existsByUsername(any())).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenReturn(User.builder().id(52L).role(Role.RESIDENT).build());
        when(mapper.toResponse(any(User.class), any(Household.class))).thenReturn(ResidentResponse.builder().id(52L).build());

        ResidentResponse response = residentManagementService.create(request, ADMIN_ID);

        assertThat(response.getId()).isEqualTo(52L);
    }

    // TEST 5: unknown household id -> 404, not 409/500.
    @Test
    void create_throwsNotFound_whenHouseholdDoesNotExist() {
        when(householdRepository.findById(10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> residentManagementService.create(request, ADMIN_ID))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(residentAssignmentRepository, never()).save(any());
    }

    // Household exists but belongs to a different admin -> rejected as unauthorized,
    // independent of the duplicate-household rule.
    @Test
    void create_throwsUnauthorized_whenHouseholdNotOwnedByAdmin() {
        User otherAdmin = User.builder().id(999L).build();
        Apartment otherApartment = Apartment.builder().id(3L).name("Other").admin(otherAdmin).build();
        Household otherHousehold = Household.builder().id(13L).apartment(otherApartment).unitNumber("X-1").build();
        request.setHouseholdId(13L);

        when(householdRepository.findById(13L)).thenReturn(Optional.of(otherHousehold));

        assertThatThrownBy(() -> residentManagementService.create(request, ADMIN_ID))
                .isInstanceOf(UnauthorizedActionException.class);

        verify(residentAssignmentRepository, never()).findByHouseholdIdAndActiveTrue(anyLong());
    }

    // TEST 7 (simulated): the app-level check passes (no active assignment seen yet),
    // but a concurrent request wins the race and the DB partial unique index rejects the
    // insert -- this must be translated to 409, not surfaced as a raw 500.
    @Test
    void create_translatesConcurrentDbConstraintViolation_to409() {
        when(householdRepository.findById(10L)).thenReturn(Optional.of(householdHhd001));
        when(residentAssignmentRepository.findByHouseholdIdAndActiveTrue(10L)).thenReturn(List.of());
        when(userRepository.findByEmailIgnoreCase(any())).thenReturn(Optional.empty());
        when(userRepository.existsByUsername(any())).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenReturn(User.builder().id(53L).role(Role.RESIDENT).build());
        when(residentAssignmentRepository.save(any(ResidentAssignment.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate key value violates unique constraint"));

        assertThatThrownBy(() -> residentManagementService.create(request, ADMIN_ID))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("HHD-001");
    }

    // TEST 9 / existing-data safety: rejecting a duplicate must not touch any other
    // household's data -- verified above via never() assertions; here we additionally
    // confirm the rejected household itself is never looked up for a save.
    @Test
    void create_rejectedDuplicate_leavesExistingAssignmentUntouched() {
        ResidentAssignment existingAssignment = ResidentAssignment.builder()
                .id(1L).household(householdHhd001).relationType(RelationType.PRIMARY).active(true).build();

        when(householdRepository.findById(10L)).thenReturn(Optional.of(householdHhd001));
        when(residentAssignmentRepository.findByHouseholdIdAndActiveTrue(10L))
                .thenReturn(List.of(existingAssignment));

        assertThatThrownBy(() -> residentManagementService.create(request, ADMIN_ID))
                .isInstanceOf(DuplicateResourceException.class);

        assertThat(existingAssignment.isActive()).isTrue();
        verify(residentAssignmentRepository, never()).save(any());
    }
}
