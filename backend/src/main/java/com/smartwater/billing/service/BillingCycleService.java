package com.smartwater.billing.service;

import com.smartwater.billing.dto.billing.GenerateInvoicesRequest;
import com.smartwater.billing.dto.common.PageResponse;
import com.smartwater.billing.dto.cycle.*;
import com.smartwater.billing.entity.*;
import com.smartwater.billing.exception.InvalidRequestException;
import com.smartwater.billing.exception.ResourceNotFoundException;
import com.smartwater.billing.exception.UnauthorizedActionException;
import com.smartwater.billing.mapper.BillingCycleMapper;
import com.smartwater.billing.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Implements Module 6: the monthly billing lifecycle per apartment.
 * OPEN -> CLOSED -> FINALIZED -> ARCHIVED, with REOPEN allowed from CLOSED
 * or FINALIZED back to OPEN. Also used by the Automatic Billing Engine
 * (Module 4) to drive the scheduled monthly run.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BillingCycleService {

    private final BillingCycleRepository billingCycleRepository;
    private final ApartmentRepository apartmentRepository;
    private final InvoiceRepository invoiceRepository;
    private final UserRepository userRepository;
    private final BillingService billingService;
    private final BillingCycleMapper billingCycleMapper;
    private final AuditLogService auditLogService;

    @Transactional
    public BillingCycleResponse openCycle(OpenCycleRequest request, Long adminId) {
        Apartment apartment = apartmentRepository.findById(request.getApartmentId())
                .orElseThrow(() -> ResourceNotFoundException.of("Apartment", request.getApartmentId()));
        assertOwnedByAdmin(apartment, adminId);

        if (billingCycleRepository.existsByApartmentIdAndBillingMonth(apartment.getId(), request.getBillingMonth())) {
            throw new InvalidRequestException(
                    "A billing cycle already exists for " + apartment.getName() + " / " + request.getBillingMonth());
        }

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> ResourceNotFoundException.of("User", adminId));

        BillingCycle cycle = BillingCycle.builder()
                .apartment(apartment)
                .billingMonth(request.getBillingMonth())
                .status(CycleStatus.OPEN)
                .openedByAdmin(admin)
                .openedAt(LocalDateTime.now())
                .notes(request.getNotes())
                .build();

        BillingCycle saved = billingCycleRepository.save(cycle);
        auditLogService.record(adminId, "OPEN_BILLING_CYCLE", "BillingCycle", saved.getId(),
                "Opened cycle for " + apartment.getName() + " / " + request.getBillingMonth());

        return billingCycleMapper.toResponse(saved);
    }

    @Transactional
    public BillingCycleResponse closeCycle(Long cycleId, Long adminId) {
        BillingCycle cycle = getOwnedCycle(cycleId, adminId);
        requireStatus(cycle, CycleStatus.OPEN, "closed");

        List<Invoice> invoices = invoiceRepository.findByApartmentIdAndBillingMonth(
                cycle.getApartment().getId(), cycle.getBillingMonth());
        if (invoices.isEmpty()) {
            throw new InvalidRequestException(
                    "No invoices have been generated for this billing month yet. "
                            + "Generate invoices before closing the cycle.");
        }

        invoices.forEach(inv -> inv.setBillingCycle(cycle));
        invoiceRepository.saveAll(invoices);

        cycle.setStatus(CycleStatus.CLOSED);
        cycle.setClosedAt(LocalDateTime.now());
        BillingCycle saved = billingCycleRepository.save(cycle);

        auditLogService.record(adminId, "CLOSE_BILLING_CYCLE", "BillingCycle", saved.getId(),
                "Closed cycle with " + invoices.size() + " invoices");

        return billingCycleMapper.toResponse(saved);
    }

    @Transactional
    public BillingCycleResponse finalizeCycle(Long cycleId, Long adminId) {
        BillingCycle cycle = getOwnedCycle(cycleId, adminId);
        requireStatus(cycle, CycleStatus.CLOSED, "finalized");

        List<Invoice> invoices = invoiceRepository.findByBillingCycleId(cycle.getId());
        LocalDateTime now = LocalDateTime.now();
        invoices.forEach(inv -> {
            inv.setFinalized(true);
            inv.setFinalizedAt(now);
        });
        invoiceRepository.saveAll(invoices);

        cycle.setStatus(CycleStatus.FINALIZED);
        cycle.setFinalizedAt(now);
        BillingCycle saved = billingCycleRepository.save(cycle);

        auditLogService.record(adminId, "FINALIZE_BILLING_CYCLE", "BillingCycle", saved.getId(),
                "Finalized " + invoices.size() + " bills — now immutable and ready to send");

        return billingCycleMapper.toResponse(saved);
    }

    @Transactional
    public BillingCycleResponse archiveCycle(Long cycleId, Long adminId) {
        BillingCycle cycle = getOwnedCycle(cycleId, adminId);
        requireStatus(cycle, CycleStatus.FINALIZED, "archived");

        cycle.setStatus(CycleStatus.ARCHIVED);
        cycle.setArchivedAt(LocalDateTime.now());
        BillingCycle saved = billingCycleRepository.save(cycle);

        auditLogService.record(adminId, "ARCHIVE_BILLING_CYCLE", "BillingCycle", saved.getId(),
                "Cycle archived");

        return billingCycleMapper.toResponse(saved);
    }

    @Transactional
    public BillingCycleResponse reopenCycle(Long cycleId, ReopenCycleRequest request, Long adminId) {
        BillingCycle cycle = getOwnedCycle(cycleId, adminId);
        if (cycle.getStatus() != CycleStatus.CLOSED && cycle.getStatus() != CycleStatus.FINALIZED) {
            throw new InvalidRequestException(
                    "Only a CLOSED or FINALIZED cycle can be reopened (current status: " + cycle.getStatus() + ")");
        }

        // Reopening un-finalizes any bills so they can be recalculated again.
        List<Invoice> invoices = invoiceRepository.findByBillingCycleId(cycle.getId());
        invoices.forEach(inv -> {
            inv.setFinalized(false);
            inv.setFinalizedAt(null);
        });
        invoiceRepository.saveAll(invoices);

        CycleStatus previousStatus = cycle.getStatus();
        cycle.setStatus(CycleStatus.OPEN);
        cycle.setReopenedAt(LocalDateTime.now());
        BillingCycle saved = billingCycleRepository.save(cycle);

        String reason = (request != null && request.getReason() != null && !request.getReason().isBlank())
                ? request.getReason() : "no reason given";
        auditLogService.record(adminId, "REOPEN_BILLING_CYCLE", "BillingCycle", saved.getId(),
                "Reopened from " + previousStatus + " — reason: " + reason);

        return billingCycleMapper.toResponse(saved);
    }

    /**
     * Recalculates every not-yet-paid invoice in an OPEN cycle: deletes them
     * and regenerates via {@link BillingService#generateInvoices}. Paid
     * invoices are left untouched so payment history is never destroyed.
     */
    @Transactional
    public BillingCycleResponse recalculateBills(Long cycleId, Long adminId) {
        BillingCycle cycle = getOwnedCycle(cycleId, adminId);
        requireStatus(cycle, CycleStatus.OPEN, "recalculated");

        List<Invoice> unpaid = invoiceRepository.findUnpaidByApartmentIdAndBillingMonth(
                cycle.getApartment().getId(), cycle.getBillingMonth());
        invoiceRepository.deleteAll(unpaid);
        invoiceRepository.flush();

        billingService.generateInvoices(
                new GenerateInvoicesRequest(cycle.getApartment().getId(), cycle.getBillingMonth()), adminId);

        // Re-link the freshly (re)generated invoices to this cycle.
        List<Invoice> current = invoiceRepository.findByApartmentIdAndBillingMonth(
                cycle.getApartment().getId(), cycle.getBillingMonth());
        current.forEach(inv -> inv.setBillingCycle(cycle));
        invoiceRepository.saveAll(current);

        cycle.setRecalculationCount(cycle.getRecalculationCount() + 1);
        BillingCycle saved = billingCycleRepository.save(cycle);

        auditLogService.record(adminId, "RECALCULATE_BILLING_CYCLE", "BillingCycle", saved.getId(),
                "Recalculated " + unpaid.size() + " unpaid bills (run #" + saved.getRecalculationCount() + ")");

        return billingCycleMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public CyclePaymentStatusResponse getPaymentStatus(Long cycleId, Long adminId) {
        BillingCycle cycle = getOwnedCycle(cycleId, adminId);
        List<Invoice> invoices = invoiceRepository.findByApartmentIdAndBillingMonth(
                cycle.getApartment().getId(), cycle.getBillingMonth());

        int paid = 0, unpaid = 0, overdue = 0, cancelled = 0;
        BigDecimal totalBilled = BigDecimal.ZERO;
        BigDecimal totalCollected = BigDecimal.ZERO;
        BigDecimal totalOutstanding = BigDecimal.ZERO;

        for (Invoice inv : invoices) {
            totalBilled = totalBilled.add(inv.getTotalAmount());
            switch (inv.getStatus()) {
                case PAID -> {
                    paid++;
                    totalCollected = totalCollected.add(inv.getTotalAmount());
                }
                case UNPAID -> {
                    unpaid++;
                    totalOutstanding = totalOutstanding.add(inv.getTotalAmount());
                }
                case OVERDUE -> {
                    overdue++;
                    totalOutstanding = totalOutstanding.add(inv.getTotalAmount());
                }
                case CANCELLED -> cancelled++;
            }
        }

        BigDecimal collectionRate = invoices.isEmpty()
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(paid).multiply(BigDecimal.valueOf(100))
                        .divide(BigDecimal.valueOf(invoices.size()), 2, RoundingMode.HALF_UP);

        return CyclePaymentStatusResponse.builder()
                .cycleId(cycle.getId())
                .billingMonth(cycle.getBillingMonth())
                .totalInvoices(invoices.size())
                .paidCount(paid)
                .unpaidCount(unpaid)
                .overdueCount(overdue)
                .cancelledCount(cancelled)
                .totalBilled(totalBilled.setScale(2, RoundingMode.HALF_UP))
                .totalCollected(totalCollected.setScale(2, RoundingMode.HALF_UP))
                .totalOutstanding(totalOutstanding.setScale(2, RoundingMode.HALF_UP))
                .collectionRatePercent(collectionRate)
                .build();
    }

    @Transactional(readOnly = true)
    public BillingCycleResponse getCycle(Long cycleId, Long adminId) {
        return billingCycleMapper.toResponse(getOwnedCycle(cycleId, adminId));
    }

    @Transactional(readOnly = true)
    public PageResponse<BillingCycleResponse> search(
            Long adminId, Long apartmentId, CycleStatus status, Pageable pageable) {
        Page<BillingCycle> page = billingCycleRepository.search(adminId, apartmentId, status, pageable);
        return PageResponse.from(page.map(billingCycleMapper::toResponse));
    }

    private BillingCycle getOwnedCycle(Long cycleId, Long adminId) {
        BillingCycle cycle = billingCycleRepository.findById(cycleId)
                .orElseThrow(() -> ResourceNotFoundException.of("BillingCycle", cycleId));
        assertOwnedByAdmin(cycle.getApartment(), adminId);
        return cycle;
    }

    private void requireStatus(BillingCycle cycle, CycleStatus required, String actionPastTense) {
        if (cycle.getStatus() != required) {
            throw new InvalidRequestException("Cycle must be " + required + " before it can be "
                    + actionPastTense + " (current status: " + cycle.getStatus() + ")");
        }
    }

    private void assertOwnedByAdmin(Apartment apartment, Long adminId) {
        if (apartment.getAdmin() == null || !apartment.getAdmin().getId().equals(adminId)) {
            throw new UnauthorizedActionException("You do not manage this apartment");
        }
    }
}
