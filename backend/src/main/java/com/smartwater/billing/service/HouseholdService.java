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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HouseholdService {

    private final HouseholdRepository householdRepository;
    private final ApartmentRepository apartmentRepository;
    private final HouseholdMapper householdMapper;
    // Security fix (IDOR): getById previously returned any household to any
    // authenticated caller. getAll/getByApartment are now ADMIN/SUPER_ADMIN-only
    // at the controller (see HouseholdController); getById is still reachable by
    // RESIDENT for their own household, so it needs the same per-row check.
    private final HouseholdAccessGuard householdAccessGuard;

    @Transactional
    public HouseholdResponse create(HouseholdRequest request) {
        Apartment apartment = apartmentRepository.findById(request.getApartmentId())
                .orElseThrow(() -> ResourceNotFoundException.of("Apartment", request.getApartmentId()));

        if (householdRepository.existsByApartmentIdAndUnitNumberIgnoreCase(
                request.getApartmentId(), request.getUnitNumber())) {
            throw new DuplicateResourceException(
                    "Unit '" + request.getUnitNumber() + "' already exists in this apartment");
        }

        Household household = Household.builder()
                .apartment(apartment)
                .unitNumber(request.getUnitNumber())
                .areaSqft(request.getAreaSqft())
                .occupancyCount(request.getOccupancyCount())
                .hasMeter(request.isHasMeter())
                .build();

        return householdMapper.toResponse(householdRepository.save(household));
    }

    @Transactional(readOnly = true)
    public HouseholdResponse getById(Long id) {
        Household household = findOrThrow(id);
        householdAccessGuard.assertCanAccess(household);
        return householdMapper.toResponse(household);
    }

    @Transactional(readOnly = true)
    public List<HouseholdResponse> getAll() {
        return householdRepository.findAll().stream().map(householdMapper::toResponse).toList();
    }

    // Building Owner Water Usage dashboard: households scoped to the current admin only
    // (across every apartment/building they own) -- reuses the same repository query the
    // Water Analytics endpoint already relies on for its household roster, so the two stay
    // consistent. Deliberately separate from getAll(), which is staff-wide (ADMIN/SUPER_ADMIN)
    // and intentionally unscoped for platform administration screens.
    @Transactional(readOnly = true)
    public List<HouseholdResponse> getMine(Long adminId) {
        return householdRepository.findByApartmentAdminIdOrderByUnitNumberAsc(adminId).stream()
                .map(householdMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<HouseholdResponse> getByApartment(Long apartmentId) {
        if (!apartmentRepository.existsById(apartmentId)) {
            throw ResourceNotFoundException.of("Apartment", apartmentId);
        }
        return householdRepository.findByApartmentId(apartmentId).stream()
                .map(householdMapper::toResponse)
                .toList();
    }

    @Transactional
    public HouseholdResponse update(Long id, HouseholdRequest request) {
        Household household = findOrThrow(id);
        Apartment apartment = apartmentRepository.findById(request.getApartmentId())
                .orElseThrow(() -> ResourceNotFoundException.of("Apartment", request.getApartmentId()));

        boolean unitChanged = !household.getUnitNumber().equalsIgnoreCase(request.getUnitNumber())
                || !household.getApartment().getId().equals(request.getApartmentId());
        if (unitChanged && householdRepository.existsByApartmentIdAndUnitNumberIgnoreCase(
                request.getApartmentId(), request.getUnitNumber())) {
            throw new DuplicateResourceException(
                    "Unit '" + request.getUnitNumber() + "' already exists in this apartment");
        }

        household.setApartment(apartment);
        household.setUnitNumber(request.getUnitNumber());
        household.setAreaSqft(request.getAreaSqft());
        household.setOccupancyCount(request.getOccupancyCount());
        household.setHasMeter(request.isHasMeter());

        return householdMapper.toResponse(householdRepository.save(household));
    }

    @Transactional
    public void delete(Long id) {
        Household household = findOrThrow(id);
        householdRepository.delete(household);
    }

    private Household findOrThrow(Long id) {
        return householdRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Household", id));
    }
}
