package com.enterprise.copilot.api.dto;

import com.enterprise.copilot.domain.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Full pipeline view returned by the API.
 */
public record PipelineResponse(
        UUID id,
        Ticket ticket,
        DemoScenario scenario,
        AiMode aiMode,
        PipelineState state,
        ApprovalState approvalState,
        RequirementAnalysis requirementAnalysis,
        CodeChangeSet codeChangeSet,
        ReviewDecision reviewDecision,
        String reviewFeedback,
        DeploymentDecision deploymentDecision,
        Instant createdAt,
        Instant updatedAt,
        RepositoryExecution repositoryExecution) {

    public static PipelineResponse from(PipelineContext ctx) {
        return new PipelineResponse(
                ctx.pipelineId(),
                ctx.ticket(),
                ctx.scenario(),
                ctx.aiMode(),
                ctx.state(),
                ctx.approvalState(),
                ctx.requirementAnalysis(),
                ctx.codeChangeSet(),
                ctx.reviewDecision(),
                ctx.reviewFeedback(),
                ctx.deploymentDecision(),
                ctx.createdAt(),
                ctx.updatedAt(),
                ctx.repositoryExecution());
    }
}
