package com.smartwater.billing.util;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

/**
 * Parses and validates a single row of a water-usage CSV upload.
 * Expected header: household_id,reading_date,meter_reading_kl,remarks
 * reading_date format: yyyy-MM-dd
 */
public final class CsvUsageRowParser {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ISO_LOCAL_DATE;

    private CsvUsageRowParser() {
    }

    @Getter
    @AllArgsConstructor
    public static class ParsedRow {
        private final Long householdId;
        private final LocalDate readingDate;
        private final Double meterReadingKl;
        private final String remarks;
    }

    public static ParsedRow parse(String householdIdRaw, String readingDateRaw,
                                   String meterReadingRaw, String remarksRaw) {
        Long householdId;
        try {
            householdId = Long.parseLong(householdIdRaw.trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("household_id must be a valid numeric id, got: '" + householdIdRaw + "'");
        }

        LocalDate readingDate;
        try {
            readingDate = LocalDate.parse(readingDateRaw.trim(), DATE_FORMAT);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("reading_date must be in yyyy-MM-dd format, got: '" + readingDateRaw + "'");
        }
        if (readingDate.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("reading_date cannot be in the future: " + readingDate);
        }

        Double meterReading;
        try {
            meterReading = Double.parseDouble(meterReadingRaw.trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("meter_reading_kl must be a valid number, got: '" + meterReadingRaw + "'");
        }
        if (meterReading < 0) {
            throw new IllegalArgumentException("meter_reading_kl cannot be negative: " + meterReading);
        }

        return new ParsedRow(householdId, readingDate, meterReading,
                remarksRaw == null ? null : remarksRaw.trim());
    }
}
