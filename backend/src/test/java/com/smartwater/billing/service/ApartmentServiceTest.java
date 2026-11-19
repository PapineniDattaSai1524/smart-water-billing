package com.smartwater.billing.service;

import com.smartwater.billing.dto.apartment.ApartmentRequest;
import com.smartwater.billing.dto.apartment.ApartmentResponse;
import com.smartwater.billing.entity.Apartment;
import com.smartwater.billing.exception.DuplicateResourceException;
import com.smartwater.billing.exception.ResourceNotFoundException;
import com.smartwater.billing.mapper.ApartmentMapper;
import com.smartwater.billing.repository.ApartmentRepository;
import com.smartwater.billing.repository.UserRepository;
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
class ApartmentServiceTest {

    @Mock private ApartmentRepository apartmentRepository;
    @Mock private UserRepository userRepository;
    @Mock private ApartmentMapper apartmentMapper;

    @InjectMocks
    private ApartmentService apartmentService;

    private ApartmentRequest request;
    private Apartment apartment;

    @BeforeEach
    void setUp() {
        request = new ApartmentRequest();
        request.setName("Green Valley Residency");
        request.setAddressLine("12 Anna Nagar Main Road");
        request.setCity("Chennai");
        request.setState("Tamil Nadu");
        request.setZipCode("600040");
        request.setTotalUnits(50);

        apartment = Apartment.builder().id(1L).name("Green Valley Residency")
                .addressLine("12 Anna Nagar Main Road").city("Chennai").state("Tamil Nadu")
                .zipCode("600040").totalUnits(50).build();
    }

    @Test
    void create_savesApartment_whenNameIsUnique() {
        when(apartmentRepository.existsByNameIgnoreCase("Green Valley Residency")).thenReturn(false);
        when(apartmentRepository.save(any(Apartment.class))).thenReturn(apartment);
        when(apartmentMapper.toResponse(apartment)).thenReturn(
                ApartmentResponse.builder().id(1L).name("Green Valley Residency").build());

        ApartmentResponse response = apartmentService.create(request, null);

        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getName()).isEqualTo("Green Valley Residency");
        verify(apartmentRepository).save(any(Apartment.class));
    }

    @Test
    void create_throwsDuplicateResourceException_whenNameAlreadyExists() {
        when(apartmentRepository.existsByNameIgnoreCase("Green Valley Residency")).thenReturn(true);

        assertThatThrownBy(() -> apartmentService.create(request, null))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("already exists");

        verify(apartmentRepository, never()).save(any());
    }

    @Test
    void getById_throwsResourceNotFoundException_whenApartmentDoesNotExist() {
        when(apartmentRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> apartmentService.getById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void getById_returnsApartment_whenFound() {
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(apartment));
        when(apartmentMapper.toResponse(apartment)).thenReturn(
                ApartmentResponse.builder().id(1L).name("Green Valley Residency").build());

        ApartmentResponse response = apartmentService.getById(1L);

        assertThat(response.getName()).isEqualTo("Green Valley Residency");
    }

    @Test
    void delete_removesApartment_whenFound() {
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(apartment));

        apartmentService.delete(1L);

        verify(apartmentRepository).delete(apartment);
    }
}
