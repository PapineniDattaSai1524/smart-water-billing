package com.smartwater.billing.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartwater.billing.dto.billing.BillingBreakdownResponse;
import com.smartwater.billing.dto.billing.TierChargeLine;
import com.smartwater.billing.entity.Household;
import com.smartwater.billing.entity.Invoice;
import com.smartwater.billing.entity.ResidentAssignment;
import com.smartwater.billing.exception.ResourceNotFoundException;
import com.smartwater.billing.exception.UnauthorizedActionException;
import com.smartwater.billing.repository.InvoiceRepository;
import com.smartwater.billing.repository.ResidentAssignmentRepository;
import com.smartwater.billing.security.CustomUserDetails;
import com.smartwater.billing.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Week 5-6 Feature 3: renders a real, per-household PDF invoice from an
 * actual {@link Invoice} row (and its stored {@link BillingBreakdownResponse}
 * JSON) -- never a static/mock document. One page per invoice.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InvoicePdfService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMM yyyy");
    private static final float MARGIN = 50f;

    private final ObjectMapper objectMapper;
    private final ResidentAssignmentRepository residentAssignmentRepository;
    private final InvoiceRepository invoiceRepository;

    /**
     * Single entry point for the {@code GET /invoices/{id}/pdf} controller.
     * <p>
     * Fixes a LazyInitializationException that occurred on every download: the
     * controller previously fetched the {@link Invoice} via the repository (whose
     * own short-lived transaction/session closes as soon as {@code findById}
     * returns, since {@code spring.jpa.open-in-view=false}), then generated the
     * PDF -- and built the download filename -- afterwards, outside any open
     * session. {@code Invoice.household} ({@code Household.apartment}) and
     * {@code ResidentAssignment.user} are all {@code FetchType.LAZY}, so those
     * proxy accesses failed with "no Session". Fetching, authorizing, generating,
     * and reading the household fields needed for the filename now all happen
     * inside this one {@code @Transactional} method, so lazy associations resolve
     * while the session is still open -- the same fix shape already applied to
     * {@code ResidentSelfService} (see docs/FIX_NOTES.md).
     */
    @Transactional(readOnly = true)
    public InvoiceDownload generateDownload(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> ResourceNotFoundException.of("Invoice", invoiceId));

        assertCanAccess(invoice);

        byte[] pdf = generate(invoice);
        String filename = "invoice-" + invoice.getHousehold().getUnitNumber()
                + "-" + invoice.getBillingMonth() + ".pdf";
        return new InvoiceDownload(pdf, filename);
    }

    /**
     * Never trusts a client-supplied identity for the ownership check -- always
     * resolves "who am I" from the authenticated JWT/SecurityContext via
     * {@link SecurityUtils}. Moved here (from InvoiceController) so it runs in
     * the same transaction as the fetch above.
     */
    private void assertCanAccess(Invoice invoice) {
        CustomUserDetails current = SecurityUtils.getCurrentUser();
        if (current == null) {
            throw new UnauthorizedActionException("Not authenticated.");
        }

        if ("SUPER_ADMIN".equals(current.getRole())) {
            return;
        }

        if ("ADMIN".equals(current.getRole())) {
            Long adminId = invoice.getHousehold().getApartment().getAdmin() != null
                    ? invoice.getHousehold().getApartment().getAdmin().getId() : null;
            if (!current.getId().equals(adminId)) {
                throw new UnauthorizedActionException("You do not administer this household's apartment.");
            }
            return;
        }

        // RESIDENT: must be an active resident of the household this invoice belongs to.
        boolean isMyHousehold = residentAssignmentRepository
                .findByHouseholdIdAndActiveTrue(invoice.getHousehold().getId())
                .stream()
                .anyMatch(a -> a.getUser().getId().equals(current.getId()));
        if (!isMyHousehold) {
            throw new UnauthorizedActionException("This invoice does not belong to your household.");
        }
    }

    /** Simple carrier for the generated PDF bytes plus the filename the controller should send. */
    public record InvoiceDownload(byte[] pdfBytes, String filename) {
    }

    public byte[] generate(Invoice invoice) {
        Household household = invoice.getHousehold();
        BillingBreakdownResponse breakdown = parseBreakdown(invoice.getBreakdownJson());
        String residentName = primaryResidentName(household.getId());

        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);

            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                float y = page.getMediaBox().getHeight() - MARGIN;
                float width = page.getMediaBox().getWidth() - 2 * MARGIN;

                y = title(cs, "SMART WATER BILLING", y);
                y -= 6;
                y = rule(cs, y, width);
                y -= 20;

                y = kv(cs, "Apartment", household.getApartment().getName(), y);
                y = kv(cs, "Household", household.getUnitNumber(), y);
                y = kv(cs, "Resident", residentName, y);
                y = kv(cs, "Invoice Number", "INV-" + invoice.getId(), y);
                y = kv(cs, "Billing Cycle", invoice.getBillingMonth(), y);
                y = kv(cs, "Invoice Date", invoice.getGeneratedAt() != null
                        ? invoice.getGeneratedAt().toLocalDate().format(DATE_FMT) : "-", y);
                y = kv(cs, "Due Date", invoice.getDueDate() != null ? invoice.getDueDate().format(DATE_FMT) : "-", y);
                y = kv(cs, "Consumption", formatKl(invoice.getConsumptionKl()), y);

                y -= 10;
                y = rule(cs, y, width);
                y -= 20;
                y = sectionHeading(cs, "TARIFF BREAKDOWN", y);
                y -= 4;

                if (breakdown != null && breakdown.getTierBreakdown() != null) {
                    for (TierChargeLine tier : breakdown.getTierBreakdown()) {
                        String label = tier.getMaxKl() != null
                                ? String.format("Tier %d (%s - %s kL @ Rs.%s/kL)",
                                        tier.getTierOrder(), fmt(tier.getMinKl()), fmt(tier.getMaxKl()), fmt(tier.getRatePerKl()))
                                : String.format("Tier %d (%s+ kL @ Rs.%s/kL)",
                                        tier.getTierOrder(), fmt(tier.getMinKl()), fmt(tier.getRatePerKl()));
                        y = chargeLine(cs, label, tier.getChargeForTier(), y);
                    }
                } else {
                    y = chargeLine(cs, "Base Water Charge", invoice.getBaseCharge(), y);
                }

                if (breakdown != null) {
                    if (nonZero(breakdown.getFixedCharge())) {
                        y = chargeLine(cs, "Fixed Charge", breakdown.getFixedCharge(), y);
                    }
                    if (nonZero(breakdown.getSharedCharge())) {
                        y = chargeLine(cs, "Shared Area Cost", breakdown.getSharedCharge(), y);
                    }
                    if (nonZero(breakdown.getTaxAmount())) {
                        y = chargeLine(cs, "Tax (" + fmt(breakdown.getTaxPercentage()) + "%)", breakdown.getTaxAmount(), y);
                    }
                    if (breakdown.isClamped()) {
                        y = chargeLine(cs, "Adjustment (min/max charge rule)",
                                invoice.getTotalAmount().subtract(breakdown.getPreClampTotal()), y);
                    }
                } else if (invoice.getTaxAmount() != null && invoice.getTaxAmount().signum() != 0) {
                    y = chargeLine(cs, "Tax", invoice.getTaxAmount(), y);
                }

                y -= 6;
                y = rule(cs, y, width);
                y -= 22;
                y = totalLine(cs, "TOTAL PAYABLE", invoice.getTotalAmount(), y);

                y -= 26;
                y = kv(cs, "Payment Status", invoice.getStatus().name(), y);
                if (invoice.getPaidAt() != null) {
                    y = kv(cs, "Paid On", invoice.getPaidAt().toLocalDate().format(DATE_FMT), y);
                }

                y -= 14;
                y = sectionHeading(cs, "PAYMENT INSTRUCTIONS", y);
                y -= 4;
                y = wrapped(cs,
                        "Pay via the Payments section of your resident dashboard, or contact your apartment "
                                + "administrator for offline payment options. Please reference the invoice number "
                                + "above with your payment.",
                        y, width);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();
        } catch (IOException e) {
            log.error("Failed to generate PDF for invoice {}: {}", invoice.getId(), e.getMessage());
            throw new UncheckedIOException("Could not generate invoice PDF", e);
        }
    }

    private String primaryResidentName(Long householdId) {
        List<ResidentAssignment> assignments = residentAssignmentRepository.findByHouseholdIdAndActiveTrue(householdId);
        return assignments.stream()
                .filter(a -> "PRIMARY".equals(a.getRelationType() != null ? a.getRelationType().name() : null))
                .findFirst()
                .or(() -> assignments.stream().findFirst())
                .map(a -> a.getUser().getFullName())
                .orElse("-");
    }

    private BillingBreakdownResponse parseBreakdown(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(json, BillingBreakdownResponse.class);
        } catch (Exception e) {
            log.warn("Could not parse stored breakdownJson, falling back to base fields only: {}", e.getMessage());
            return null;
        }
    }

    // ---------------- low-level PDFBox layout helpers ----------------

    private float title(PDPageContentStream cs, String text, float y) throws IOException {
        cs.beginText();
        cs.setFont(PDType1Font.HELVETICA_BOLD, 18);
        cs.newLineAtOffset(MARGIN, y);
        cs.showText(text);
        cs.endText();
        return y - 22;
    }

    private float sectionHeading(PDPageContentStream cs, String text, float y) throws IOException {
        cs.beginText();
        cs.setFont(PDType1Font.HELVETICA_BOLD, 12);
        cs.newLineAtOffset(MARGIN, y);
        cs.showText(text);
        cs.endText();
        return y - 16;
    }

    private float kv(PDPageContentStream cs, String label, String value, float y) throws IOException {
        cs.beginText();
        cs.setFont(PDType1Font.HELVETICA_BOLD, 11);
        cs.newLineAtOffset(MARGIN, y);
        cs.showText(label + ":");
        cs.endText();

        cs.beginText();
        cs.setFont(PDType1Font.HELVETICA, 11);
        cs.newLineAtOffset(MARGIN + 160, y);
        cs.showText(value != null ? value : "-");
        cs.endText();
        return y - 18;
    }

    private float chargeLine(PDPageContentStream cs, String label, BigDecimal amount, float y) throws IOException {
        cs.beginText();
        cs.setFont(PDType1Font.HELVETICA, 11);
        cs.newLineAtOffset(MARGIN, y);
        cs.showText(label);
        cs.endText();

        String amountStr = "Rs. " + fmt(amount);
        float textWidth = PDType1Font.HELVETICA.getStringWidth(amountStr) / 1000 * 11;
        cs.beginText();
        cs.setFont(PDType1Font.HELVETICA, 11);
        cs.newLineAtOffset(MARGIN + 495 - textWidth, y);
        cs.showText(amountStr);
        cs.endText();
        return y - 17;
    }

    private float totalLine(PDPageContentStream cs, String label, BigDecimal amount, float y) throws IOException {
        cs.beginText();
        cs.setFont(PDType1Font.HELVETICA_BOLD, 14);
        cs.newLineAtOffset(MARGIN, y);
        cs.showText(label);
        cs.endText();

        String amountStr = "Rs. " + fmt(amount);
        float textWidth = PDType1Font.HELVETICA_BOLD.getStringWidth(amountStr) / 1000 * 14;
        cs.beginText();
        cs.setFont(PDType1Font.HELVETICA_BOLD, 14);
        cs.newLineAtOffset(MARGIN + 495 - textWidth, y);
        cs.showText(amountStr);
        cs.endText();
        return y - 18;
    }

    private float rule(PDPageContentStream cs, float y, float width) throws IOException {
        cs.moveTo(MARGIN, y);
        cs.lineTo(MARGIN + width, y);
        cs.stroke();
        return y;
    }

    private float wrapped(PDPageContentStream cs, String text, float y, float width) throws IOException {
        float fontSize = 10;
        float leading = 14;
        int maxCharsPerLine = 95;
        cs.setFont(PDType1Font.HELVETICA, fontSize);
        List<String> lines = wrap(text, maxCharsPerLine);
        for (String line : lines) {
            cs.beginText();
            cs.newLineAtOffset(MARGIN, y);
            cs.showText(line);
            cs.endText();
            y -= leading;
        }
        return y;
    }

    private List<String> wrap(String text, int maxChars) {
        List<String> lines = new java.util.ArrayList<>();
        StringBuilder current = new StringBuilder();
        for (String word : text.split(" ")) {
            if (current.length() + word.length() + 1 > maxChars) {
                lines.add(current.toString());
                current = new StringBuilder();
            }
            if (current.length() > 0) {
                current.append(' ');
            }
            current.append(word);
        }
        if (current.length() > 0) {
            lines.add(current.toString());
        }
        return lines;
    }

    private static boolean nonZero(BigDecimal v) {
        return v != null && v.signum() != 0;
    }

    private static String fmt(BigDecimal v) {
        return v != null ? v.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString() : "0.00";
    }

    private static String formatKl(BigDecimal v) {
        return fmt(v) + " kL";
    }
}
