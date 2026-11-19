package com.smartwater.billing.service;

import com.smartwater.billing.dto.meter.WaterMeterConfigRequest;
import com.smartwater.billing.dto.meter.WaterMeterConfigResponse;
import com.smartwater.billing.entity.Household;
import com.smartwater.billing.entity.WaterMeterConfig;
import com.smartwater.billing.exception.DuplicateResourceException;
import com.smartwater.billing.exception.ResourceNotFoundException;
import com.smartwater.billing.mapper.WaterMeterConfigMapper;
import com.smartwater.billing.repository.HouseholdRepository;
import com.smartwater.billing.repository.WaterMeterConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WaterMeterConfigService {

    private final WaterMeterConfigRepository meterConfigRepository;
    private final HouseholdRepository householdRepository;
    private final WaterMeterConfigMapper meterConfigMapper;
    // Security fix (IDOR): getByHousehold previously returned any household's
    // meter config to any authenticated caller regardless of role/assignment.
    private final HouseholdAccessGuard householdAccessGuard;

    @Transactional
    public WaterMeterConfigResponse configure(WaterMeterConfigRequest request) {
        Household household = householdRepository.findById(request.getHouseholdId())
                .orElseThrow(() -> ResourceNotFoundException.of("Household", request.getHouseholdId()));

        if (meterConfigRepository.existsByHouseholdId(request.getHouseholdId())) {
            throw new DuplicateResourceException("A meter is already configured for this household");
        }
        if (meterConfigRepository.existsByMeterNumberIgnoreCase(request.getMeterNumber())) {
            throw new DuplicateResourceException("Meter number '" + request.getMeterNumber() + "' is already in use");
        }

        WaterMeterConfig config = WaterMeterConfig.builder()
                .household(household)
                .meterNumber(request.getMeterNumber())
                .meterType(request.getMeterType())
                .installationDate(request.getInstallationDate())
                .initialReading(request.getInitialReading() != null ? request.getInitialReading() : 0.0)
                .status(request.getStatus() != null ? request.getStatus() : com.smartwater.billing.entity.MeterStatus.ACTIVE)
                .build();

        household.setHasMeter(true);
        householdRepository.save(household);

        return meterConfigMapper.toResponse(meterConfigRepository.save(config));
    }

    @Transactional(readOnly = true)
    public WaterMeterConfigResponse getByHousehold(Long householdId) {
        Household household = householdRepository.findById(householdId)
                .orElseThrow(() -> ResourceNotFoundException.of("Household", householdId));
        householdAccessGuard.assertCanAccess(household);
        WaterMeterConfig config = meterConfigRepository.findByHouseholdId(householdId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No meter configuration found for household id: " + householdId));
        return meterConfigMapper.toResponse(config);
    }

    @Transactional(readOnly = true)
    public List<WaterMeterConfigResponse> getAll() {
        return meterConfigRepository.findAll().stream().map(meterConfigMapper::toResponse).toList();
    }

    @Transactional
    public WaterMeterConfigResponse update(Long id, WaterMeterConfigRequest request) {
        WaterMeterConfig config = meterConfigRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Water meter configuration", id));

        if (!config.getMeterNumber().equalsIgnoreCase(request.getMeterNumber())
                && meterConfigRepository.existsByMeterNumberIgnoreCase(request.getMeterNumber())) {
            throw new DuplicateResourceException("Meter number '" + request.getMeterNumber() + "' is already in use");
        }

        config.setMeterNumber(request.getMeterNumber());
        config.setMeterType(request.getMeterType());
        config.setInstallationDate(request.getInstallationDate());
        config.setInitialReading(request.getInitialReading());
        config.setStatus(request.getStatus());

        return meterConfigMapper.toResponse(meterConfigRepository.save(config));
    }

    @Transactional
    public void delete(Long id) {
        WaterMeterConfig config = meterConfigRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Water meter configuration", id));
        Household household = config.getHousehold();
        meterConfigRepository.delete(config);
        household.setHasMeter(false);
        householdRepository.save(household);
    }
}
