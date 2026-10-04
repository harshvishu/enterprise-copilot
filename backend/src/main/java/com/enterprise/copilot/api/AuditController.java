package com.enterprise.copilot.api;

import com.enterprise.copilot.domain.audit.AuditService;
import com.enterprise.copilot.persistence.entity.AuditEventEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Read-only access to the immutable audit trail for a pipeline.
 */
@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
public class AuditController {

    private final AuditService auditService;

    @GetMapping("/pipelines/{id}")
    public List<AuditEventEntity> forPipeline(@PathVariable UUID id) {
        return auditService.forPipeline(id);
    }
}
