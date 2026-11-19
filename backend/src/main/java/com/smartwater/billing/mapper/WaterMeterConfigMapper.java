package com.smartwater.billing.mapper;

import com.smartwater.billing.dto.meter.WaterMeterConfigResponse;
import com.smartwater.billing.entity.WaterMeterConfig;
import org.springframework.stereotype.Component;

@Component
public class WaterMeterConfigMapper {

    public WaterMeterConfigResponse toResponse(WaterMeterConfig config) {
        return WaterMeterConfigResponse.builder()
                .id(config.getId())
                .householdId(config.getHousehold().getId())
                .unitNumber(config.getHousehold().getUnitNumber())
                .meterNumber(config.getMeterNumber())
                .meterType(config.getMeterType().name())
                .installationDate(config.getInstallationDate())
                .initialReading(config.getInitialReading())
                .status(config.getStatus().name())
                .build();
    }
}
