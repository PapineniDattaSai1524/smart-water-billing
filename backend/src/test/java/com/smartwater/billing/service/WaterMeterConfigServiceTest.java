package com.smartwater.billing.service;

import com.smartwater.billing.dto.meter.WaterMeterConfigRequest;
import com.smartwater.billing.dto.meter.WaterMeterConfigResponse;
import com.smartwater.billing.entity.Household;
import com.smartwater.billing.entity.MeterStatus;
import com.smartwater.billing.entity.MeterType;
import com.smartwater.billing.entity.WaterMeterConfig;
import com.smartwater.billing.exception.DuplicateResourceException;
import com.smartwater.billing.exception.ResourceNotFoundException;
import com.smartwater.billing.mapper.WaterMeterConfigMapper;
import com.smartwater.billing.repository.HouseholdRepository;
import com.smartwater.billing.repository.WaterMeterConfigRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WaterMeterConfigServiceTest {

    @Mock private WaterMeterConfigRepository meterConfigRepository;
    @Mock private HouseholdRepository householdRepository;
    @Mock private WaterMeterConfigMapper meterConfigMapper;
    @Mock private HouseholdAccessGuard householdAccessGuard;

    @InjectMocks
    private WaterMeterConfigService waterMeterConfigService;

    private WaterMeterConfigRequest request;
    private Household household;
    private WaterMeterConfig config;

    @BeforeEach
    void setUp() {
        household = Household.builder().id(1L).unitNumber("A-101").hasMeter(false).build();

        request = new WaterMeterConfigRequest();
        request.setHouseholdId(1L);
        request.setMeterNumber("MTR-001");
        request.setMeterType(MeterType.DIGITAL);
        request.setInstallationDate(LocalDate.of(2026, 1, 1));
        request.setInitialReading(0.0);
        request.setStatus(MeterStatus.ACTIVE);

        config = WaterMeterConfig.builder().id(1L).household(household).meterNumber("MTR-001")
                .meterType(MeterType.DIGITAL).installationDate(LocalDate.of(2026, 1, 1))
                .initialReading(0.0).status(MeterStatus.ACTIVE).build();
    }

    @Test
    void configure_savesConfigAndMarksHouseholdHasMeter_whenHouseholdExistsAndNoDuplicates() {
        when(householdRepository.findById(1L)).thenReturn(Optional.of(household));
        when(meterConfigRepository.existsByHouseholdId(1L)).thenReturn(false);
        when(meterConfigRepository.existsByMeterNumberIgnoreCase("MTR-001")).thenReturn(false);
        when(meterConfigRepository.save(any(WaterMeterConfig.class))).thenReturn(config);
        when(meterConfigMapper.toResponse(config)).thenReturn(
                WaterMeterConfigResponse.builder().id(1L).householdId(1L).meterNumber("MTR-001").build());

        WaterMeterConfigResponse response = waterMeterConfigService.configure(request);

        assertThat(response.getMeterNumber()).isEqualTo("MTR-001");
        assertThat(household.isHasMeter()).isTrue();
        verify(householdRepository).save(household);
        verify(meterConfigRepository).save(any(WaterMeterConfig.class));
    }

    @Test
    void configure_throwsResourceNotFoundException_whenHouseholdDoesNotExist() {
        when(householdRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> waterMeterConfigService.configure(request))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(meterConfigRepository, never()).save(any());
    }

    @Test
    void configure_throwsDuplicateResourceException_whenHouseholdAlreadyHasAMeter() {
        when(householdRepository.findById(1L)).thenReturn(Optional.of(household));
        when(meterConfigRepository.existsByHouseholdId(1L)).thenReturn(true);

        assertThatThrownBy(() -> waterMeterConfigService.configure(request))
                .isInstanceOf(DuplicateResourceException.class);

        verify(meterConfigRepository, never()).save(any());
    }

    @Test
    void configure_throwsDuplicateResourceException_whenMeterNumberAlreadyInUse() {
        when(householdRepository.findById(1L)).thenReturn(Optional.of(household));
        when(meterConfigRepository.existsByHouseholdId(1L)).thenReturn(false);
        when(meterConfigRepository.existsByMeterNumberIgnoreCase("MTR-001")).thenReturn(true);

        assertThatThrownBy(() -> waterMeterConfigService.configure(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("MTR-001");

        verify(meterConfigRepository, never()).save(any());
    }

    @Test
    void getByHousehold_returnsConfig_whenFound() {
        when(householdRepository.findById(1L)).thenReturn(Optional.of(household));
        when(meterConfigRepository.findByHouseholdId(1L)).thenReturn(Optional.of(config));
        when(meterConfigMapper.toResponse(config)).thenReturn(
                WaterMeterConfigResponse.builder().id(1L).householdId(1L).meterNumber("MTR-001").build());

        WaterMeterConfigResponse response = waterMeterConfigService.getByHousehold(1L);

        assertThat(response.getMeterNumber()).isEqualTo("MTR-001");
    }

    @Test
    void getByHousehold_throwsResourceNotFoundException_whenNoConfigExists() {
        when(householdRepository.findById(1L)).thenReturn(Optional.of(household));
        when(meterConfigRepository.findByHouseholdId(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> waterMeterConfigService.getByHousehold(1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void update_throwsDuplicateResourceException_whenNewMeterNumberAlreadyUsedByAnotherConfig() {
        WaterMeterConfigRequest updateRequest = new WaterMeterConfigRequest();
        updateRequest.setHouseholdId(1L);
        updateRequest.setMeterNumber("MTR-999");
        updateRequest.setMeterType(MeterType.SMART_IOT);
        updateRequest.setInstallationDate(LocalDate.of(2026, 2, 1));
        updateRequest.setInitialReading(5.0);
        updateRequest.setStatus(MeterStatus.ACTIVE);

        when(meterConfigRepository.findById(1L)).thenReturn(Optional.of(config));
        when(meterConfigRepository.existsByMeterNumberIgnoreCase("MTR-999")).thenReturn(true);

        assertThatThrownBy(() -> waterMeterConfigService.update(1L, updateRequest))
                .isInstanceOf(DuplicateResourceException.class);

        verify(meterConfigRepository, never()).save(any());
    }

    @Test
    void update_allowsSameMeterNumber_whenUnchangedOnTheSameConfig() {
        when(meterConfigRepository.findById(1L)).thenReturn(Optional.of(config));
        when(meterConfigRepository.save(any(WaterMeterConfig.class))).thenReturn(config);
        when(meterConfigMapper.toResponse(config)).thenReturn(
                WaterMeterConfigResponse.builder().id(1L).householdId(1L).meterNumber("MTR-001").build());

        WaterMeterConfigResponse response = waterMeterConfigService.update(1L, request);

        assertThat(response.getMeterNumber()).isEqualTo("MTR-001");
        verify(meterConfigRepository, never()).existsByMeterNumberIgnoreCase(any());
        verify(meterConfigRepository).save(config);
    }

    @Test
    void delete_removesConfigAndClearsHouseholdHasMeter_whenFound() {
        household.setHasMeter(true);
        when(meterConfigRepository.findById(1L)).thenReturn(Optional.of(config));

        waterMeterConfigService.delete(1L);

        verify(meterConfigRepository).delete(config);
        assertThat(household.isHasMeter()).isFalse();
        verify(householdRepository).save(household);
    }

    @Test
    void delete_throwsResourceNotFoundException_whenNotFound() {
        when(meterConfigRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> waterMeterConfigService.delete(1L))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(meterConfigRepository, never()).delete(any(WaterMeterConfig.class));
    }
}
