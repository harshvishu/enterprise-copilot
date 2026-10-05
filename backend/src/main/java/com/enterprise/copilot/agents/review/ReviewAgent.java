package com.enterprise.copilot.agents.review;

import com.enterprise.copilot.domain.PipelineContext;
import com.enterprise.copilot.domain.ReviewDecision;
import com.enterprise.copilot.domain.ReviewFinding;
import com.enterprise.copilot.domain.audit.AuditService;
import com.enterprise.copilot.infrastructure.ai.AgentAiClient;
import com.enterprise.copilot.infrastructure.ai.AgentKind;
import com.enterprise.copilot.infrastructure.ai.PromptLibrary;
import com.enterprise.copilot.orchestration.PipelineEvent;
import com.enterprise.copilot.orchestration.PipelineEventPublisher;
import com.enterprise.copilot.orchestration.PipelineEventType;
import com.enterprise.copilot.orchestration.PresentationPacer;
import com.enterprise.copilot.tools.ApiSpecificationTool;
import com.enterprise.copilot.tools.ArchitectureTool;
import com.enterprise.copilot.tools.ComplianceTool;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Sentinel – the Security & Compliance Architect.
 * Challenges the proposed change set and returns a
 * {@link ReviewDecision}. This is the workshop's hero
 * moment: the agent catches the sensitive-data leak.
 */
@Component
@RequiredArgsConstructor
public class ReviewAgent {

    public static final String NAME = "Sentinel";

    private final AgentAiClient ai;
    private final PromptLibrary prompts;
    private final ApiSpecificationTool apiSpec;
    private final ComplianceTool compliance;
    private final ArchitectureTool architecture;
    private final ObjectMapper objectMapper;
    private final PipelineEventPublisher events;
    private final AuditService audit;
    private final PresentationPacer pacer;

    public ReviewDecision review(PipelineContext ctx) {

        events.publish(
                PipelineEvent.of(
                        ctx.pipelineId(),
                        PipelineEventType.AGENT_STARTED,
                        NAME,
                        "Reviewing the proposed change set..."));

        events.publish(
                PipelineEvent.of(
                        ctx.pipelineId(),
                        PipelineEventType.AGENT_THINKING,
                        NAME,
                        "Preparing proposed diff and requirement analysis for review",
                        Map.of("step", "DIFF")));

        String proposal = evidence(ctx.codeChangeSet());
        String analysis = evidence(ctx.requirementAnalysis());

        pacer.afterActivity(ctx.aiMode());

        events.publish(
                PipelineEvent.of(
                        ctx.pipelineId(),
                        PipelineEventType.TOOL_INVOKED,
                        NAME,
                        "Reading published API contract",
                        Map.of("tool", apiSpec.name(), "step", "API_SPEC")));

        String contract = apiSpec.lookup(ctx.ticket().description());

        pacer.afterActivity(ctx.aiMode());

        events.publish(
                PipelineEvent.of(
                        ctx.pipelineId(),
                        PipelineEventType.TOOL_INVOKED,
                        NAME,
                        "Reading compliance guidance",
                        Map.of("tool", compliance.name(), "step", "COMPLIANCE")));
        String complianceGuidance = compliance.lookup(ctx.ticket().description());
        pacer.afterActivity(ctx.aiMode());

        events.publish(
                PipelineEvent.of(
                        ctx.pipelineId(),
                        PipelineEventType.TOOL_INVOKED,
                        NAME,
                        "Reading architecture guidance",
                        Map.of("tool", architecture.name(), "step", "ARCHITECTURE")));
        String architectureGuidance = architecture.lookup(ctx.ticket().description());
        pacer.afterActivity(ctx.aiMode());

        events.publish(
                PipelineEvent.of(
                        ctx.pipelineId(),
                        PipelineEventType.AGENT_THINKING,
                        NAME,
                        "Requesting security, compliance, quality and architecture review",
                        Map.of("step", "MODEL_CALL")));

        pacer.afterActivity(ctx.aiMode());

        String prompt =
                prompts.render(
                        "review",
                        Map.of(
                                "ticket", evidence(ctx.ticket()),
                                "analysis", analysis,
                                "proposal", proposal,
                                "apiSpec", contract,
                                "compliance", complianceGuidance,
                                "architecture", architectureGuidance));

        ReviewDecision decision =
                ai.generateForRun(AgentKind.REVIEW, ctx, prompt, ReviewDecision.class);

        if (!decision.findings().isEmpty()) {
            events.publish(
                    PipelineEvent.of(
                            ctx.pipelineId(),
                            PipelineEventType.AGENT_THINKING,
                            NAME,
                            "Recording "
                                    + decision.findings().size()
                                    + " finding(s) from the review",
                            Map.of("step", "FINDINGS")));

            pacer.afterActivity(ctx.aiMode());
        }

        for (ReviewFinding finding : decision.findings()) {

            events.publish(
                    PipelineEvent.of(
                            ctx.pipelineId(),
                            PipelineEventType.FINDING_CREATED,
                            NAME,
                            "["
                                    + finding.severity()
                                    + "/"
                                    + finding.category()
                                    + "] "
                                    + finding.description(),
                            Map.of(
                                    "severity", finding.severity().name(),
                                    "category", finding.category(),
                                    "file", finding.file(),
                                    "location", finding.location())));

            pacer.afterActivity(ctx.aiMode());
        }

        events.publish(
                PipelineEvent.of(
                        ctx.pipelineId(),
                        PipelineEventType.AGENT_COMPLETED,
                        NAME,
                        "Review outcome: "
                                + decision.outcome()
                                + " ("
                                + decision.findings().size()
                                + " finding(s)).",
                        Map.of("outcome", decision.outcome().name())));

        audit.record(
                ctx.pipelineId(),
                NAME,
                "REVIEW_CODE",
                decision.outcome().name(),
                decision.hasCriticalFindings() ? "CRITICAL_FINDINGS" : "OK",
                decision.summary());

        return decision;
    }

    private String evidence(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Unable to prepare review evidence", ex);
        }
    }
}
