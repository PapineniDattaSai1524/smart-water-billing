package com.smartwater.billing.service;

import com.smartwater.billing.dto.common.PageResponse;
import com.smartwater.billing.dto.purchase.PurchaseSummaryResponse;
import com.smartwater.billing.dto.purchase.WaterPurchaseRequest;
import com.smartwater.billing.dto.purchase.WaterPurchaseResponse;
import com.smartwater.billing.entity.Apartment;
import com.smartwater.billing.entity.User;
import com.smartwater.billing.entity.WaterPurchase;
import com.smartwater.billing.entity.WaterSourceType;
import com.smartwater.billing.exception.InvalidRequestException;
import com.smartwater.billing.exception.ResourceNotFoundException;
import com.smartwater.billing.exception.UnauthorizedActionException;
import com.smartwater.billing.mapper.WaterPurchaseMapper;
import com.smartwater.billing.repository.ApartmentRepository;
import com.smartwater.billing.repository.WaterPurchaseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WaterPurchaseServiceTest {

    @Mock private WaterPurchaseRepository waterPurchaseRepository;
    @Mock private ApartmentRepository apartmentRepository;
    @Mock private WaterPurchaseMapper waterPurchaseMapper;
    @Mock private AuditLogService auditLogService;

    @InjectMocks
    private WaterPurchaseService waterPurchaseService;

    private static final Long ADMIN_ID = 1L;

    private User admin;
    private Apartment apartment;
    private WaterPurchaseRequest request;
    private WaterPurchase purchase;

    @BeforeEach
    void setUp() {
        admin = User.builder().id(ADMIN_ID).fullName("Admin One").build();
        apartment = Apartment.builder().id(10L).name("Palm Residency").admin(admin).build();

        request = new WaterPurchaseRequest();
        request.setApartmentId(10L);
        request.setSourceType(WaterSourceType.TANKER);
        request.setVendorName("AquaFlow Tankers");
        request.setQuantityKl(BigDecimal.valueOf(20));
        request.setCost(BigDecimal.valueOf(3000));
        request.setPurchaseDate(LocalDate.of(2026, 7, 15));
        request.setInvoiceReference("INV-2026-045");

        purchase = WaterPurchase.builder().id(100L).apartment(apartment)
                .sourceType(WaterSourceType.TANKER).vendorName("AquaFlow Tankers")
                .quantityKl(BigDecimal.valueOf(20)).cost(BigDecimal.valueOf(3000))
                .costPerKl(BigDecimal.valueOf(150)).purchaseDate(LocalDate.of(2026, 7, 15))
                .distributed(false).build();
    }

    @Test
    void create_computesCostPerKlAndSaves_whenApartmentOwnedByAdmin() {
        when(apartmentRepository.findById(10L)).thenReturn(Optional.of(apartment));
        when(waterPurchaseRepository.save(any(WaterPurchase.class))).thenReturn(purchase);
        when(waterPurchaseMapper.toResponse(purchase)).thenReturn(
                WaterPurchaseResponse.builder().id(100L).costPerKl(BigDecimal.valueOf(150)).build());

        WaterPurchaseResponse response = waterPurchaseService.create(request, ADMIN_ID);

        assertThat(response.getCostPerKl()).isEqualByComparingTo("150");
        var captor = org.mockito.ArgumentCaptor.forClass(WaterPurchase.class);
        verify(waterPurchaseRepository).save(captor.capture());
        // 3000 / 20 = 150.00
        assertThat(captor.getValue().getCostPerKl()).isEqualByComparingTo("150.00");
        verify(auditLogService).record(eq(ADMIN_ID), eq("CREATE_WATER_PURCHASE"), eq("WaterPurchase"), any(), any());
    }

    @Test
    void create_throwsResourceNotFoundException_whenApartmentDoesNotExist() {
        when(apartmentRepository.findById(10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> waterPurchaseService.create(request, ADMIN_ID))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(waterPurchaseRepository, never()).save(any());
    }

    @Test
    void create_throwsUnauthorizedActionException_whenApartmentBelongsToAnotherAdmin() {
        User otherAdmin = User.builder().id(999L).build();
        apartment.setAdmin(otherAdmin);
        when(apartmentRepository.findById(10L)).thenReturn(Optional.of(apartment));

        assertThatThrownBy(() -> waterPurchaseService.create(request, ADMIN_ID))
                .isInstanceOf(UnauthorizedActionException.class);

        verify(waterPurchaseRepository, never()).save(any());
    }

    @Test
    void update_throwsInvalidRequestException_whenPurchaseAlreadyDistributed() {
        purchase.setDistributed(true);
        when(waterPurchaseRepository.findById(100L)).thenReturn(Optional.of(purchase));

        assertThatThrownBy(() -> waterPurchaseService.update(100L, request, ADMIN_ID))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("already been distributed");

        verify(waterPurchaseRepository, never()).save(any());
    }

    @Test
    void update_recalculatesCostPerKl_whenQuantityOrCostChanges() {
        when(waterPurchaseRepository.findById(100L)).thenReturn(Optional.of(purchase));
        when(waterPurchaseRepository.save(any(WaterPurchase.class))).thenReturn(purchase);
        when(waterPurchaseMapper.toResponse(purchase)).thenReturn(WaterPurchaseResponse.builder().id(100L).build());

        request.setQuantityKl(BigDecimal.valueOf(15));
        request.setCost(BigDecimal.valueOf(3000));

        waterPurchaseService.update(100L, request, ADMIN_ID);

        // 3000 / 15 = 200.00
        assertThat(purchase.getCostPerKl()).isEqualByComparingTo("200.00");
    }

    @Test
    void delete_throwsInvalidRequestException_whenPurchaseAlreadyDistributed() {
        purchase.setDistributed(true);
        when(waterPurchaseRepository.findById(100L)).thenReturn(Optional.of(purchase));

        assertThatThrownBy(() -> waterPurchaseService.delete(100L, ADMIN_ID))
                .isInstanceOf(InvalidRequestException.class);

        verify(waterPurchaseRepository, never()).delete(any(WaterPurchase.class));
    }

    @Test
    void delete_removesRecord_whenNotYetDistributed() {
        when(waterPurchaseRepository.findById(100L)).thenReturn(Optional.of(purchase));

        waterPurchaseService.delete(100L, ADMIN_ID);

        verify(waterPurchaseRepository).delete(purchase);
    }

    @Test
    void search_throwsInvalidRequestException_whenToDateBeforeFromDate() {
        LocalDate from = LocalDate.of(2026, 7, 1);
        LocalDate to = LocalDate.of(2026, 6, 1);

        assertThatThrownBy(() -> waterPurchaseService.search(
                ADMIN_ID, null, null, from, to, null, PageRequest.of(0, 10)))
                .isInstanceOf(InvalidRequestException.class);
    }

    @Test
    void search_returnsPagedResults() {
        Page<WaterPurchase> page = new PageImpl<>(java.util.List.of(purchase));
        when(waterPurchaseRepository.search(eq(ADMIN_ID), any(), any(), any(), any(), any(), any()))
                .thenReturn(page);
        when(waterPurchaseMapper.toResponse(purchase)).thenReturn(WaterPurchaseResponse.builder().id(100L).build());

        PageResponse<WaterPurchaseResponse> result = waterPurchaseService.search(
                ADMIN_ID, null, null, null, null, "AquaFlow", PageRequest.of(0, 10));

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getId()).isEqualTo(100L);
    }

    @Test
    void getSummary_computesBlendedAverageCostPerKl() {
        when(waterPurchaseRepository.sumQuantityForAdmin(ADMIN_ID)).thenReturn(BigDecimal.valueOf(50));
        when(waterPurchaseRepository.sumCostForAdmin(ADMIN_ID)).thenReturn(BigDecimal.valueOf(7500));
        when(waterPurchaseRepository.count()).thenReturn(3L);

        PurchaseSummaryResponse summary = waterPurchaseService.getSummary(ADMIN_ID);

        // 7500 / 50 = 150.00
        assertThat(summary.getAverageCostPerKl()).isEqualByComparingTo("150.00");
        assertThat(summary.getPurchaseCount()).isEqualTo(3L);
    }

    @Test
    void getSummary_returnsZeroAverage_whenNoPurchasesExist() {
        when(waterPurchaseRepository.sumQuantityForAdmin(ADMIN_ID)).thenReturn(BigDecimal.ZERO);
        when(waterPurchaseRepository.sumCostForAdmin(ADMIN_ID)).thenReturn(BigDecimal.ZERO);
        when(waterPurchaseRepository.count()).thenReturn(0L);

        PurchaseSummaryResponse summary = waterPurchaseService.getSummary(ADMIN_ID);

        assertThat(summary.getAverageCostPerKl()).isEqualByComparingTo("0.00");
    }
}
