package com.smartwater.billing.service;

import com.smartwater.billing.entity.Apartment;
import com.smartwater.billing.entity.Invoice;
import com.smartwater.billing.entity.WaterUsageLog;
import com.smartwater.billing.repository.ApartmentRepository;
import com.smartwater.billing.repository.InvoiceRepository;
import com.smartwater.billing.repository.WaterUsageLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;

/**
 * Builds simple, dependency-free CSV exports for the Reports screens.
 * (PDF/Excel export can be layered on top of these same queries later;
 * CSV opens natively in Excel/Sheets and needs no extra library.)
 */
@Service
@RequiredArgsConstructor
public class CsvExportService {

    private final InvoiceRepository invoiceRepository;
    private final WaterUsageLogRepository waterUsageLogRepository;
    private final ApartmentRepository apartmentRepository;

    @Transactional(readOnly = true)
    public byte[] exportInvoicesForAdmin(Long adminId) {
        StringBuilder sb = new StringBuilder();
        sb.append("Unit,Apartment,Billing Month,Consumption (KL),Rate/KL,Fixed Charge,Total Amount,Status,Due Date,Paid At\n");
        for (Invoice i : invoiceRepository.findAllForAdmin(adminId)) {
            sb.append(csv(i.getHousehold().getUnitNumber())).append(',')
                    .append(csv(i.getHousehold().getApartment().getName())).append(',')
                    .append(csv(i.getBillingMonth())).append(',')
                    .append(i.getConsumptionKl()).append(',')
                    .append(i.getRatePerKl()).append(',')
                    .append(i.getFixedCharge()).append(',')
                    .append(i.getTotalAmount()).append(',')
                    .append(i.getStatus()).append(',')
                    .append(i.getDueDate()).append(',')
                    .append(i.getPaidAt() == null ? "" : i.getPaidAt())
                    .append('\n');
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    @Transactional(readOnly = true)
    public byte[] exportUsageForAdmin(Long adminId) {
        StringBuilder sb = new StringBuilder();
        sb.append("Unit,Reading Date,Meter Reading (KL),Consumption (KL),Source\n");
        for (WaterUsageLog w : waterUsageLogRepository.findAllForAdmin(adminId)) {
            sb.append(csv(w.getHousehold().getUnitNumber())).append(',')
                    .append(w.getReadingDate()).append(',')
                    .append(w.getMeterReadingKl()).append(',')
                    .append(w.getConsumptionKl()).append(',')
                    .append(w.getSource())
                    .append('\n');
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    @Transactional(readOnly = true)
    public byte[] exportApartmentsPlatformWide() {
        StringBuilder sb = new StringBuilder();
        sb.append("Apartment,City,State,Total Units,Community,Administrator\n");
        for (Apartment a : apartmentRepository.findAll()) {
            sb.append(csv(a.getName())).append(',')
                    .append(csv(a.getCity())).append(',')
                    .append(csv(a.getState())).append(',')
                    .append(a.getTotalUnits()).append(',')
                    .append(csv(a.getCommunity() != null ? a.getCommunity().getName() : "")).append(',')
                    .append(csv(a.getAdmin() != null ? a.getAdmin().getFullName() : ""))
                    .append('\n');
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String csv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
