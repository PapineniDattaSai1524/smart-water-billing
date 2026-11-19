package com.smartwater.billing.service;

import com.smartwater.billing.config.AlertProperties;
import com.smartwater.billing.dto.alert.AlertThresholdConfigRequest;
import com.smartwater.billing.dto.alert.AlertThresholdConfigResponse;
import com.smartwater.billing.entity.Apartment;
import com.smartwater.billing.entity.ApartmentAlertConfig;
import com.smartwater.billing.exception.ResourceNotFoundException;
import com.smartwater.billing.exception.UnauthorizedActionException;
import com.smartwater.billing.repository.ApartmentAlertConfigRepository;
import com.smartwater.billing.repository.ApartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Lets an apartment admin view/override the platform-wide alert defaults for their apartment. */
@Service
@RequiredArgsConstructor
public class AlertThresholdConfigService {

    private final ApartmentAlertConfigRepository configRepository;
    private final ApartmentRepository apartmentRepository;
    private final AlertProperties alertProperties;

    @Transactional(readOnly = true)
    public AlertThresholdConfigResponse getForApartment(Long apartmentId, Long adminId) {
        Apartment apartment = getOwnedApartment(apartmentId, adminId);
        ApartmentAlertConfig config = configRepository.findByApartmentId(apartmentId).orElse(null);
        return toResponse(apartment, config);
    }

    @Transactional
    public AlertThresholdConfigResponse upsert(Long apartmentId, AlertThresholdConfigRequest request, Long adminId) {
        Apartment apartment = getOwnedApartment(apartmentId, adminId);

        ApartmentAlertConfig config = configRepository.findByApartmentId(apartmentId)
                .orElseGet(() -> ApartmentAlertConfig.builder().apartment(apartment).build());

        config.setDailyThresholdKl(request.getDailyThresholdKl());
        config.setAnomalyStdDevMultiplier(request.getAnomalyStdDevMultiplier());
        config.setMinHistoryReadings(request.getMinHistoryReadings());
        config.setEnabled(request.getEnabled() == null || request.getEnabled());

        return toResponse(apartment, configRepository.save(config));
    }

    private Apartment getOwnedApartment(Long apartmentId, Long adminId) {
        Apartment apartment = apartmentRepository.findById(apartmentId)
                .orElseThrow(() -> ResourceNotFoundException.of("Apartment", apartmentId));
        if (apartment.getAdmin() == null || !apartment.getAdmin().getId().equals(adminId)) {
            throw new UnauthorizedActionException("You do not manage this apartment");
        }
        return apartment;
    }

    private AlertThresholdConfigResponse toResponse(Apartment apartment, ApartmentAlertConfig config) {
        Double daily = config != null ? config.getDailyThresholdKl() : null;
        Double multiplier = config != null ? config.getAnomalyStdDevMultiplier() : null;
        Integer minHistory = config != null ? config.getMinHistoryReadings() : null;
        boolean enabled = config == null || config.isEnabled();

        return AlertThresholdConfigResponse.builder()
                .apartmentId(apartment.getId())
                .apartmentName(apartment.getName())
                .dailyThresholdKl(daily)
                .anomalyStdDevMultiplier(multiplier)
                .minHistoryReadings(minHistory)
                .enabled(enabled)
                .effectiveDailyThresholdKl(daily != null ? daily : alertProperties.getDailyThresholdKl())
                .effectiveAnomalyStdDevMultiplier(multiplier != null ? multiplier : alertProperties.getAnomalyStdDevMultiplier())
                .effectiveMinHistoryReadings(minHistory != null ? minHistory : alertProperties.getMinHistoryReadings())
                .build();
    }
}
