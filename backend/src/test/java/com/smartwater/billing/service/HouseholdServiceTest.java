package com.smartwater.billing.service;

import com.smartwater.billing.dto.household.HouseholdRequest;
import com.smartwater.billing.dto.household.HouseholdResponse;
import com.smartwater.billing.entity.Apartment;
import com.smartwater.billing.entity.Household;
import com.smartwater.billing.exception.DuplicateResourceException;
import com.smartwater.billing.exception.ResourceNotFoundException;
import com.smartwater.billing.mapper.HouseholdMapper;
import com.smartwater.billing.repository.ApartmentRepository;
import com.smartwater.billing.repository.HouseholdRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HouseholdServiceTest {

    @Mock private HouseholdRepository householdRepository;
    @Mock private ApartmentRepository apartmentRepository;
    @Mock private HouseholdMapper householdMapper;
    @Mock private HouseholdAccessGuard householdAccessGuard;

    @InjectMocks
    private HouseholdService householdService;

    private HouseholdRequest request;
    private Apartment apartment;
    private Household household;

    @BeforeEach
    void setUp() {
        apartment = Apartment.builder().id(1L).name("Green Valley Residency").totalUnits(50).build();

        request = new HouseholdRequest();
        request.setApartmentId(1L);
        request.setUnitNumber("A-101");
        request.setAreaSqft(950.0);
        request.setOccupancyCount(4);
        request.setHasMeter(true);

        household = Household.builder().id(1L).apartment(apartment).unitNumber("A-101")
                .areaSqft(950.0).occupancyCount(4).hasMeter(true).build();
    }

    @Test
    void create_savesHousehold_whenApartmentExistsAndUnitIsUnique() {
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(apartment));
        when(householdRepository.existsByApartmentIdAndUnitNumberIgnoreCase(1L, "A-101")).thenReturn(false);
        when(householdRepository.save(any(Household.class))).thenReturn(household);
        when(householdMapper.toResponse(household)).thenReturn(
                HouseholdResponse.builder().id(1L).unitNumber("A-101").build());

        HouseholdResponse response = householdService.create(request);

        assertThat(response.getUnitNumber()).isEqualTo("A-101");
        verify(householdRepository).save(any(Household.class));
    }

    @Test
    void create_throwsResourceNotFoundException_whenApartmentDoesNotExist() {
        when(apartmentRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> householdService.create(request))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(householdRepository, never()).save(any());
    }

    @Test
    void create_throwsDuplicateResourceException_whenUnitNumberAlreadyExistsInApartment() {
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(apartment));
        when(householdRepository.existsByApartmentIdAndUnitNumberIgnoreCase(1L, "A-101")).thenReturn(true);

        assertThatThrownBy(() -> householdService.create(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("A-101");
    }

    @Test
    void delete_removesHousehold_whenFound() {
        when(householdRepository.findById(1L)).thenReturn(Optional.of(household));

        householdService.delete(1L);

        verify(householdRepository).delete(household);
    }

    @Test
    void getById_returnsHousehold_whenAccessGuardAllowsIt() {
        when(householdRepository.findById(1L)).thenReturn(Optional.of(household));
        when(householdMapper.toResponse(household)).thenReturn(
                HouseholdResponse.builder().id(1L).unitNumber("A-101").build());

        HouseholdResponse response = householdService.getById(1L);

        assertThat(response.getUnitNumber()).isEqualTo("A-101");
        verify(householdAccessGuard).assertCanAccess(household);
    }

    @Test
    void getById_propagatesException_whenAccessGuardDeniesIt() {
        when(householdRepository.findById(1L)).thenReturn(Optional.of(household));
        doThrow(new com.smartwater.billing.exception.UnauthorizedActionException("This household does not belong to you."))
                .when(householdAccessGuard).assertCanAccess(household);

        assertThatThrownBy(() -> householdService.getById(1L))
                .isInstanceOf(com.smartwater.billing.exception.UnauthorizedActionException.class);

        verify(householdMapper, never()).toResponse(any());
    }

    @Test
    void getById_throwsResourceNotFoundException_whenHouseholdDoesNotExist() {
        when(householdRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> householdService.getById(1L))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(householdAccessGuard, never()).assertCanAccess(any());
    }
}
