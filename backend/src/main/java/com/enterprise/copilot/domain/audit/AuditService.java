package com.enterprise.copilot.domain.audit;

import com.enterprise.copilot.infrastructure.security.Redactor;
import com.enterprise.copilot.persistence.entity.AuditEventEntity;
import com.enterprise.copilot.persistence.repository.AuditEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Writes immutable audit records for every significant AI or human action.
 * All free-text detail is redacted first so secrets and customer PII never
 * land in the trail.
 */
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditEventRepository repository;
    private final Redactor redactor;

    public void record(
            UUID pipelineId,
            String agent,
            String action,
            String decision,
            String policyOutcome,
            String detail) {

        AuditEventEntity event =
                new AuditEventEntity(
                        pipelineId,
                        agent,
                        action,
                        decision,
                        policyOutcome,
                        redactor.redact(detail),
                        Instant.now());

        repository.save(event);
    }

    public List<AuditEventEntity> forPipeline(UUID pipelineId) {

        return repository.findByPipelineIdOrderByCreatedAtAsc(pipelineId);
    }
}
