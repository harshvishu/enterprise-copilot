package com.enterprise.copilot.persistence.entity;

import com.enterprise.copilot.domain.AiMode;
import com.enterprise.copilot.domain.ApprovalState;
import com.enterprise.copilot.domain.DemoScenario;
import com.enterprise.copilot.domain.PipelineState;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Persistent snapshot of a pipeline. Structured agent outputs are stored as JSON text columns,
 * keeping the schema portable across H2 (demo) and PostgreSQL (compose).
 */
@Entity
@Table(name = "pipelines")
public class PipelineEntity {

    @Id private UUID id;

    @Column(name = "ticket_key", nullable = false)
    private String ticketKey;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "text")
    private String description;

    @Column(nullable = false)
    private String source;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DemoScenario scenario;

    @Enumerated(EnumType.STRING)
    @Column(name = "ai_mode", nullable = false)
    private AiMode aiMode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PipelineState state;

    @Enumerated(EnumType.STRING)
    @Column(name = "approval_state", nullable = false)
    private ApprovalState approvalState;

    @Column(name = "analysis_json", columnDefinition = "text")
    private String analysisJson;

    @Column(name = "code_json", columnDefinition = "text")
    private String codeJson;

    @Column(name = "review_json", columnDefinition = "text")
    private String reviewJson;

    @Column(name = "review_feedback", columnDefinition = "text")
    private String reviewFeedback;

    @Column(name = "deployment_json", columnDefinition = "text")
    private String deploymentJson;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected PipelineEntity() {}

    public PipelineEntity(UUID id) {
        this.id = id;
    }

    public UUID getId() {
        return id;
    }

    public String getTicketKey() {
        return ticketKey;
    }

    public void setTicketKey(String v) {
        this.ticketKey = v;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String v) {
        this.title = v;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String v) {
        this.description = v;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String v) {
        this.source = v;
    }

    public DemoScenario getScenario() {
        return scenario;
    }

    public void setScenario(DemoScenario v) {
        this.scenario = v;
    }

    public AiMode getAiMode() {
        return aiMode;
    }

    public void setAiMode(AiMode v) {
        this.aiMode = v;
    }

    public PipelineState getState() {
        return state;
    }

    public void setState(PipelineState v) {
        this.state = v;
    }

    public ApprovalState getApprovalState() {
        return approvalState;
    }

    public void setApprovalState(ApprovalState v) {
        this.approvalState = v;
    }

    public String getAnalysisJson() {
        return analysisJson;
    }

    public void setAnalysisJson(String v) {
        this.analysisJson = v;
    }

    public String getCodeJson() {
        return codeJson;
    }

    public void setCodeJson(String v) {
        this.codeJson = v;
    }

    public String getReviewJson() {
        return reviewJson;
    }

    public void setReviewJson(String v) {
        this.reviewJson = v;
    }

    public String getDeploymentJson() {
        return deploymentJson;
    }

    public String getReviewFeedback() {
        return reviewFeedback;
    }

    public void setReviewFeedback(String feedback) {
        this.reviewFeedback = feedback;
    }

    public void setDeploymentJson(String v) {
        this.deploymentJson = v;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant v) {
        this.createdAt = v;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant v) {
        this.updatedAt = v;
    }
}
