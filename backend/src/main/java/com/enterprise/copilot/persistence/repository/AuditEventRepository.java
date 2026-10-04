package com.enterprise.copilot.persistence.repository;

import com.enterprise.copilot.persistence.entity.AuditEventEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AuditEventRepository extends JpaRepository<AuditEventEntity, Long> {

    List<AuditEventEntity> findByPipelineIdOrderByCreatedAtAsc(UUID pipelineId);
}
