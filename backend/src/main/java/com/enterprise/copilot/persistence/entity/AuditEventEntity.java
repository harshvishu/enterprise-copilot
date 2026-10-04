package com.enterprise.copilot.persistence.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Immutable, append-only audit record of a significant AI or human action.
 * Never updated or deleted.
 * Secrets and customer PII are redacted before persistence (see {@code AuditService}).
 */
@Entity
@Table(name = "audit_events")
public class AuditEventEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "pipeline_id", nullable = false)
    private UUID pipelineId;

    @Column(nullable = false)
    private String agent;

    @Column(nullable = false)
    private String action;

    @Column private String decision;

    @Column(name = "policy_outcome")
    private String policyOutcome;

    @Column(columnDefinition = "text")
    private String detail;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected AuditEventEntity() {}

    public AuditEventEntity(
            UUID pipelineId,
            String agent,
            String action,
            String decision,
            String policyOutcome,
            String detail,
            Instant createdAt) {

        this.pipelineId = pipelineId;
        this.agent = agent;
        this.action = action;
        this.decision = decision;
        this.policyOutcome = policyOutcome;
        this.detail = detail;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public UUID getPipelineId() {
        return pipelineId;
    }

    public String getAgent() {
        return agent;
    }

    public String getAction() {
        return action;
    }

    public String getDecision() {
        return decision;
    }

    public String getPolicyOutcome() {
        return policyOutcome;
    }

    public String getDetail() {
        return detail;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
