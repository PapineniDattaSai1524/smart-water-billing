package com.smartwater.billing.mapper;

import com.smartwater.billing.dto.usage.WaterUsageLogResponse;
import com.smartwater.billing.entity.WaterUsageLog;
import org.springframework.stereotype.Component;

@Component
public class WaterUsageLogMapper {

    public WaterUsageLogResponse toResponse(WaterUsageLog log) {
        return WaterUsageLogResponse.builder()
                .id(log.getId())
                .householdId(log.getHousehold().getId())
                .unitNumber(log.getHousehold().getUnitNumber())
                .readingDate(log.getReadingDate())
                .meterReadingKl(log.getMeterReadingKl())
                .consumptionKl(log.getConsumptionKl())
                .source(log.getSource().name())
                .recordedByName(log.getRecordedBy() != null ? log.getRecordedBy().getFullName() : null)
                .remarks(log.getRemarks())
                .build();
    }
}
