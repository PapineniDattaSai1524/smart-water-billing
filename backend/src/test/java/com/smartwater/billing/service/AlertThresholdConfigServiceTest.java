package com.smartwater.billing.service;

import com.smartwater.billing.config.AlertProperties;
import com.smartwater.billing.dto.alert.AlertThresholdConfigRequest;
import com.smartwater.billing.dto.alert.AlertThresholdConfigResponse;
import com.smartwater.billing.entity.Apartment;
import com.smartwater.billing.entity.ApartmentAlertConfig;
import com.smartwater.billing.entity.User;
import com.smartwater.billing.exception.ResourceNotFoundException;
import com.smartwater.billing.exception.UnauthorizedActionException;
import com.smartwater.billing.repository.ApartmentAlertConfigRepository;
import com.smartwater.billing.repository.ApartmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AlertThresholdConfigServiceTest {

    @Mock private ApartmentAlertConfigRepository configRepository;
    @Mock private ApartmentRepository apartmentRepository;

    private AlertProperties alertProperties;
    private AlertThresholdConfigService alertThresholdConfigService;

    private User admin;
    private Apartment apartment;

    @BeforeEach
    void setUp() {
        alertProperties = new AlertProperties();
        alertProperties.setDailyThresholdKl(1.0);
        alertProperties.setAnomalyStdDevMultiplier(2.0);
        alertProperties.setMinHistoryReadings(7);

        alertThresholdConfigService = new AlertThresholdConfigService(configRepository, apartmentRepository, alertProperties);

        admin = User.builder().id(100L).fullName("Admin User").build();
        apartment = Apartment.builder().id(1L).name("Palm Residency").admin(admin).build();
    }

    // ---------- getForApartment ----------

    @Test
    void getForApartment_returnsPlatformDefaults_whenNoOverrideExists() {
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(apartment));
        when(configRepository.findByApartmentId(1L)).thenReturn(Optional.empty());

        AlertThresholdConfigResponse response = alertThresholdConfigService.getForApartment(1L, 100L);

        assertThat(response.getApartmentId()).isEqualTo(1L);
        assertThat(response.getDailyThresholdKl()).isNull();
        assertThat(response.isEnabled()).isTrue();
        assertThat(response.getEffectiveDailyThresholdKl()).isEqualTo(1.0);
        assertThat(response.getEffectiveAnomalyStdDevMultiplier()).isEqualTo(2.0);
        assertThat(response.getEffectiveMinHistoryReadings()).isEqualTo(7);
    }

    @Test
    void getForApartment_returnsOverrideValues_whenOverrideExists() {
        ApartmentAlertConfig override = ApartmentAlertConfig.builder().apartment(apartment)
                .dailyThresholdKl(5.0).anomalyStdDevMultiplier(3.0).minHistoryReadings(10).enabled(true).build();
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(apartment));
        when(configRepository.findByApartmentId(1L)).thenReturn(Optional.of(override));

        AlertThresholdConfigResponse response = alertThresholdConfigService.getForApartment(1L, 100L);

        assertThat(response.getDailyThresholdKl()).isEqualTo(5.0);
        assertThat(response.getEffectiveDailyThresholdKl()).isEqualTo(5.0);
        assertThat(response.getEffectiveAnomalyStdDevMultiplier()).isEqualTo(3.0);
        assertThat(response.getEffectiveMinHistoryReadings()).isEqualTo(10);
    }

    @Test
    void getForApartment_throwsUnauthorized_whenRequesterDoesNotManageApartment() {
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(apartment));

        assertThatThrownBy(() -> alertThresholdConfigService.getForApartment(1L, 999L))
                .isInstanceOf(UnauthorizedActionException.class);
        verifyNoInteractions(configRepository);
    }

    @Test
    void getForApartment_throwsResourceNotFound_whenApartmentDoesNotExist() {
        when(apartmentRepository.findById(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> alertThresholdConfigService.getForApartment(404L, 100L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ---------- upsert ----------

    @Test
    void upsert_createsNewOverride_whenNoneExistsYet() {
        AlertThresholdConfigRequest request = new AlertThresholdConfigRequest();
        request.setDailyThresholdKl(2.5);
        request.setAnomalyStdDevMultiplier(2.5);
        request.setMinHistoryReadings(5);
        request.setEnabled(true);

        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(apartment));
        when(configRepository.findByApartmentId(1L)).thenReturn(Optional.empty());
        when(configRepository.save(any(ApartmentAlertConfig.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AlertThresholdConfigResponse response = alertThresholdConfigService.upsert(1L, request, 100L);

        ArgumentCaptor<ApartmentAlertConfig> captor = ArgumentCaptor.forClass(ApartmentAlertConfig.class);
        verify(configRepository).save(captor.capture());
        assertThat(captor.getValue().getApartment()).isEqualTo(apartment);
        assertThat(captor.getValue().getDailyThresholdKl()).isEqualTo(2.5);
        assertThat(response.getEffectiveDailyThresholdKl()).isEqualTo(2.5);
    }

    @Test
    void upsert_updatesExistingOverride_ratherThanCreatingASecondRow() {
        ApartmentAlertConfig existing = ApartmentAlertConfig.builder().id(7L).apartment(apartment)
                .dailyThresholdKl(1.0).anomalyStdDevMultiplier(2.0).minHistoryReadings(7).enabled(true).build();
        AlertThresholdConfigRequest request = new AlertThresholdConfigRequest();
        request.setDailyThresholdKl(9.0);
        request.setAnomalyStdDevMultiplier(2.0);
        request.setMinHistoryReadings(7);
        request.setEnabled(true);

        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(apartment));
        when(configRepository.findByApartmentId(1L)).thenReturn(Optional.of(existing));
        when(configRepository.save(any(ApartmentAlertConfig.class))).thenAnswer(invocation -> invocation.getArgument(0));

        alertThresholdConfigService.upsert(1L, request, 100L);

        ArgumentCaptor<ApartmentAlertConfig> captor = ArgumentCaptor.forClass(ApartmentAlertConfig.class);
        verify(configRepository).save(captor.capture());
        assertThat(captor.getValue().getId()).isEqualTo(7L);
        assertThat(captor.getValue().getDailyThresholdKl()).isEqualTo(9.0);
    }

    @Test
    void upsert_defaultsEnabledToTrue_whenNotSuppliedInRequest() {
        AlertThresholdConfigRequest request = new AlertThresholdConfigRequest();
        request.setEnabled(null);

        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(apartment));
        when(configRepository.findByApartmentId(1L)).thenReturn(Optional.empty());
        when(configRepository.save(any(ApartmentAlertConfig.class))).thenAnswer(invocation -> invocation.getArgument(0));

        alertThresholdConfigService.upsert(1L, request, 100L);

        ArgumentCaptor<ApartmentAlertConfig> captor = ArgumentCaptor.forClass(ApartmentAlertConfig.class);
        verify(configRepository).save(captor.capture());
        assertThat(captor.getValue().isEnabled()).isTrue();
    }

    @Test
    void upsert_canDisableAlerts_forAnApartment() {
        AlertThresholdConfigRequest request = new AlertThresholdConfigRequest();
        request.setEnabled(false);

        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(apartment));
        when(configRepository.findByApartmentId(1L)).thenReturn(Optional.empty());
        when(configRepository.save(any(ApartmentAlertConfig.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AlertThresholdConfigResponse response = alertThresholdConfigService.upsert(1L, request, 100L);

        assertThat(response.isEnabled()).isFalse();
    }

    @Test
    void upsert_throwsUnauthorized_whenRequesterDoesNotManageApartment() {
        AlertThresholdConfigRequest request = new AlertThresholdConfigRequest();
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(apartment));

        assertThatThrownBy(() -> alertThresholdConfigService.upsert(1L, request, 999L))
                .isInstanceOf(UnauthorizedActionException.class);
        verifyNoInteractions(configRepository);
    }
}
