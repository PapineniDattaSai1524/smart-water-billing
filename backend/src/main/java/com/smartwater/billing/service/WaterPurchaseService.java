package com.smartwater.billing.service;

import com.smartwater.billing.dto.common.PageResponse;
import com.smartwater.billing.dto.purchase.PurchaseSummaryResponse;
import com.smartwater.billing.dto.purchase.WaterPurchaseRequest;
import com.smartwater.billing.dto.purchase.WaterPurchaseResponse;
import com.smartwater.billing.entity.Apartment;
import com.smartwater.billing.entity.WaterPurchase;
import com.smartwater.billing.entity.WaterSourceType;
import com.smartwater.billing.exception.InvalidRequestException;
import com.smartwater.billing.exception.ResourceNotFoundException;
import com.smartwater.billing.exception.UnauthorizedActionException;
import com.smartwater.billing.mapper.WaterPurchaseMapper;
import com.smartwater.billing.repository.ApartmentRepository;
import com.smartwater.billing.repository.WaterPurchaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class WaterPurchaseService {

    private static final int SCALE = 2;

    private final WaterPurchaseRepository waterPurchaseRepository;
    private final ApartmentRepository apartmentRepository;
    private final WaterPurchaseMapper waterPurchaseMapper;
    private final AuditLogService auditLogService;

    @Transactional
    public WaterPurchaseResponse create(WaterPurchaseRequest request, Long adminId) {
        Apartment apartment = apartmentRepository.findById(request.getApartmentId())
                .orElseThrow(() -> ResourceNotFoundException.of("Apartment", request.getApartmentId()));
        assertOwnedByAdmin(apartment, adminId);

        WaterPurchase purchase = WaterPurchase.builder()
                .apartment(apartment)
                .sourceType(request.getSourceType())
                .vendorName(request.getVendorName())
                .quantityKl(request.getQuantityKl())
                .cost(request.getCost())
                .costPerKl(costPerKl(request.getCost(), request.getQuantityKl()))
                .purchaseDate(request.getPurchaseDate())
                .invoiceReference(request.getInvoiceReference())
                .notes(request.getNotes())
                .distributed(false)
                .build();

        WaterPurchase saved = waterPurchaseRepository.save(purchase);
        auditLogService.record(adminId, "CREATE_WATER_PURCHASE", "WaterPurchase", saved.getId(),
                saved.getSourceType() + " purchase of " + saved.getQuantityKl() + " KL from "
                        + saved.getVendorName() + " for " + apartment.getName());

        return waterPurchaseMapper.toResponse(saved);
    }

    @Transactional
    public WaterPurchaseResponse update(Long id, WaterPurchaseRequest request, Long adminId) {
        WaterPurchase purchase = waterPurchaseRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("WaterPurchase", id));
        assertOwnedByAdmin(purchase.getApartment(), adminId);

        if (purchase.isDistributed()) {
            throw new InvalidRequestException(
                    "This purchase's cost has already been distributed to households and can no longer be edited. "
                            + "Record a correcting entry instead.");
        }

        // Allow moving a purchase to a different apartment the same admin owns
        if (!purchase.getApartment().getId().equals(request.getApartmentId())) {
            Apartment newApartment = apartmentRepository.findById(request.getApartmentId())
                    .orElseThrow(() -> ResourceNotFoundException.of("Apartment", request.getApartmentId()));
            assertOwnedByAdmin(newApartment, adminId);
            purchase.setApartment(newApartment);
        }

        purchase.setSourceType(request.getSourceType());
        purchase.setVendorName(request.getVendorName());
        purchase.setQuantityKl(request.getQuantityKl());
        purchase.setCost(request.getCost());
        purchase.setCostPerKl(costPerKl(request.getCost(), request.getQuantityKl()));
        purchase.setPurchaseDate(request.getPurchaseDate());
        purchase.setInvoiceReference(request.getInvoiceReference());
        purchase.setNotes(request.getNotes());

        WaterPurchase saved = waterPurchaseRepository.save(purchase);
        auditLogService.record(adminId, "UPDATE_WATER_PURCHASE", "WaterPurchase", saved.getId(),
                "Purchase record updated");

        return waterPurchaseMapper.toResponse(saved);
    }

    @Transactional
    public void delete(Long id, Long adminId) {
        WaterPurchase purchase = waterPurchaseRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("WaterPurchase", id));
        assertOwnedByAdmin(purchase.getApartment(), adminId);

        if (purchase.isDistributed()) {
            throw new InvalidRequestException(
                    "This purchase's cost has already been distributed to households and can no longer be deleted.");
        }

        waterPurchaseRepository.delete(purchase);
        auditLogService.record(adminId, "DELETE_WATER_PURCHASE", "WaterPurchase", id,
                "Purchase record deleted");
    }

    @Transactional(readOnly = true)
    public WaterPurchaseResponse getById(Long id, Long adminId) {
        WaterPurchase purchase = waterPurchaseRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("WaterPurchase", id));
        assertOwnedByAdmin(purchase.getApartment(), adminId);
        return waterPurchaseMapper.toResponse(purchase);
    }

    /** Filterable, searchable purchase history. Any filter may be null to skip it. */
    @Transactional(readOnly = true)
    public PageResponse<WaterPurchaseResponse> search(
            Long adminId, Long apartmentId, WaterSourceType sourceType,
            LocalDate fromDate, LocalDate toDate, String search, Pageable pageable) {

        if (fromDate != null && toDate != null && toDate.isBefore(fromDate)) {
            throw new InvalidRequestException("toDate cannot be before fromDate");
        }

        Page<WaterPurchase> page = waterPurchaseRepository.search(
                adminId, apartmentId, sourceType, fromDate, toDate, blankToNull(search), pageable);
        return PageResponse.from(page.map(waterPurchaseMapper::toResponse));
    }

    @Transactional(readOnly = true)
    public PurchaseSummaryResponse getSummary(Long adminId) {
        BigDecimal totalQuantity = waterPurchaseRepository.sumQuantityForAdmin(adminId);
        BigDecimal totalCost = waterPurchaseRepository.sumCostForAdmin(adminId);
        BigDecimal avgCostPerKl = totalQuantity.signum() > 0
                ? totalCost.divide(totalQuantity, SCALE, RoundingMode.HALF_UP)
                : BigDecimal.ZERO.setScale(SCALE);

        return PurchaseSummaryResponse.builder()
                .totalQuantityKl(totalQuantity.setScale(SCALE, RoundingMode.HALF_UP))
                .totalCost(totalCost.setScale(SCALE, RoundingMode.HALF_UP))
                .averageCostPerKl(avgCostPerKl)
                .purchaseCount(waterPurchaseRepository.count())
                .build();
    }

    private BigDecimal costPerKl(BigDecimal cost, BigDecimal quantityKl) {
        if (quantityKl == null || quantityKl.signum() <= 0) {
            throw new InvalidRequestException("Quantity must be greater than zero to compute cost per KL");
        }
        return cost.divide(quantityKl, SCALE, RoundingMode.HALF_UP);
    }

    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }

    private void assertOwnedByAdmin(Apartment apartment, Long adminId) {
        if (apartment.getAdmin() == null || !apartment.getAdmin().getId().equals(adminId)) {
            throw new UnauthorizedActionException("You do not manage this apartment");
        }
    }
}
