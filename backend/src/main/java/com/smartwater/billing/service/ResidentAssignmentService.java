package com.smartwater.billing.service;

import com.smartwater.billing.dto.resident.ResidentAssignmentRequest;
import com.smartwater.billing.dto.resident.ResidentAssignmentResponse;
import com.smartwater.billing.entity.Household;
import com.smartwater.billing.entity.ResidentAssignment;
import com.smartwater.billing.entity.User;
import com.smartwater.billing.exception.DuplicateResourceException;
import com.smartwater.billing.exception.InvalidRequestException;
import com.smartwater.billing.exception.ResourceNotFoundException;
import com.smartwater.billing.mapper.ResidentAssignmentMapper;
import com.smartwater.billing.repository.HouseholdRepository;
import com.smartwater.billing.repository.ResidentAssignmentRepository;
import com.smartwater.billing.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ResidentAssignmentService {

    private final ResidentAssignmentRepository residentAssignmentRepository;
    private final HouseholdRepository householdRepository;
    private final UserRepository userRepository;
    private final ResidentAssignmentMapper residentAssignmentMapper;

    @Transactional
    public ResidentAssignmentResponse assign(ResidentAssignmentRequest request) {
        Household household = householdRepository.findById(request.getHouseholdId())
                .orElseThrow(() -> ResourceNotFoundException.of("Household", request.getHouseholdId()));
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> ResourceNotFoundException.of("User", request.getUserId()));

        if (residentAssignmentRepository.existsByHouseholdIdAndUserIdAndActiveTrue(
                request.getHouseholdId(), request.getUserId())) {
            throw new DuplicateResourceException("This resident is already actively assigned to this household");
        }

        if (request.getRelationType().name().equals("PRIMARY")) {
            boolean primaryExists = residentAssignmentRepository.findByHouseholdIdAndActiveTrue(household.getId())
                    .stream().anyMatch(ra -> ra.getRelationType().name().equals("PRIMARY"));
            if (primaryExists) {
                throw new InvalidRequestException("This household already has an active primary resident");
            }
        }

        ResidentAssignment assignment = ResidentAssignment.builder()
                .household(household)
                .user(user)
                .relationType(request.getRelationType())
                .moveInDate(request.getMoveInDate())
                .moveOutDate(request.getMoveOutDate())
                .active(true)
                .build();

        return residentAssignmentMapper.toResponse(residentAssignmentRepository.save(assignment));
    }

    @Transactional(readOnly = true)
    public List<ResidentAssignmentResponse> getByHousehold(Long householdId) {
        if (!householdRepository.existsById(householdId)) {
            throw ResourceNotFoundException.of("Household", householdId);
        }
        return residentAssignmentRepository.findByHouseholdId(householdId).stream()
                .map(residentAssignmentMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ResidentAssignmentResponse> getByUser(Long userId) {
        return residentAssignmentRepository.findByUserId(userId).stream()
                .map(residentAssignmentMapper::toResponse)
                .toList();
    }

    @Transactional
    public ResidentAssignmentResponse update(Long id, ResidentAssignmentRequest request) {
        ResidentAssignment assignment = findOrThrow(id);
        assignment.setRelationType(request.getRelationType());
        assignment.setMoveInDate(request.getMoveInDate());
        assignment.setMoveOutDate(request.getMoveOutDate());
        return residentAssignmentMapper.toResponse(residentAssignmentRepository.save(assignment));
    }

    @Transactional
    public void deactivate(Long id) {
        ResidentAssignment assignment = findOrThrow(id);
        assignment.setActive(false);
        residentAssignmentRepository.save(assignment);
    }

    @Transactional
    public void delete(Long id) {
        residentAssignmentRepository.delete(findOrThrow(id));
    }

    private ResidentAssignment findOrThrow(Long id) {
        return residentAssignmentRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Resident assignment", id));
    }
}
