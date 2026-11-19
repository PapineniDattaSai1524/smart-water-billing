package com.smartwater.billing.service;

import com.smartwater.billing.dto.resident.ResidentAssignmentRequest;
import com.smartwater.billing.dto.resident.ResidentAssignmentResponse;
import com.smartwater.billing.entity.Household;
import com.smartwater.billing.entity.RelationType;
import com.smartwater.billing.entity.ResidentAssignment;
import com.smartwater.billing.entity.User;
import com.smartwater.billing.exception.DuplicateResourceException;
import com.smartwater.billing.exception.InvalidRequestException;
import com.smartwater.billing.exception.ResourceNotFoundException;
import com.smartwater.billing.mapper.ResidentAssignmentMapper;
import com.smartwater.billing.repository.HouseholdRepository;
import com.smartwater.billing.repository.ResidentAssignmentRepository;
import com.smartwater.billing.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ResidentAssignmentServiceTest {

    @Mock private ResidentAssignmentRepository residentAssignmentRepository;
    @Mock private HouseholdRepository householdRepository;
    @Mock private UserRepository userRepository;
    @Mock private ResidentAssignmentMapper residentAssignmentMapper;

    @InjectMocks
    private ResidentAssignmentService residentAssignmentService;

    private ResidentAssignmentRequest request;
    private Household household;
    private User user;
    private ResidentAssignment assignment;

    @BeforeEach
    void setUp() {
        household = Household.builder().id(1L).unitNumber("A-101").build();
        user = User.builder().id(2L).fullName("Ravi Kumar").build();

        request = new ResidentAssignmentRequest();
        request.setHouseholdId(1L);
        request.setUserId(2L);
        request.setRelationType(RelationType.PRIMARY);
        request.setMoveInDate(LocalDate.of(2026, 1, 1));

        assignment = ResidentAssignment.builder().id(1L).household(household).user(user)
                .relationType(RelationType.PRIMARY).moveInDate(LocalDate.of(2026, 1, 1))
                .active(true).build();
    }

    @Test
    void assign_savesAssignment_whenHouseholdAndUserExistAndNoActiveDuplicate() {
        when(householdRepository.findById(1L)).thenReturn(Optional.of(household));
        when(userRepository.findById(2L)).thenReturn(Optional.of(user));
        when(residentAssignmentRepository.existsByHouseholdIdAndUserIdAndActiveTrue(1L, 2L)).thenReturn(false);
        when(residentAssignmentRepository.findByHouseholdIdAndActiveTrue(1L)).thenReturn(List.of());
        when(residentAssignmentRepository.save(any(ResidentAssignment.class))).thenReturn(assignment);
        when(residentAssignmentMapper.toResponse(assignment)).thenReturn(
                ResidentAssignmentResponse.builder().id(1L).householdId(1L).userId(2L).active(true).build());

        ResidentAssignmentResponse response = residentAssignmentService.assign(request);

        assertThat(response.getHouseholdId()).isEqualTo(1L);
        assertThat(response.getUserId()).isEqualTo(2L);
        verify(residentAssignmentRepository).save(any(ResidentAssignment.class));
    }

    @Test
    void assign_throwsResourceNotFoundException_whenHouseholdDoesNotExist() {
        when(householdRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> residentAssignmentService.assign(request))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(residentAssignmentRepository, never()).save(any());
    }

    @Test
    void assign_throwsResourceNotFoundException_whenUserDoesNotExist() {
        when(householdRepository.findById(1L)).thenReturn(Optional.of(household));
        when(userRepository.findById(2L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> residentAssignmentService.assign(request))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(residentAssignmentRepository, never()).save(any());
    }

    @Test
    void assign_throwsDuplicateResourceException_whenResidentAlreadyActivelyAssigned() {
        when(householdRepository.findById(1L)).thenReturn(Optional.of(household));
        when(userRepository.findById(2L)).thenReturn(Optional.of(user));
        when(residentAssignmentRepository.existsByHouseholdIdAndUserIdAndActiveTrue(1L, 2L)).thenReturn(true);

        assertThatThrownBy(() -> residentAssignmentService.assign(request))
                .isInstanceOf(DuplicateResourceException.class);

        verify(residentAssignmentRepository, never()).save(any());
    }

    @Test
    void assign_throwsInvalidRequestException_whenHouseholdAlreadyHasActivePrimaryResident() {
        ResidentAssignment existingPrimary = ResidentAssignment.builder().id(9L).household(household)
                .relationType(RelationType.PRIMARY).active(true).build();

        when(householdRepository.findById(1L)).thenReturn(Optional.of(household));
        when(userRepository.findById(2L)).thenReturn(Optional.of(user));
        when(residentAssignmentRepository.existsByHouseholdIdAndUserIdAndActiveTrue(1L, 2L)).thenReturn(false);
        when(residentAssignmentRepository.findByHouseholdIdAndActiveTrue(1L)).thenReturn(List.of(existingPrimary));

        assertThatThrownBy(() -> residentAssignmentService.assign(request))
                .isInstanceOf(InvalidRequestException.class);

        verify(residentAssignmentRepository, never()).save(any());
    }

    @Test
    void getByHousehold_throwsResourceNotFoundException_whenHouseholdDoesNotExist() {
        when(householdRepository.existsById(1L)).thenReturn(false);

        assertThatThrownBy(() -> residentAssignmentService.getByHousehold(1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deactivate_setsActiveFalse_whenFound() {
        when(residentAssignmentRepository.findById(1L)).thenReturn(Optional.of(assignment));
        when(residentAssignmentRepository.save(any(ResidentAssignment.class))).thenReturn(assignment);

        residentAssignmentService.deactivate(1L);

        assertThat(assignment.isActive()).isFalse();
        verify(residentAssignmentRepository).save(assignment);
    }

    @Test
    void delete_removesAssignment_whenFound() {
        when(residentAssignmentRepository.findById(1L)).thenReturn(Optional.of(assignment));

        residentAssignmentService.delete(1L);

        verify(residentAssignmentRepository).delete(assignment);
    }

    @Test
    void delete_throwsResourceNotFoundException_whenNotFound() {
        when(residentAssignmentRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> residentAssignmentService.delete(1L))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(residentAssignmentRepository, never()).delete(any(ResidentAssignment.class));
    }
}
