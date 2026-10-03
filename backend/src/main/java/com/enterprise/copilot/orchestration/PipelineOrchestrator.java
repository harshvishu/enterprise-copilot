package com.enterprise.copilot.orchestration;

import com.enterprise.copilot.agents.code.CodeGenerationAgent;
import com.enterprise.copilot.agents.deploy.DeployAgent;
import com.enterprise.copilot.agents.requirements.RequirementsAgent;
import com.enterprise.copilot.agents.review.ReviewAgent;
import com.enterprise.copilot.domain.*;
import com.enterprise.copilot.domain.audit.AuditService;
import com.enterprise.copilot.infrastructure.ai.DemoState;
import com.enterprise.copilot.persistence.PipelineStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

/**
 * Coordinates the whole delivery pipeline with a typed {@link PipelineContext}.
 * Every state change is persisted and streamed.
 * The pipeline pauses at {@code WAITING_FOR_APPROVAL}; only a human resumes it.
 */
@Service
public class PipelineOrchestrator {

    private static final Logger log =
            LoggerFactory.getLogger(PipelineOrchestrator.class);

    private final RequirementsAgent requirementsAgent;
    private final CodeGenerationAgent codeAgent;
    private final ReviewAgent reviewAgent;
    private final DeployAgent deployAgent;
    private final PipelineStore store;
    private final PipelineEventPublisher events;
    private final AuditService audit;
    private final DemoState demoState;
    private final ObjectProvider<PipelineOrchestrator> self;
    private final long stepDelayMs;

    public PipelineOrchestrator(
            RequirementsAgent requirementsAgent,
            CodeGenerationAgent codeAgent,
            ReviewAgent reviewAgent,
            DeployAgent deployAgent,
            PipelineStore store,
            PipelineEventPublisher events,
            AuditService audit,
            DemoState demoState,
            ObjectProvider<PipelineOrchestrator> self,
            @Value("${copilot.demo.step-delay-ms:600}") long stepDelayMs) {

        this.requirementsAgent = requirementsAgent;
        this.codeAgent = codeAgent;
        this.reviewAgent = reviewAgent;
        this.deployAgent = deployAgent;
        this.store = store;
        this.events = events;
        this.audit = audit;
        this.demoState = demoState;
        this.self = self;
        this.stepDelayMs = stepDelayMs;
    }

    /**
     * Create a pipeline for a ticket using the currently active scenario, then run it asynchronously.
     */
    public PipelineContext createAndRun(Ticket ticket) {

        DemoScenario scenario = demoState.scenario();

        PipelineContext ctx =
                new PipelineContext(
                        UUID.randomUUID(),
                        ticket,
                        scenario,
                        demoState.aiMode());

        store.save(ctx);

        events.publish(
                PipelineEvent.of(
                        ctx.pipelineId(),
                        PipelineEventType.PIPELINE_STARTED,
                        "System",
                        "Pipeline started for "
                                + ticket.key()
                                + " (scenario: "
                                + scenario
                                + ")."));

        audit.record(
                ctx.pipelineId(),
                "System",
                "PIPELINE_CREATED",
                scenario.name(),
                "OK",
                "Pipeline created for " + ticket.key());

        self.getObject().run(ctx.pipelineId()); // via proxy so @Async takes effect

        return ctx;
    }

    @Async
    public void run(UUID pipelineId) {

        PipelineContext ctx =
                store.load(pipelineId)
                        .orElseThrow();

        try {

            // 1. Requirements

            transition(
                    ctx,
                    PipelineState.ANALYZING_REQUIREMENTS);

            RequirementAnalysis analysis =
                    requirementsAgent.analyze(ctx);

            ctx.setRequirementAnalysis(analysis);

            transition(
                    ctx,
                    PipelineState.REQUIREMENTS_READY);

            if (analysis.needsClarification()) {

                events.publish(
                        PipelineEvent.of(
                                pipelineId,
                                PipelineEventType.GATE_BLOCKED,
                                RequirementsAgent.NAME,
                                "Paused: awaiting human clarification before implementation."
                        ));

                audit.record(
                        pipelineId,
                        RequirementsAgent.NAME,
                        "PIPELINE_PAUSED",
                        "AWAITING_CLARIFICATION",
                        "BLOCKED",
                        "Requirement is ambiguous."
                );

                return; // pipeline halts until requirements are clarified
            }

            runImplementationStages(ctx);

        } catch (RuntimeException ex) {

            failPipeline(
                    pipelineId,
                    ctx,
                    ex);
        }
    }

    /**
     * A human answers Rhea's clarification questions; the pipeline resumes from the code stage.
     * AI can never call this path.
     */
    public PipelineContext clarify(
            UUID pipelineId,
            List<String> answers) {

        PipelineContext ctx =
                store.load(pipelineId)
                        .orElseThrow();

        if (ctx.state() != PipelineState.REQUIREMENTS_READY
                || ctx.requirementAnalysis() == null
                || !ctx.requirementAnalysis().needsClarification()) {

            throw new IllegalStateException(
                    "Pipeline is not awaiting clarification (state="
                            + ctx.state()
                            + ")");
        }

        RequirementAnalysis analysis = ctx.requirementAnalysis();
        List<String> questions = analysis.clarificationQuestions();
        if (answers == null || answers.size() != questions.size()
                || answers.stream().anyMatch(answer -> answer == null || answer.isBlank())) {
            throw new IllegalArgumentException("Provide one nonblank answer per clarification question.");
        }

        StringBuilder clarification = new StringBuilder();
        for (int index = 0; index < questions.size(); index++) {
            clarification.append(questions.get(index)).append("\nAnswer: ")
                    .append(answers.get(index).trim()).append('\n');
        }
        String joined = clarification.toString();
        ctx.setRequirementAnalysis(new RequirementAnalysis(
                analysis.summary() + "\nHuman clarification:\n" + joined,
                List.of(), analysis.assumptions(), analysis.acceptanceCriteria(),
                analysis.complianceConcerns(), analysis.technicalRisks(), List.of()));
        transition(ctx, PipelineState.GENERATING_CODE);

        events.publish(
                PipelineEvent.of(
                        pipelineId,
                        PipelineEventType.AGENT_COMPLETED,
                        "Human",
                        "Clarifications provided. Resuming implementation."
                ));

        audit.record(
                pipelineId,
                "Human",
                "CLARIFY_REQUIREMENTS",
                "CLARIFIED",
                "HUMAN_ACCOUNTABILITY",
                joined
        );

        self.getObject()
                .continueAfterRequirements(pipelineId);

        return ctx;
    }

    /**
     * Resume the pipeline after requirements are clarified: run code, review and the deploy gate.
     */
    @Async
    public void continueAfterRequirements(UUID pipelineId) {

        PipelineContext ctx =
                store.load(pipelineId)
                        .orElseThrow();

        try {

            runImplementationStages(ctx);

        } catch (RuntimeException ex) {

            failPipeline(
                    pipelineId,
                    ctx,
                    ex);
        }
    }

    private void runImplementationStages(PipelineContext ctx) {

        UUID pipelineId = ctx.pipelineId();

        // 2. Code

        if (ctx.state() != PipelineState.GENERATING_CODE) {
            transition(ctx, PipelineState.GENERATING_CODE);
        }

        CodeChangeSet changeSet =
                codeAgent.generate(ctx);

        ctx.setCodeChangeSet(changeSet);

        transition(
                ctx,
                PipelineState.CODE_READY);

        // 3. Review

        transition(
                ctx,
                PipelineState.REVIEWING);

        ReviewDecision review =
                reviewAgent.review(ctx);

        ctx.setReviewDecision(review);

        transition(
                ctx,
                review.passed()
                        ? PipelineState.REVIEW_PASSED
                        : PipelineState.REVIEW_FAILED);

        // 4. Deploy gate

        DeploymentDecision decision =
                deployAgent.evaluate(ctx);

        ctx.setDeploymentDecision(decision);

        if (decision.allowed()) {

            deploy(ctx);

        } else if (decision.requiresApproval()
                && review.passed()
                && !review.hasCriticalFindings()
                && changeSet.testsPass()) {

            ctx.setApprovalState(
                    ApprovalState.PENDING);

            transition(
                    ctx,
                    PipelineState.WAITING_FOR_APPROVAL);

        } else {

            transition(
                    ctx,
                    PipelineState.BLOCKED);

            events.publish(
                    PipelineEvent.of(
                            pipelineId,
                            PipelineEventType.PIPELINE_FAILED,
                            "System",
                            "Pipeline blocked. "
                                    + decision.summary()
                    ));
        }
    }

    private void failPipeline(
            UUID pipelineId,
            PipelineContext ctx,
            RuntimeException ex) {

        log.error(
                "Pipeline {} failed",
                pipelineId,
                ex);

        transition(
                ctx,
                PipelineState.FAILED);

        events.publish(
                PipelineEvent.of(
                        pipelineId,
                        PipelineEventType.PIPELINE_FAILED,
                        "System",
                        "Pipeline failed: "
                                + ex.getMessage()
                ));
    }

    /**
     * Human approves the deployment. AI can never call this path.
     */
    public PipelineContext approve(
            UUID pipelineId,
            String approver) {

        PipelineContext ctx =
                store.load(pipelineId)
                        .orElseThrow();

        if (ctx.state() != PipelineState.WAITING_FOR_APPROVAL) {

            throw new IllegalStateException(
                    "Pipeline is not awaiting approval (state="
                            + ctx.state()
                            + ")");
        }

        ctx.setApprovalState(
                ApprovalState.APPROVED);

        store.save(ctx);

        events.publish(
                PipelineEvent.of(
                        pipelineId,
                        PipelineEventType.APPROVAL_GRANTED,
                        "Human",
                        "Deployment approved by "
                                + approver
                                + "."
                ));

        audit.record(
                pipelineId,
                "Human",
                "APPROVE_DEPLOYMENT",
                "APPROVED",
                "HUMAN_ACCOUNTABILITY",
                "Approved by " + approver
        );

        DeploymentDecision decision =
                deployAgent.evaluate(ctx);

        ctx.setDeploymentDecision(decision);

        if (decision.allowed()) {

            deploy(ctx);

        } else {

            transition(
                    ctx,
                    PipelineState.BLOCKED);
        }

        return ctx;
    }

    /**
     * Human rejects the deployment.
     */
    public PipelineContext reject(
            UUID pipelineId,
            String approver) {

        PipelineContext ctx =
                store.load(pipelineId)
                        .orElseThrow();

        if (ctx.state() != PipelineState.WAITING_FOR_APPROVAL) {
            throw new IllegalStateException(
                    "Pipeline is not awaiting approval (state=" + ctx.state() + ")");
        }

        ctx.setApprovalState(
                ApprovalState.REJECTED);

        transition(
                ctx,
                PipelineState.BLOCKED);

        events.publish(
                PipelineEvent.of(
                        pipelineId,
                        PipelineEventType.APPROVAL_REJECTED,
                        "Human",
                        "Deployment rejected by "
                                + approver
                                + "."
                ));

        audit.record(
                pipelineId,
                "Human",
                "REJECT_DEPLOYMENT",
                "REJECTED",
                "HUMAN_ACCOUNTABILITY",
                "Rejected by " + approver
        );

        return ctx;
    }

    private void deploy(PipelineContext ctx) {

        transition(
                ctx,
                PipelineState.DEPLOYING);

        events.publish(
                PipelineEvent.of(
                        ctx.pipelineId(),
                        PipelineEventType.DEPLOYMENT_STARTED,
                        DeployAgent.NAME,
                        "Deploying to production..."
                ));

        pace();

        transition(
                ctx,
                PipelineState.DEPLOYED);

        events.publish(
                PipelineEvent.of(
                        ctx.pipelineId(),
                        PipelineEventType.DEPLOYMENT_COMPLETED,
                        DeployAgent.NAME,
                        "Deployment completed."
                ));

        events.publish(
                PipelineEvent.of(
                        ctx.pipelineId(),
                        PipelineEventType.PIPELINE_COMPLETED,
                        "System",
                        "Pipeline completed successfully."
                ));

        audit.record(
                ctx.pipelineId(),
                DeployAgent.NAME,
                "DEPLOY",
                "DEPLOYED",
                "OK",
                "Deployment completed."
        );
    }

    private void transition(
            PipelineContext ctx,
            PipelineState state) {

        ctx.setState(state);
        store.save(ctx);
        pace();
    }

    private void pace() {

        if (stepDelayMs <= 0) {
            return;
        }

        try {

            Thread.sleep(stepDelayMs);

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();
        }
    }
}