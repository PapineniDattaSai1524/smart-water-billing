package com.smartwater.billing.service;

import com.smartwater.billing.dto.cycle.BillingCycleResponse;
import com.smartwater.billing.dto.cycle.CyclePaymentStatusResponse;
import com.smartwater.billing.dto.cycle.OpenCycleRequest;
import com.smartwater.billing.dto.cycle.ReopenCycleRequest;
import com.smartwater.billing.entity.*;
import com.smartwater.billing.exception.InvalidRequestException;
import com.smartwater.billing.mapper.BillingCycleMapper;
import com.smartwater.billing.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BillingCycleServiceTest {

    @Mock private BillingCycleRepository billingCycleRepository;
    @Mock private ApartmentRepository apartmentRepository;
    @Mock private InvoiceRepository invoiceRepository;
    @Mock private UserRepository userRepository;
    @Mock private BillingService billingService;
    @Mock private BillingCycleMapper billingCycleMapper;
    @Mock private AuditLogService auditLogService;

    private BillingCycleService service;

    private static final Long ADMIN_ID = 1L;
    private User admin;
    private Apartment apartment;

    @BeforeEach
    void setUp() {
        service = new BillingCycleService(billingCycleRepository, apartmentRepository, invoiceRepository,
                userRepository, billingService, billingCycleMapper, auditLogService);

        admin = User.builder().id(ADMIN_ID).fullName("Admin One").build();
        apartment = Apartment.builder().id(10L).name("Palm Residency").admin(admin).build();
    }

    private BillingCycle cycle(CycleStatus status) {
        return BillingCycle.builder().id(200L).apartment(apartment).billingMonth("2026-07")
                .status(status).recalculationCount(0).build();
    }

    @Test
    void openCycle_rejectsDuplicateForSameApartmentAndMonth() {
        OpenCycleRequest request = new OpenCycleRequest(10L, "2026-07", null);
        when(apartmentRepository.findById(10L)).thenReturn(Optional.of(apartment));
        when(billingCycleRepository.existsByApartmentIdAndBillingMonth(10L, "2026-07")).thenReturn(true);

        assertThatThrownBy(() -> service.openCycle(request, ADMIN_ID))
                .isInstanceOf(InvalidRequestException.class);

        verify(billingCycleRepository, never()).save(any());
    }

    @Test
    void openCycle_createsCycleInOpenStatus() {
        OpenCycleRequest request = new OpenCycleRequest(10L, "2026-07", "First cycle");
        when(apartmentRepository.findById(10L)).thenReturn(Optional.of(apartment));
        when(billingCycleRepository.existsByApartmentIdAndBillingMonth(10L, "2026-07")).thenReturn(false);
        when(userRepository.findById(ADMIN_ID)).thenReturn(Optional.of(admin));
        when(billingCycleRepository.save(any(BillingCycle.class))).thenAnswer(inv -> inv.getArgument(0));
        when(billingCycleMapper.toResponse(any())).thenReturn(BillingCycleResponse.builder().id(200L).build());

        service.openCycle(request, ADMIN_ID);

        var captor = org.mockito.ArgumentCaptor.forClass(BillingCycle.class);
        verify(billingCycleRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(CycleStatus.OPEN);
        assertThat(captor.getValue().getBillingMonth()).isEqualTo("2026-07");
    }

    @Test
    void closeCycle_throwsWhenNoInvoicesExist() {
        BillingCycle open = cycle(CycleStatus.OPEN);
        when(billingCycleRepository.findById(200L)).thenReturn(Optional.of(open));
        when(invoiceRepository.findByApartmentIdAndBillingMonth(10L, "2026-07")).thenReturn(List.of());

        assertThatThrownBy(() -> service.closeCycle(200L, ADMIN_ID))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("Generate invoices");
    }

    @Test
    void closeCycle_throwsWhenCycleNotOpen() {
        BillingCycle closed = cycle(CycleStatus.CLOSED);
        when(billingCycleRepository.findById(200L)).thenReturn(Optional.of(closed));

        assertThatThrownBy(() -> service.closeCycle(200L, ADMIN_ID))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("OPEN");
    }

    @Test
    void closeCycle_linksInvoicesAndTransitionsToClosed() {
        BillingCycle open = cycle(CycleStatus.OPEN);
        Household household = Household.builder().id(1L).apartment(apartment).unitNumber("A-101").build();
        Invoice invoice = Invoice.builder().id(500L).household(household).status(InvoiceStatus.UNPAID)
                .totalAmount(BigDecimal.valueOf(100)).build();

        when(billingCycleRepository.findById(200L)).thenReturn(Optional.of(open));
        when(invoiceRepository.findByApartmentIdAndBillingMonth(10L, "2026-07")).thenReturn(List.of(invoice));
        when(billingCycleRepository.save(any(BillingCycle.class))).thenAnswer(inv -> inv.getArgument(0));
        when(billingCycleMapper.toResponse(any())).thenReturn(BillingCycleResponse.builder().id(200L).build());

        service.closeCycle(200L, ADMIN_ID);

        assertThat(invoice.getBillingCycle()).isEqualTo(open);
        assertThat(open.getStatus()).isEqualTo(CycleStatus.CLOSED);
        assertThat(open.getClosedAt()).isNotNull();
    }

    @Test
    void finalizeCycle_throwsWhenNotClosed() {
        BillingCycle open = cycle(CycleStatus.OPEN);
        when(billingCycleRepository.findById(200L)).thenReturn(Optional.of(open));

        assertThatThrownBy(() -> service.finalizeCycle(200L, ADMIN_ID))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("CLOSED");
    }

    @Test
    void finalizeCycle_marksAllInvoicesFinalized() {
        BillingCycle closed = cycle(CycleStatus.CLOSED);
        Household household = Household.builder().id(1L).apartment(apartment).unitNumber("A-101").build();
        Invoice invoice = Invoice.builder().id(500L).household(household).status(InvoiceStatus.UNPAID)
                .totalAmount(BigDecimal.valueOf(100)).finalized(false).build();

        when(billingCycleRepository.findById(200L)).thenReturn(Optional.of(closed));
        when(invoiceRepository.findByBillingCycleId(200L)).thenReturn(List.of(invoice));
        when(billingCycleRepository.save(any(BillingCycle.class))).thenAnswer(inv -> inv.getArgument(0));
        when(billingCycleMapper.toResponse(any())).thenReturn(BillingCycleResponse.builder().id(200L).build());

        service.finalizeCycle(200L, ADMIN_ID);

        assertThat(invoice.isFinalized()).isTrue();
        assertThat(invoice.getFinalizedAt()).isNotNull();
        assertThat(closed.getStatus()).isEqualTo(CycleStatus.FINALIZED);
    }

    @Test
    void archiveCycle_throwsWhenNotFinalized() {
        BillingCycle closed = cycle(CycleStatus.CLOSED);
        when(billingCycleRepository.findById(200L)).thenReturn(Optional.of(closed));

        assertThatThrownBy(() -> service.archiveCycle(200L, ADMIN_ID))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("FINALIZED");
    }

    @Test
    void reopenCycle_allowedFromClosed() {
        BillingCycle closed = cycle(CycleStatus.CLOSED);
        when(billingCycleRepository.findById(200L)).thenReturn(Optional.of(closed));
        when(invoiceRepository.findByBillingCycleId(200L)).thenReturn(List.of());
        when(billingCycleRepository.save(any(BillingCycle.class))).thenAnswer(inv -> inv.getArgument(0));
        when(billingCycleMapper.toResponse(any())).thenReturn(BillingCycleResponse.builder().id(200L).build());

        service.reopenCycle(200L, new ReopenCycleRequest("correcting a meter error"), ADMIN_ID);

        assertThat(closed.getStatus()).isEqualTo(CycleStatus.OPEN);
        assertThat(closed.getReopenedAt()).isNotNull();
    }

    @Test
    void reopenCycle_rejectedFromArchived() {
        BillingCycle archived = cycle(CycleStatus.ARCHIVED);
        when(billingCycleRepository.findById(200L)).thenReturn(Optional.of(archived));

        assertThatThrownBy(() -> service.reopenCycle(200L, null, ADMIN_ID))
                .isInstanceOf(InvalidRequestException.class);
    }

    @Test
    void recalculateBills_throwsWhenNotOpen() {
        BillingCycle closed = cycle(CycleStatus.CLOSED);
        when(billingCycleRepository.findById(200L)).thenReturn(Optional.of(closed));

        assertThatThrownBy(() -> service.recalculateBills(200L, ADMIN_ID))
                .isInstanceOf(InvalidRequestException.class);

        verify(billingService, never()).generateInvoices(any(), any());
    }

    @Test
    void recalculateBills_deletesUnpaidAndRegeneratesViaBillingService() {
        BillingCycle open = cycle(CycleStatus.OPEN);
        Household household = Household.builder().id(1L).apartment(apartment).unitNumber("A-101").build();
        Invoice unpaidInvoice = Invoice.builder().id(500L).household(household).status(InvoiceStatus.UNPAID)
                .totalAmount(BigDecimal.valueOf(100)).build();

        when(billingCycleRepository.findById(200L)).thenReturn(Optional.of(open));
        when(invoiceRepository.findUnpaidByApartmentIdAndBillingMonth(10L, "2026-07")).thenReturn(List.of(unpaidInvoice));
        when(invoiceRepository.findByApartmentIdAndBillingMonth(10L, "2026-07")).thenReturn(List.of());
        when(billingCycleRepository.save(any(BillingCycle.class))).thenAnswer(inv -> inv.getArgument(0));
        when(billingCycleMapper.toResponse(any())).thenReturn(BillingCycleResponse.builder().id(200L).build());

        service.recalculateBills(200L, ADMIN_ID);

        verify(invoiceRepository).deleteAll(List.of(unpaidInvoice));
        verify(billingService).generateInvoices(any(), eq(ADMIN_ID));
        assertThat(open.getRecalculationCount()).isEqualTo(1);
    }

    @Test
    void getPaymentStatus_aggregatesCountsAndTotalsCorrectly() {
        BillingCycle open = cycle(CycleStatus.OPEN);
        Household household = Household.builder().id(1L).apartment(apartment).unitNumber("A-101").build();

        List<Invoice> invoices = List.of(
                Invoice.builder().household(household).status(InvoiceStatus.PAID).totalAmount(BigDecimal.valueOf(100)).build(),
                Invoice.builder().household(household).status(InvoiceStatus.UNPAID).totalAmount(BigDecimal.valueOf(50)).build(),
                Invoice.builder().household(household).status(InvoiceStatus.OVERDUE).totalAmount(BigDecimal.valueOf(75)).build(),
                Invoice.builder().household(household).status(InvoiceStatus.CANCELLED).totalAmount(BigDecimal.valueOf(20)).build()
        );

        when(billingCycleRepository.findById(200L)).thenReturn(Optional.of(open));
        when(invoiceRepository.findByApartmentIdAndBillingMonth(10L, "2026-07")).thenReturn(invoices);

        CyclePaymentStatusResponse status = service.getPaymentStatus(200L, ADMIN_ID);

        assertThat(status.getTotalInvoices()).isEqualTo(4);
        assertThat(status.getPaidCount()).isEqualTo(1);
        assertThat(status.getUnpaidCount()).isEqualTo(1);
        assertThat(status.getOverdueCount()).isEqualTo(1);
        assertThat(status.getCancelledCount()).isEqualTo(1);
        // total billed sums all 4: 100+50+75+20 = 245
        assertThat(status.getTotalBilled()).isEqualByComparingTo("245.00");
        assertThat(status.getTotalCollected()).isEqualByComparingTo("100.00");
        // outstanding = unpaid + overdue = 50 + 75 = 125
        assertThat(status.getTotalOutstanding()).isEqualByComparingTo("125.00");
        // collection rate = 1/4 * 100 = 25.00
        assertThat(status.getCollectionRatePercent()).isEqualByComparingTo("25.00");
    }
}
