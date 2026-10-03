package com.enterprise.copilot.agents.deploy;

import com.enterprise.copilot.domain.ApprovalState;
import com.enterprise.copilot.domain.DeploymentDecision;
import com.enterprise.copilot.domain.PipelineContext;
import com.enterprise.copilot.domain.ReviewDecision;
import com.enterprise.copilot.domain.audit.AuditService;
import com.enterprise.copilot.orchestration.PipelineEvent;
import com.enterprise.copilot.orchestration.PipelineEventPublisher;
import com.enterprise.copilot.orchestration.PipelineEventType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Atlas – the Release Manager. Deterministic gate logic
 * (no LLM): deployment is allowed only when every gate
 * passes AND a human approval exists. AI can never bypass
 * a blocking condition.
 */
@Component
@RequiredArgsConstructor
public class DeployAgent {

    public static final String NAME = "Atlas";

    private final PipelineEventPublisher events;
    private final AuditService audit;

    public DeploymentDecision evaluate(PipelineContext ctx) {

        events.publish(
                PipelineEvent.of(
                        ctx.pipelineId(),
                        PipelineEventType.AGENT_STARTED,
                        NAME,
                        "Evaluating deployment gates..."
                ));

        List<String> blocking = new ArrayList<>();

        if (ctx.requirementAnalysis() == null) {
            blocking.add("Requirement analysis is missing.");
        } else if (ctx.requirementAnalysis().needsClarification()) {
            blocking.add("Requirements still need human clarification.");
        }
        if (ctx.codeChangeSet() == null || ctx.codeChangeSet().files() == null
                || ctx.codeChangeSet().files().isEmpty()
                || ctx.codeChangeSet().unifiedDiff() == null
                || ctx.codeChangeSet().unifiedDiff().isBlank()) {
            blocking.add("Code proposal artifacts are missing.");
        }

        ReviewDecision review = ctx.reviewDecision();

        if (review == null || !review.passed()) {
            blocking.add(
                    "Review did not pass (outcome: "
                            + (review == null
                            ? "NONE"
                            : review.outcome())
                            + ").");
        }

        if (review != null
                && review.hasCriticalFindings()) {
            blocking.add(
                    "Unresolved CRITICAL review findings.");
        }

        if (ctx.codeChangeSet() != null
                && !ctx.codeChangeSet().testsPass()) {
            blocking.add("Tests are failing.");
        }

        boolean gatesPass = blocking.isEmpty();

        boolean approved =
                ctx.approvalState()
                        == ApprovalState.APPROVED;

        if (gatesPass && !approved) {

            // Everything technical is green;
            // only a human decision remains.

            events.publish(
                    PipelineEvent.of(
                            ctx.pipelineId(),
                            PipelineEventType.APPROVAL_REQUIRED,
                            NAME,
                            "All gates passed. Human approval is required before production deployment."
                    ));

            DeploymentDecision decision =
                    new DeploymentDecision(
                            false,
                            true,
                            List.of(
                                    "Human approval required for production."
                            ),
                            "Deployment blocked pending human approval."
                    );

            audit.record(
                    ctx.pipelineId(),
                    NAME,
                    "EVALUATE_DEPLOYMENT",
                    "BLOCKED",
                    "APPROVAL_REQUIRED",
                    decision.summary()
            );

            return decision;
        }

        if (!gatesPass) {

            events.publish(
                    PipelineEvent.of(
                            ctx.pipelineId(),
                            PipelineEventType.GATE_BLOCKED,
                            NAME,
                            "Deployment blocked: " + String.join(" ", blocking),
                            Map.of("reasons", blocking)
                    ));

            DeploymentDecision decision =
                    new DeploymentDecision(
                            false,
                            false,
                            blocking,
                            "Deployment blocked by failed gates."
                    );

            audit.record(
                    ctx.pipelineId(),
                    NAME,
                    "EVALUATE_DEPLOYMENT",
                    "BLOCKED",
                    "GATE_FAILED",
                    decision.summary()
            );

            return decision;
        }

        // gatesPass && approved

        DeploymentDecision decision =
                new DeploymentDecision(
                        true,
                        true,
                        List.of(),
                        "All gates passed and human approval granted. Cleared for deployment."
                );

        audit.record(
                ctx.pipelineId(),
                NAME,
                "EVALUATE_DEPLOYMENT",
                "ALLOWED",
                "APPROVED",
                decision.summary()
        );

        return decision;
    }
}