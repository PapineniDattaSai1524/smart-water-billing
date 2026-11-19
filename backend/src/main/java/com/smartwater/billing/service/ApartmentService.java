package com.smartwater.billing.service;

import com.smartwater.billing.dto.apartment.ApartmentRequest;
import com.smartwater.billing.dto.apartment.ApartmentResponse;
import com.smartwater.billing.entity.Apartment;
import com.smartwater.billing.entity.Role;
import com.smartwater.billing.entity.User;
import com.smartwater.billing.exception.DuplicateResourceException;
import com.smartwater.billing.exception.InvalidRequestException;
import com.smartwater.billing.exception.ResourceNotFoundException;
import com.smartwater.billing.mapper.ApartmentMapper;
import com.smartwater.billing.repository.ApartmentRepository;
import com.smartwater.billing.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ApartmentService {

    private final ApartmentRepository apartmentRepository;
    private final UserRepository userRepository;
    private final ApartmentMapper apartmentMapper;

    @Transactional
    public ApartmentResponse create(ApartmentRequest request, Long currentAdminId) {
        if (apartmentRepository.existsByNameIgnoreCase(request.getName())) {
            throw new DuplicateResourceException("An apartment named '" + request.getName() + "' already exists");
        }

        Apartment apartment = Apartment.builder()
                .name(request.getName())
                .addressLine(request.getAddressLine())
                .city(request.getCity())
                .state(request.getState())
                .zipCode(request.getZipCode())
                .totalUnits(request.getTotalUnits())
                .build();

        // The Building Owner creating this apartment is its manager by default. An explicit
        // adminId in the request (e.g. a platform-level reassignment) overrides that default.
        if (request.getAdminId() != null) {
            apartment.setAdmin(resolveAdmin(request.getAdminId()));
        } else if (currentAdminId != null) {
            apartment.setAdmin(resolveAdmin(currentAdminId));
        }

        return apartmentMapper.toResponse(apartmentRepository.save(apartment));
    }

    @Transactional(readOnly = true)
    public ApartmentResponse getById(Long id) {
        return apartmentMapper.toResponse(findOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<ApartmentResponse> getAll() {
        return apartmentRepository.findAll().stream()
                .map(apartmentMapper::toResponse)
                .toList();
    }

    @Transactional
    public ApartmentResponse update(Long id, ApartmentRequest request) {
        Apartment apartment = findOrThrow(id);

        if (!apartment.getName().equalsIgnoreCase(request.getName())
                && apartmentRepository.existsByNameIgnoreCase(request.getName())) {
            throw new DuplicateResourceException("An apartment named '" + request.getName() + "' already exists");
        }

        apartment.setName(request.getName());
        apartment.setAddressLine(request.getAddressLine());
        apartment.setCity(request.getCity());
        apartment.setState(request.getState());
        apartment.setZipCode(request.getZipCode());
        apartment.setTotalUnits(request.getTotalUnits());

        if (request.getAdminId() != null) {
            apartment.setAdmin(resolveAdmin(request.getAdminId()));
        }

        return apartmentMapper.toResponse(apartmentRepository.save(apartment));
    }

    @Transactional
    public void delete(Long id) {
        Apartment apartment = findOrThrow(id);
        apartmentRepository.delete(apartment);
    }

    private Apartment findOrThrow(Long id) {
        return apartmentRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Apartment", id));
    }

    private User resolveAdmin(Long adminId) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> ResourceNotFoundException.of("User", adminId));
        if (admin.getRole() != Role.ADMIN) {
            throw new InvalidRequestException("Assigned admin must have the ADMIN role");
        }
        return admin;
    }
}
