package com.enterprise.copilot.persistence;

import com.enterprise.copilot.domain.CodeChangeSet;
import com.enterprise.copilot.domain.DeploymentDecision;
import com.enterprise.copilot.domain.PipelineContext;
import com.enterprise.copilot.domain.RequirementAnalysis;
import com.enterprise.copilot.domain.ReviewDecision;
import com.enterprise.copilot.domain.Ticket;
import com.enterprise.copilot.persistence.entity.PipelineEntity;
import com.enterprise.copilot.persistence.repository.PipelineRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Bridges the in-flight {@link PipelineContext} and its persisted {@link PipelineEntity}.
 * Structured agent outputs are serialised to JSON text columns.
 */
@Service
public class PipelineStore {

    private final PipelineRepository repository;
    private final ObjectMapper objectMapper;

    public PipelineStore(
            PipelineRepository repository,
            ObjectMapper objectMapper) {

        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    public void save(PipelineContext ctx) {

        PipelineEntity e =
                repository.findById(ctx.pipelineId())
                        .orElseGet(() -> {
                            PipelineEntity fresh =
                                    new PipelineEntity(ctx.pipelineId());

                            fresh.setCreatedAt(ctx.createdAt());
                            return fresh;
                        });

        Ticket t = ctx.ticket();

        e.setTicketKey(t.key());
        e.setTitle(t.title());
        e.setDescription(t.description());
        e.setSource(t.source());

        e.setScenario(ctx.scenario());
        e.setAiMode(ctx.aiMode());

        e.setState(ctx.state());
        e.setApprovalState(ctx.approvalState());

        e.setAnalysisJson(
                toJson(ctx.requirementAnalysis()));

        e.setCodeJson(
                toJson(ctx.codeChangeSet()));

        e.setReviewJson(
                toJson(ctx.reviewDecision()));

        e.setDeploymentJson(
                toJson(ctx.deploymentDecision()));

        e.setUpdatedAt(Instant.now());

        repository.save(e);
    }

    public Optional<PipelineContext> load(UUID id) {
        return repository.findById(id)
                .map(this::toContext);
    }

    public List<PipelineEntity> listAll() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    public PipelineContext toContext(PipelineEntity e) {

        PipelineContext ctx =
                new PipelineContext(
                        e.getId(),
                        new Ticket(
                                e.getTicketKey(),
                                e.getTitle(),
                                e.getDescription(),
                                e.getSource()),
                        e.getScenario(),
                        e.getAiMode(),
                        e.getCreatedAt());

        ctx.setState(e.getState());

        ctx.setApprovalState(
                e.getApprovalState());

        ctx.setRequirementAnalysis(
                fromJson(
                        e.getAnalysisJson(),
                        RequirementAnalysis.class));

        ctx.setCodeChangeSet(
                fromJson(
                        e.getCodeJson(),
                        CodeChangeSet.class));

        ctx.setReviewDecision(
                fromJson(
                        e.getReviewJson(),
                        ReviewDecision.class));

        ctx.setDeploymentDecision(
                fromJson(
                        e.getDeploymentJson(),
                        DeploymentDecision.class));

        ctx.restoreUpdatedAt(e.getUpdatedAt());

        return ctx;
    }

    private String toJson(Object value) {

        if (value == null) {
            return null;
        }

        try {

            return objectMapper.writeValueAsString(value);

        } catch (JsonProcessingException ex) {

            throw new IllegalStateException(
                    "Failed to serialise pipeline field",
                    ex);
        }
    }

    private <T> T fromJson(
            String json,
            Class<T> type) {

        if (json == null || json.isBlank()) {
            return null;
        }

        try {

            return objectMapper.readValue(
                    json,
                    type);

        } catch (JsonProcessingException ex) {

            throw new IllegalStateException(
                    "Failed to deserialise pipeline field",
                    ex);
        }
    }
}