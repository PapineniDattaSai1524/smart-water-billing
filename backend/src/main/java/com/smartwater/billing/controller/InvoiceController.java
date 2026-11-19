package com.smartwater.billing.controller;

import com.smartwater.billing.service.InvoicePdfService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Week 5-6 Feature 3: shared invoice actions available to both RESIDENT and
 * ADMIN, unlike {@link BillingController} which is entirely admin-only.
 * Reuses the existing Invoice entity/repository via {@link InvoicePdfService}
 * -- no new invoice table or duplicate billing logic.
 */
@RestController
@RequestMapping("/api/v1/invoices")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Invoices", description = "Shared invoice actions: PDF download, available to residents (own household) and admins (own apartment)")
public class InvoiceController {

    private final InvoicePdfService invoicePdfService;

    @GetMapping("/{id}/pdf")
    @Operation(summary = "Download a real, itemized PDF for one invoice",
            description = "RESIDENT: only their own household's invoices. ADMIN: only invoices belonging to "
                    + "apartments they administer. SUPER_ADMIN: any invoice, per the existing authorization model.")
    public ResponseEntity<byte[]> downloadPdf(@PathVariable Long id) {
        // Fetch + authorize + generate all happen inside one @Transactional service
        // method now -- see InvoicePdfService.generateDownload() for why (fixes a
        // LazyInitializationException that previously fired on every download).
        InvoicePdfService.InvoiceDownload download = invoicePdfService.generateDownload(id);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(download.filename()).build().toString())
                .body(download.pdfBytes());
    }
}
