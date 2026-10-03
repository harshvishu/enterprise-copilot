package com.enterprise.copilot.domain;

import java.time.Instant;
import java.util.UUID;

/**
 * The single typed object threaded through the whole pipeline.
 * Agents read the fields they need and return typed results;
 * the orchestrator attaches those results here and persists
 * after every step.
 *
 * <p>Deliberately a mutable holder (not a record) because it
 * accumulates state across agent steps. Never place raw secrets
 * or customer PII in this object.
 */
public class PipelineContext {

    private final UUID pipelineId;
    private final Ticket ticket;
    private final DemoScenario scenario;
    private final AiMode aiMode;
    private final Instant createdAt;

    private PipelineState state = PipelineState.CREATED;
    private RequirementAnalysis requirementAnalysis;
    private CodeChangeSet codeChangeSet;
    private ReviewDecision reviewDecision;
    private DeploymentDecision deploymentDecision;
    private ApprovalState approvalState = ApprovalState.NOT_REQUIRED;
    private Instant updatedAt;

    public PipelineContext(
            UUID pipelineId,
            Ticket ticket,
            DemoScenario scenario,
            AiMode aiMode) {

        this(pipelineId, ticket, scenario, aiMode, Instant.now());
    }

    public PipelineContext(
            UUID pipelineId,
            Ticket ticket,
            DemoScenario scenario,
            AiMode aiMode,
            Instant createdAt) {

        this.pipelineId = pipelineId;
        this.ticket = ticket;
        this.scenario = scenario;
        this.aiMode = aiMode;
        this.createdAt = createdAt;
        this.updatedAt = this.createdAt;
    }

    public UUID pipelineId() {
        return pipelineId;
    }

    public Ticket ticket() {
        return ticket;
    }

    public DemoScenario scenario() {
        return scenario;
    }

    public AiMode aiMode() {
        return aiMode;
    }

    public Instant createdAt() {
        return createdAt;
    }

    public PipelineState state() {
        return state;
    }

    public RequirementAnalysis requirementAnalysis() {
        return requirementAnalysis;
    }

    public CodeChangeSet codeChangeSet() {
        return codeChangeSet;
    }

    public ReviewDecision reviewDecision() {
        return reviewDecision;
    }

    public DeploymentDecision deploymentDecision() {
        return deploymentDecision;
    }

    public ApprovalState approvalState() {
        return approvalState;
    }

    public Instant updatedAt() {
        return updatedAt;
    }

    public void setState(PipelineState state) {
        this.state = state;
        touch();
    }

    public void setRequirementAnalysis(
            RequirementAnalysis analysis) {
        this.requirementAnalysis = analysis;
        touch();
    }

    public void setCodeChangeSet(
            CodeChangeSet changeSet) {
        this.codeChangeSet = changeSet;
        touch();
    }

    public void setReviewDecision(
            ReviewDecision reviewDecision) {
        this.reviewDecision = reviewDecision;
        touch();
    }

    public void setDeploymentDecision(
            DeploymentDecision deploymentDecision) {
        this.deploymentDecision = deploymentDecision;
        touch();
    }

    public void setApprovalState(
            ApprovalState approvalState) {
        this.approvalState = approvalState;
        touch();
    }

    public void restoreUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    private void touch() {
        this.updatedAt = Instant.now();
    }
}