package com.smartwater.billing.service;

import com.smartwater.billing.config.UsageValidationProperties;
import com.smartwater.billing.dto.usage.CsvUploadResultResponse;
import com.smartwater.billing.dto.usage.WaterUsageLogRequest;
import com.smartwater.billing.dto.usage.WaterUsageLogResponse;
import com.smartwater.billing.entity.*;
import com.smartwater.billing.exception.DuplicateResourceException;
import com.smartwater.billing.exception.InvalidRequestException;
import com.smartwater.billing.exception.ResourceNotFoundException;
import com.smartwater.billing.mapper.WaterUsageLogMapper;
import com.smartwater.billing.repository.HouseholdRepository;
import com.smartwater.billing.repository.UserRepository;
import com.smartwater.billing.repository.WaterMeterConfigRepository;
import com.smartwater.billing.repository.WaterUsageLogRepository;
import com.smartwater.billing.util.CsvUsageRowParser;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class WaterUsageLogService {

    private final WaterUsageLogRepository waterUsageLogRepository;
    private final HouseholdRepository householdRepository;
    private final WaterMeterConfigRepository waterMeterConfigRepository;
    private final UserRepository userRepository;
    private final WaterUsageLogMapper waterUsageLogMapper;
    private final UsageValidationProperties usageValidationProperties;
    // Security fix (IDOR): these methods previously took a bare householdId
    // path/body parameter and only checked that the household existed -- not
    // that the caller had any right to see or write data for it. See
    // HouseholdAccessGuard for the shared ownership-check rule.
    private final HouseholdAccessGuard householdAccessGuard;

    @Transactional
    public WaterUsageLogResponse logManualReading(WaterUsageLogRequest request, Long recordedByUserId) {
        Household household = householdRepository.findById(request.getHouseholdId())
                .orElseThrow(() -> ResourceNotFoundException.of("Household", request.getHouseholdId()));
        householdAccessGuard.assertCanAccess(household);

        if (waterUsageLogRepository.existsByHouseholdIdAndReadingDate(
                request.getHouseholdId(), request.getReadingDate())) {
            throw new DuplicateResourceException(
                    "A usage reading for household " + request.getHouseholdId()
                            + " on " + request.getReadingDate() + " already exists");
        }

        double consumption = computeConsumption(household.getId(), request.getReadingDate(), request.getMeterReadingKl());

        User recordedBy = recordedByUserId != null ? userRepository.findById(recordedByUserId).orElse(null) : null;

        WaterUsageLog log = WaterUsageLog.builder()
                .household(household)
                .readingDate(request.getReadingDate())
                .meterReadingKl(request.getMeterReadingKl())
                .consumptionKl(consumption)
                .source(UsageSource.MANUAL)
                .recordedBy(recordedBy)
                .remarks(request.getRemarks())
                .build();

        return waterUsageLogMapper.toResponse(waterUsageLogRepository.save(log));
    }

    @Transactional(readOnly = true)
    public List<WaterUsageLogResponse> getByHousehold(Long householdId) {
        Household household = householdRepository.findById(householdId)
                .orElseThrow(() -> ResourceNotFoundException.of("Household", householdId));
        householdAccessGuard.assertCanAccess(household);
        return waterUsageLogRepository.findByHouseholdIdOrderByReadingDateDesc(householdId).stream()
                .map(waterUsageLogMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<WaterUsageLogResponse> getByHouseholdAndDateRange(Long householdId, LocalDate from, LocalDate to) {
        Household household = householdRepository.findById(householdId)
                .orElseThrow(() -> ResourceNotFoundException.of("Household", householdId));
        householdAccessGuard.assertCanAccess(household);
        if (from.isAfter(to)) {
            throw new InvalidRequestException("'from' date must not be after 'to' date");
        }
        return waterUsageLogRepository
                .findByHouseholdIdAndReadingDateBetweenOrderByReadingDateAsc(householdId, from, to).stream()
                .map(waterUsageLogMapper::toResponse)
                .toList();
    }

    // Building Owner Water Usage dashboard: most-recent readings across every household the
    // admin owns (reuses the same admin-scoped query the CSV export already relies on), capped
    // to `limit` rows so the dashboard never pulls a building's entire reading history just to
    // render a "recent activity" table.
    @Transactional(readOnly = true)
    public List<WaterUsageLogResponse> getRecentForAdmin(Long adminId, int limit) {
        return waterUsageLogRepository.findAllForAdmin(adminId).stream()
                .limit(Math.max(1, limit))
                .map(waterUsageLogMapper::toResponse)
                .toList();
    }

    @Transactional
    public void delete(Long id) {
        WaterUsageLog log = waterUsageLogRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Water usage log", id));
        waterUsageLogRepository.delete(log);
    }

    /**
     * Bulk CSV upload for water usage readings.
     * Expected header: household_id,reading_date,meter_reading_kl,remarks
     * Performs row-level validation, duplicate detection (per household+date,
     * both against existing DB records and within the same file), and
     * reports a per-row error summary without failing the entire batch.
     */
    @Transactional
    public CsvUploadResultResponse uploadCsv(MultipartFile file, Long recordedByUserId) {
        if (file == null || file.isEmpty()) {
            throw new InvalidRequestException("Uploaded CSV file must not be empty");
        }

        List<String> errors = new ArrayList<>();
        int totalRows = 0;
        int successCount = 0;
        int duplicateCount = 0;
        int errorCount = 0;

        User recordedBy = recordedByUserId != null ? userRepository.findById(recordedByUserId).orElse(null) : null;

        try (CSVParser parser = CSVParser.parse(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8),
                CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).setTrim(true).build())) {

            List<String> seenInFile = new ArrayList<>();

            for (CSVRecord record : parser) {
                totalRows++;
                long rowNum = record.getRecordNumber() + 1; // +1 to account for header line
                try {
                    CsvUsageRowParser.ParsedRow row = CsvUsageRowParser.parse(
                            get(record, "household_id"),
                            get(record, "reading_date"),
                            get(record, "meter_reading_kl"),
                            get(record, "remarks"));

                    String dedupeKey = row.getHouseholdId() + "|" + row.getReadingDate();
                    if (seenInFile.contains(dedupeKey)) {
                        duplicateCount++;
                        errors.add("Row " + rowNum + ": duplicate entry within uploaded file for household "
                                + row.getHouseholdId() + " on " + row.getReadingDate());
                        continue;
                    }

                    Household household = householdRepository.findById(row.getHouseholdId()).orElse(null);
                    if (household == null) {
                        errorCount++;
                        errors.add("Row " + rowNum + ": household id " + row.getHouseholdId() + " does not exist");
                        continue;
                    }

                    if (waterUsageLogRepository.existsByHouseholdIdAndReadingDate(row.getHouseholdId(), row.getReadingDate())) {
                        duplicateCount++;
                        errors.add("Row " + rowNum + ": a reading for household " + row.getHouseholdId()
                                + " on " + row.getReadingDate() + " already exists in the system");
                        continue;
                    }

                    double consumption = computeConsumption(row.getHouseholdId(), row.getReadingDate(), row.getMeterReadingKl());

                    WaterUsageLog log = WaterUsageLog.builder()
                            .household(household)
                            .readingDate(row.getReadingDate())
                            .meterReadingKl(row.getMeterReadingKl())
                            .consumptionKl(consumption)
                            .source(UsageSource.CSV_UPLOAD)
                            .recordedBy(recordedBy)
                            .remarks(row.getRemarks())
                            .build();

                    waterUsageLogRepository.save(log);
                    seenInFile.add(dedupeKey);
                    successCount++;

                } catch (IllegalArgumentException ex) {
                    errorCount++;
                    errors.add("Row " + rowNum + ": " + ex.getMessage());
                }
            }
        } catch (IOException e) {
            throw new InvalidRequestException("Failed to read CSV file: " + e.getMessage());
        }

        return CsvUploadResultResponse.builder()
                .totalRows(totalRows)
                .successCount(successCount)
                .duplicateCount(duplicateCount)
                .errorCount(errorCount)
                .errors(errors)
                .build();
    }

    private String get(CSVRecord record, String column) {
        return record.isMapped(column) ? record.get(column) : "";
    }

    /**
     * Consumption = current meter reading - previous reading (either the
     * most recent prior log entry, or the meter's initial reading if this
     * is the household's first entry).
     */
    private double computeConsumption(Long householdId, LocalDate readingDate, double currentReading) {
        if (usageValidationProperties.isEnabled() && currentReading > usageValidationProperties.getMaxMeterReadingKl()) {
            throw new InvalidRequestException(
                    "Meter reading (" + currentReading + " kL) exceeds the plausible maximum ("
                            + usageValidationProperties.getMaxMeterReadingKl() + " kL). Check that the value was "
                            + "entered in kilolitres (not litres) and that it is the meter's current reading, "
                            + "not a serial/cumulative lifetime number.");
        }

        Optional<WaterUsageLog> previousLog = waterUsageLogRepository.findFirstByHouseholdIdOrderByReadingDateDesc(householdId);

        double previousReading;
        if (previousLog.isPresent()) {
            if (!readingDate.isAfter(previousLog.get().getReadingDate())) {
                throw new InvalidRequestException(
                        "Reading date " + readingDate + " must be after the last recorded reading date ("
                                + previousLog.get().getReadingDate() + ") for this household");
            }
            previousReading = previousLog.get().getMeterReadingKl();
        } else {
            previousReading = waterMeterConfigRepository.findByHouseholdId(householdId)
                    .map(WaterMeterConfig::getInitialReading)
                    .orElse(0.0);
        }

        double consumption = currentReading - previousReading;
        if (consumption < 0) {
            throw new InvalidRequestException(
                    "Meter reading (" + currentReading + ") cannot be less than the previous reading (" + previousReading + ")");
        }
        if (usageValidationProperties.isEnabled() && consumption > usageValidationProperties.getMaxSingleReadingKl()) {
            throw new InvalidRequestException(
                    "This reading implies " + consumption + " kL of consumption since the last reading ("
                            + previousReading + " kL on record), which is above the plausible residential "
                            + "maximum of " + usageValidationProperties.getMaxSingleReadingKl() + " kL. "
                            + "Double-check the unit (litres vs kilolitres) and the meter value before re-submitting. "
                            + "If this household genuinely uses more, raise app.usage-validation.max-single-reading-kl.");
        }
        return consumption;
    }
}
