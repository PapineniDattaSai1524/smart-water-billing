package com.smartwater.billing.service;

import com.smartwater.billing.dto.common.PageResponse;
import com.smartwater.billing.entity.AuditLog;
import com.smartwater.billing.repository.AuditLogRepository;
import com.smartwater.billing.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @Transactional
    public void record(Long actorUserId, String action, String entityType, Long entityId, String details) {
        AuditLog.AuditLogBuilder builder = AuditLog.builder()
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .details(details);

        if (actorUserId != null) {
            userRepository.findById(actorUserId).ifPresent(u -> {
                builder.actor(u);
                builder.actorName(u.getFullName());
            });
        }
        auditLogRepository.save(builder.build());
    }

    @Transactional(readOnly = true)
    public PageResponse<com.smartwater.billing.dto.audit.AuditLogResponse> list(Pageable pageable) {
        return PageResponse.from(auditLogRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(log -> com.smartwater.billing.dto.audit.AuditLogResponse.builder()
                        .id(log.getId())
                        .actorName(log.getActorName())
                        .action(log.getAction())
                        .entityType(log.getEntityType())
                        .entityId(log.getEntityId())
                        .details(log.getDetails())
                        .createdAt(log.getCreatedAt())
                        .build()));
    }
}
