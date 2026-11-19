package com.smartwater.billing.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Platform-wide plausibility guardrails for individual water usage readings, bound from
 * {@code app.usage-validation.*} in application.properties.
 *
 * Root-cause context: {@code WaterUsageLogService.computeConsumption()} already rejects a
 * decreasing meter reading and an out-of-order reading date, but it had no upper bound on
 * the resulting single-reading consumption. That meant a data-entry mistake -- e.g. litres
 * typed into the kL field, or a raw cumulative meter serial pasted in instead of the actual
 * reading -- would pass every existing check (positive delta, later date) and be accepted
 * as-is, silently producing a household consumption figure in the hundreds of thousands of
 * kL. This does not change how legitimate readings are calculated; it only rejects a single
 * reading whose *implied* consumption is outside what any real residential household could
 * plausibly use, so the mistake is caught at entry time instead of flowing into the
 * dashboard, invoice, and billing engine.
 */
@Configuration
@ConfigurationProperties(prefix = "app.usage-validation")
@Getter
@Setter
public class UsageValidationProperties {

    /** Master switch — can be disabled per-deployment if a site genuinely has larger households/meters. */
    private boolean enabled = true;

    /**
     * Maximum plausible consumption (kL) implied by a single reading (current meter reading
     * minus the previous one). Far above any real residential household's usage between two
     * consecutive readings, so it only catches genuine data-entry/unit errors, not legitimate
     * high-usage households. Override via USAGE_MAX_SINGLE_READING_KL for sites with unusual
     * meter granularity (e.g. apartment-block-level shared meters).
     */
    private double maxSingleReadingKl = 500.0;

    /** Maximum plausible absolute meter reading (kL) accepted at all, regardless of delta. */
    private double maxMeterReadingKl = 1_000_000.0;
}
