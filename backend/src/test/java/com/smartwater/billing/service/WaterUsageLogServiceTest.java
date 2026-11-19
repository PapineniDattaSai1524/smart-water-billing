package com.smartwater.billing.service;

import com.smartwater.billing.config.UsageValidationProperties;
import com.smartwater.billing.dto.usage.WaterUsageLogRequest;
import com.smartwater.billing.dto.usage.WaterUsageLogResponse;
import com.smartwater.billing.entity.*;
import com.smartwater.billing.exception.DuplicateResourceException;
import com.smartwater.billing.exception.InvalidRequestException;
import com.smartwater.billing.mapper.WaterUsageLogMapper;
import com.smartwater.billing.repository.HouseholdRepository;
import com.smartwater.billing.repository.UserRepository;
import com.smartwater.billing.repository.WaterMeterConfigRepository;
import com.smartwater.billing.repository.WaterUsageLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
class WaterUsageLogServiceTest {

    @Mock private WaterUsageLogRepository waterUsageLogRepository;
    @Mock private HouseholdRepository householdRepository;
    @Mock private WaterMeterConfigRepository waterMeterConfigRepository;
    @Mock private UserRepository userRepository;
    @Mock private WaterUsageLogMapper waterUsageLogMapper;
    @Mock private UsageValidationProperties usageValidationProperties;
    @Mock private HouseholdAccessGuard householdAccessGuard;

    @InjectMocks
    private WaterUsageLogService waterUsageLogService;

    private Household household;
    private WaterUsageLogRequest request;

    @BeforeEach
    void setUp() {
        Apartment apartment = Apartment.builder().id(1L).name("Green Valley").build();
        household = Household.builder().id(1L).apartment(apartment).unitNumber("A-101").build();

        request = new WaterUsageLogRequest();
        request.setHouseholdId(1L);
        request.setReadingDate(LocalDate.now());
        request.setMeterReadingKl(15.0);

        // Matches the real default from UsageValidationProperties/application.properties.
        // lenient() because not every test reaches the point where these are read (e.g. the
        // duplicate-reading test below throws before computeConsumption() is ever called).
        lenient().when(usageValidationProperties.isEnabled()).thenReturn(true);
        lenient().when(usageValidationProperties.getMaxSingleReadingKl()).thenReturn(500.0);
        lenient().when(usageValidationProperties.getMaxMeterReadingKl()).thenReturn(1_000_000.0);
    }

    @Test
    void logManualReading_throwsDuplicateResourceException_whenReadingAlreadyExistsForDate() {
        when(householdRepository.findById(1L)).thenReturn(Optional.of(household));
        when(waterUsageLogRepository.existsByHouseholdIdAndReadingDate(1L, request.getReadingDate())).thenReturn(true);

        assertThatThrownBy(() -> waterUsageLogService.logManualReading(request, 2L))
                .isInstanceOf(DuplicateResourceException.class);

        verify(waterUsageLogRepository, never()).save(any());
    }

    @Test
    void logManualReading_computesConsumption_asFirstReadingMinusMeterInitialReading() {
        when(householdRepository.findById(1L)).thenReturn(Optional.of(household));
        when(waterUsageLogRepository.existsByHouseholdIdAndReadingDate(1L, request.getReadingDate())).thenReturn(false);
        when(waterUsageLogRepository.findFirstByHouseholdIdOrderByReadingDateDesc(1L)).thenReturn(Optional.empty());
        WaterMeterConfig meterConfig = WaterMeterConfig.builder().household(household).initialReading(5.0).build();
        when(waterMeterConfigRepository.findByHouseholdId(1L)).thenReturn(Optional.of(meterConfig));
        when(userRepository.findById(2L)).thenReturn(Optional.empty());

        ArgumentCaptor<WaterUsageLog> captor = ArgumentCaptor.forClass(WaterUsageLog.class);
        when(waterUsageLogRepository.save(captor.capture())).thenAnswer(invocation -> invocation.getArgument(0));
        when(waterUsageLogMapper.toResponse(any())).thenReturn(
                WaterUsageLogResponse.builder().consumptionKl(10.0).build());

        WaterUsageLogResponse response = waterUsageLogService.logManualReading(request, 2L);

        assertThat(captor.getValue().getConsumptionKl()).isEqualTo(10.0); // 15.0 - 5.0 initial reading
        assertThat(response.getConsumptionKl()).isEqualTo(10.0);
    }

    @Test
    void logManualReading_throwsInvalidRequestException_whenReadingIsLessThanPrevious() {
        when(householdRepository.findById(1L)).thenReturn(Optional.of(household));
        when(waterUsageLogRepository.existsByHouseholdIdAndReadingDate(1L, request.getReadingDate())).thenReturn(false);
        WaterUsageLog previousLog = WaterUsageLog.builder()
                .household(household).readingDate(LocalDate.now().minusDays(1)).meterReadingKl(20.0).build();
        when(waterUsageLogRepository.findFirstByHouseholdIdOrderByReadingDateDesc(1L)).thenReturn(Optional.of(previousLog));

        assertThatThrownBy(() -> waterUsageLogService.logManualReading(request, 2L))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("cannot be less than the previous reading");

        verify(waterUsageLogRepository, never()).save(any());
    }

    @Test
    void logManualReading_throwsInvalidRequestException_whenReadingDateIsNotAfterPreviousReadingDate() {
        request.setReadingDate(LocalDate.now().minusDays(5));
        when(householdRepository.findById(1L)).thenReturn(Optional.of(household));
        when(waterUsageLogRepository.existsByHouseholdIdAndReadingDate(1L, request.getReadingDate())).thenReturn(false);
        WaterUsageLog previousLog = WaterUsageLog.builder()
                .household(household).readingDate(LocalDate.now().minusDays(1)).meterReadingKl(5.0).build();
        when(waterUsageLogRepository.findFirstByHouseholdIdOrderByReadingDateDesc(1L)).thenReturn(Optional.of(previousLog));

        assertThatThrownBy(() -> waterUsageLogService.logManualReading(request, 2L))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("must be after the last recorded reading date");
    }

    // ---- Plausibility guardrail (root-cause fix for the "899878 kL" class of data-entry bug) ----

    @Test
    void logManualReading_throwsInvalidRequestException_whenImpliedConsumptionIsImplausible() {
        // e.g. litres typed into the kL field, or a raw cumulative/serial meter number
        request.setMeterReadingKl(899878.0);
        when(householdRepository.findById(1L)).thenReturn(Optional.of(household));
        when(waterUsageLogRepository.existsByHouseholdIdAndReadingDate(1L, request.getReadingDate())).thenReturn(false);
        WaterUsageLog previousLog = WaterUsageLog.builder()
                .household(household).readingDate(LocalDate.now().minusDays(1)).meterReadingKl(120.0).build();
        when(waterUsageLogRepository.findFirstByHouseholdIdOrderByReadingDateDesc(1L)).thenReturn(Optional.of(previousLog));

        assertThatThrownBy(() -> waterUsageLogService.logManualReading(request, 2L))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("plausible residential");

        verify(waterUsageLogRepository, never()).save(any());
    }

    @Test
    void logManualReading_throwsInvalidRequestException_whenAbsoluteMeterReadingExceedsCeiling() {
        request.setMeterReadingKl(2_000_000.0);
        when(householdRepository.findById(1L)).thenReturn(Optional.of(household));
        when(waterUsageLogRepository.existsByHouseholdIdAndReadingDate(1L, request.getReadingDate())).thenReturn(false);

        assertThatThrownBy(() -> waterUsageLogService.logManualReading(request, 2L))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("exceeds the plausible maximum");

        verify(waterUsageLogRepository, never()).save(any());
    }

    @Test
    void logManualReading_allowsNormalResidentialReading_wellUnderGuardrailThresholds() {
        when(householdRepository.findById(1L)).thenReturn(Optional.of(household));
        when(waterUsageLogRepository.existsByHouseholdIdAndReadingDate(1L, request.getReadingDate())).thenReturn(false);
        when(waterUsageLogRepository.findFirstByHouseholdIdOrderByReadingDateDesc(1L)).thenReturn(Optional.empty());
        when(waterMeterConfigRepository.findByHouseholdId(1L)).thenReturn(Optional.empty());
        when(waterUsageLogRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(waterUsageLogMapper.toResponse(any())).thenReturn(
                WaterUsageLogResponse.builder().consumptionKl(15.0).build());

        WaterUsageLogResponse response = waterUsageLogService.logManualReading(request, 2L);

        assertThat(response.getConsumptionKl()).isEqualTo(15.0); // 15.0 - 0.0 initial reading, well under 500 kL cap
    }
}
