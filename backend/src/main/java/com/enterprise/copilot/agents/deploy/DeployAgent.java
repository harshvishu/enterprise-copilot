package com.enterprise.copilot.agents.deploy;

import com.enterprise.copilot.domain.ApprovalState;
import com.enterprise.copilot.domain.DeploymentDecision;
import com.enterprise.copilot.domain.PipelineContext;
import com.enterprise.copilot.domain.RequirementAnalysis;
import com.enterprise.copilot.domain.ReviewDecision;
import com.enterprise.copilot.domain.audit.AuditService;
import com.enterprise.copilot.orchestration.PipelineEvent;
import com.enterprise.copilot.orchestration.PipelineEventPublisher;
import com.enterprise.copilot.orchestration.PipelineEventType;
import com.enterprise.copilot.orchestration.PresentationPacer;
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
    private final PresentationPacer pacer;

    /** Full gate evaluation, shown gate by gate. */
    public DeploymentDecision evaluate(PipelineContext ctx) {
        return decide(ctx, true);
    }

    /** The same gate evaluation after human approval, presented compactly and without pacing. */
    public DeploymentDecision revalidate(PipelineContext ctx) {
        return decide(ctx, false);
    }

    private DeploymentDecision decide(PipelineContext ctx, boolean showGates) {

        events.publish(
                showGates
                        ? PipelineEvent.of(
                                ctx.pipelineId(),
                                PipelineEventType.AGENT_STARTED,
                                NAME,
                                "Evaluating release gates with deterministic Java rules...")
                        : PipelineEvent.of(
                                ctx.pipelineId(),
                                PipelineEventType.AGENT_THINKING,
                                NAME,
                                "Re-validating release gates...",
                                Map.of("step", "REVALIDATE")));

        List<String> blocking = new ArrayList<>();

        RequirementAnalysis analysis = ctx.requirementAnalysis();
        if (analysis == null) {
            blocking.add("Requirement analysis is missing.");
        } else if (analysis.needsClarification()) {
            blocking.add("Requirements still need human clarification.");
        }
        gate(
                ctx,
                showGates,
                "REQUIREMENTS_RESOLVED",
                analysis != null && !analysis.needsClarification(),
                false);

        boolean codePresent =
                ctx.codeChangeSet() != null
                        && ctx.codeChangeSet().files() != null
                        && !ctx.codeChangeSet().files().isEmpty()
                        && ctx.codeChangeSet().unifiedDiff() != null
                        && !ctx.codeChangeSet().unifiedDiff().isBlank();
        if (!codePresent) {
            blocking.add("Code proposal artifacts are missing.");
        }
        gate(ctx, showGates, "CODE_PROPOSAL_PRESENT", codePresent, false);

        ReviewDecision review = ctx.reviewDecision();

        boolean reviewApproved = review != null && review.passed();
        if (!reviewApproved) {
            blocking.add(
                    "Review did not pass (outcome: "
                            + (review == null ? "NONE" : review.outcome())
                            + ").");
        }
        gate(ctx, showGates, "REVIEW_APPROVED", reviewApproved, false);

        boolean criticalFindings = review != null && review.hasCriticalFindings();
        if (criticalFindings) {
            blocking.add("Unresolved CRITICAL review findings.");
        }
        gate(ctx, showGates, "NO_CRITICAL_FINDINGS", !criticalFindings, false);

        boolean testSignalPassed =
                ctx.codeChangeSet() != null && ctx.codeChangeSet().hasPassingTestSignal();
        if (ctx.codeChangeSet() == null || !ctx.codeChangeSet().hasProposedTests()) {
            blocking.add("Proposed tests are missing or blank; the test signal is not evaluated.");
        } else if (!testSignalPassed) {
            blocking.add(
                    "Tests have a failing simulated/model-provided signal; generated tests were not executed.");
        }
        gate(ctx, showGates, "TESTS_PASS", testSignalPassed, false);

        boolean gatesPass = blocking.isEmpty();

        boolean approved = ctx.approvalState() == ApprovalState.APPROVED;

        if (gatesPass) {
            gate(ctx, showGates, "HUMAN_APPROVAL", approved, !approved);
        }

        if (gatesPass && !approved) {

            // Everything technical is green;
            // only a human decision remains.

            events.publish(
                    PipelineEvent.of(
                            ctx.pipelineId(),
                            PipelineEventType.APPROVAL_REQUIRED,
                            NAME,
                            "All gates passed. Human approval is required before production deployment."));

            DeploymentDecision decision =
                    new DeploymentDecision(
                            false,
                            true,
                            List.of("Human approval required for production."),
                            "Deployment blocked pending human approval.");

            audit.record(
                    ctx.pipelineId(),
                    NAME,
                    "EVALUATE_DEPLOYMENT",
                    "BLOCKED",
                    "APPROVAL_REQUIRED",
                    decision.summary());

            return decision;
        }

        if (!gatesPass) {

            events.publish(
                    PipelineEvent.of(
                            ctx.pipelineId(),
                            PipelineEventType.GATE_BLOCKED,
                            NAME,
                            "Deployment blocked: " + String.join(" ", blocking),
                            Map.of("reasons", blocking)));

            DeploymentDecision decision =
                    new DeploymentDecision(
                            false, false, blocking, "Deployment blocked by failed gates.");

            audit.record(
                    ctx.pipelineId(),
                    NAME,
                    "EVALUATE_DEPLOYMENT",
                    "BLOCKED",
                    "GATE_FAILED",
                    decision.summary());

            return decision;
        }

        // gatesPass && approved

        DeploymentDecision decision =
                new DeploymentDecision(
                        true,
                        true,
                        List.of(),
                        "All gates passed and human approval granted. Cleared for deployment.");

        events.publish(
                PipelineEvent.of(
                        ctx.pipelineId(),
                        PipelineEventType.AGENT_COMPLETED,
                        NAME,
                        "All release gates satisfied. Deployment authorized.",
                        Map.of("decision", "ALLOWED")));

        audit.record(
                ctx.pipelineId(),
                NAME,
                "EVALUATE_DEPLOYMENT",
                "ALLOWED",
                "APPROVED",
                decision.summary());

        return decision;
    }

    private void gate(
            PipelineContext ctx, boolean show, String gate, boolean passed, boolean waiting) {

        if (!show) {
            return;
        }

        events.publish(
                PipelineEvent.of(
                        ctx.pipelineId(),
                        PipelineEventType.GATE_EVALUATED,
                        NAME,
                        gate + (waiting ? ": waiting" : passed ? ": passed" : ": failed"),
                        Map.of("gate", gate, "passed", passed, "waiting", waiting)));

        pacer.afterActivity();
    }
}
