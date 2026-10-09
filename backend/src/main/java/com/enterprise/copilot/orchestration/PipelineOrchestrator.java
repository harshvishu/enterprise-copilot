package com.enterprise.copilot.orchestration;

import com.enterprise.copilot.agents.code.CodeGenerationAgent;
import com.enterprise.copilot.agents.deploy.DeployAgent;
// WORKSHOP: Import the participant-created ConfluenceAgent.
// CONFLUENCE_EXERCISE:IMPORT_BEGIN
// TODO: Import the participant-created ConfluenceAgent here.
// CONFLUENCE_EXERCISE:IMPORT_END
import com.enterprise.copilot.agents.requirements.RequirementsAgent;
import com.enterprise.copilot.agents.review.ReviewAgent;
import com.enterprise.copilot.domain.*;
import com.enterprise.copilot.domain.audit.AuditService;
import com.enterprise.copilot.infrastructure.ai.DemoState;
import com.enterprise.copilot.persistence.PipelineStore;
import com.enterprise.copilot.tools.LocalRepositoryTool;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Supplier;

/**
 * Coordinates the whole delivery pipeline with a typed {@link PipelineContext}.
 * Every state change is persisted and streamed.
 * The pipeline pauses at {@code WAITING_FOR_APPROVAL}; only a human resumes it.
 */
@Service
public class PipelineOrchestrator {

    private static final Logger log = LoggerFactory.getLogger(PipelineOrchestrator.class);

    private final RequirementsAgent requirementsAgent;
    // WORKSHOP 1/4: Add the participant agent as a constructor-injected dependency.
    // CONFLUENCE_EXERCISE:FIELD_BEGIN
    // TODO: Add the participant-created ConfluenceAgent dependency here.
    // CONFLUENCE_EXERCISE:FIELD_END
    private final CodeGenerationAgent codeAgent;
    private final ReviewAgent reviewAgent;
    private final DeployAgent deployAgent;
    private final PipelineStore store;
    private final PipelineEventPublisher events;
    private final AuditService audit;
    private final DemoState demoState;
    private final ObjectProvider<PipelineOrchestrator> self;
    private final PresentationPacer pacer;
    private final LocalRepositoryTool repository;

    public PipelineOrchestrator(
            RequirementsAgent requirementsAgent,
            // WORKSHOP 2/4: Add this parameter to the existing constructor.
            // CONFLUENCE_EXERCISE:PARAMETER_BEGIN
            // TODO: Add ConfluenceAgent to this constructor.
            // CONFLUENCE_EXERCISE:PARAMETER_END
            CodeGenerationAgent codeAgent,
            ReviewAgent reviewAgent,
            DeployAgent deployAgent,
            PipelineStore store,
            PipelineEventPublisher events,
            AuditService audit,
            DemoState demoState,
            ObjectProvider<PipelineOrchestrator> self,
            PresentationPacer pacer,
            LocalRepositoryTool repository) {

        this.requirementsAgent = requirementsAgent;
        // WORKSHOP 3/4: Store the injected participant agent.
        // CONFLUENCE_EXERCISE:ASSIGNMENT_BEGIN
        // TODO: Store the injected ConfluenceAgent here.
        // CONFLUENCE_EXERCISE:ASSIGNMENT_END
        this.codeAgent = codeAgent;
        this.reviewAgent = reviewAgent;
        this.deployAgent = deployAgent;
        this.store = store;
        this.events = events;
        this.audit = audit;
        this.demoState = demoState;
        this.self = self;
        this.pacer = pacer;
        this.repository = repository;
    }

    /**
     * Create a pipeline for a ticket using the currently active scenario, then run it asynchronously.
     */
    public PipelineContext createAndRun(Ticket ticket) {
        DemoState.Selection selection = demoState.snapshot();
        return createAndRun(ticket, selection.scenario(), selection.mode());
    }

    public PipelineContext createAndRun(Ticket ticket, boolean executeRepository) {
        DemoState.Selection selection = demoState.snapshot();
        return createAndRun(ticket, selection.scenario(), selection.mode(), executeRepository);
    }

    public PipelineContext createAndRun(Ticket ticket, DemoScenario scenario, boolean executeRepository) {
        return createAndRun(ticket, scenario, demoState.snapshot().mode(), executeRepository);
    }

    /**
     * Create and run a pipeline with an explicit scenario; only the DEMO provider reads it.
     */
    public PipelineContext createAndRun(Ticket ticket, DemoScenario scenario) {
        return createAndRun(ticket, scenario, demoState.snapshot().mode());
    }

    private PipelineContext createAndRun(Ticket ticket, DemoScenario scenario, AiMode mode) {
        return createAndRun(ticket, scenario, mode, false);
    }

    private PipelineContext createAndRun(Ticket ticket, DemoScenario scenario, AiMode mode, boolean executeRepository) {
        if (executeRepository && mode != AiMode.LIVE)
            throw new IllegalArgumentException("Repository execution requires LIVE OpenAI or Ollama; Java DEMO proposals are never applied.");
        PipelineContext ctx =
                new PipelineContext(UUID.randomUUID(), ticket,
                        mode == AiMode.DEMO ? scenario : DemoScenario.NORMAL, mode);

        if (executeRepository) ctx.setRepositoryExecution(RepositoryExecution.requested());

        store.save(ctx);

        events.publish(
                PipelineEvent.of(
                        ctx.pipelineId(),
                        PipelineEventType.PIPELINE_STARTED,
                        "System",
                        "Pipeline started for " + ticket.key() + " (scenario: " + scenario + ")."));

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

        PipelineContext ctx = store.load(pipelineId).orElseThrow();

        try {

            if (ctx.executesRepository()) {
                events.publish(PipelineEvent.of(pipelineId, PipelineEventType.TOOL_INVOKED, "Rhea",
                        "Creating an isolated Ubuntu Bank clone and reading source files",
                        Map.of("step", "REPOSITORY_PREPARE", "repository", true)));
                ctx.setRepositoryExecution(repository.prepare(pipelineId));
                store.save(ctx);
            }

            // 1. Requirements

            transition(ctx, PipelineState.ANALYZING_REQUIREMENTS);

            // WORKSHOP 4/4: The supplied wrapper records activity; participants only add their
            // context call.
            // CONFLUENCE_EXERCISE:CALL_BEGIN
            // TODO: Gather business context here and pass it to Rhea before analysis.
            RequirementAnalysis analysis = requirementsAgent.analyze(ctx);
            // CONFLUENCE_EXERCISE:CALL_END

            ctx.setRequirementAnalysis(analysis);

            transition(ctx, PipelineState.REQUIREMENTS_READY);

            if (analysis.needsClarification()) {

                events.publish(
                        PipelineEvent.of(
                                pipelineId,
                                PipelineEventType.GATE_BLOCKED,
                                RequirementsAgent.NAME,
                                "Paused: awaiting human clarification before implementation."));

                audit.record(
                        pipelineId,
                        RequirementsAgent.NAME,
                        "PIPELINE_PAUSED",
                        "AWAITING_CLARIFICATION",
                        "BLOCKED",
                        "Requirement is ambiguous.");

                return; // pipeline halts until requirements are clarified
            }

            runImplementationStages(ctx);

        } catch (RuntimeException ex) {

            failPipeline(pipelineId, ctx, ex);
        }
    }

    private String withConfluenceActivity(PipelineContext ctx, Supplier<String> gatherContext) {
        events.publish(
                PipelineEvent.of(
                        ctx.pipelineId(),
                        PipelineEventType.AGENT_STARTED,
                        "Confluence",
                        "Gathering enterprise business context..."));
        events.publish(
                PipelineEvent.of(
                        ctx.pipelineId(),
                        PipelineEventType.TOOL_INVOKED,
                        "Confluence",
                        "Reading the local Confluence business policy",
                        Map.of("tool", "confluence", "step", "CONFLUENCE")));
        String context = gatherContext.get();
        pacer.afterActivity(ctx.aiMode());
        events.publish(
                PipelineEvent.of(
                        ctx.pipelineId(),
                        PipelineEventType.AGENT_COMPLETED,
                        "Confluence",
                        context == null || context.isBlank()
                                ? "Context retrieval completed without additional business information."
                                : "Enterprise business context retrieved. Rhea will assess its applicability."));
        return context;
    }

    /**
     * A human answers Rhea's clarification questions; the pipeline resumes from the code stage.
     * AI can never call this path.
     */
        public synchronized PipelineContext clarify(UUID pipelineId, List<String> answers) {

        PipelineContext ctx = store.load(pipelineId).orElseThrow();

        if (ctx.state() != PipelineState.REQUIREMENTS_READY
                || ctx.requirementAnalysis() == null
                || !ctx.requirementAnalysis().needsClarification()) {

            throw new IllegalStateException(
                    "Pipeline is not awaiting clarification (state=" + ctx.state() + ")");
        }

        RequirementAnalysis analysis = ctx.requirementAnalysis();
        List<String> questions = analysis.clarificationQuestions();
        if (answers == null
                || answers.size() != questions.size()
                || answers.stream().anyMatch(answer -> answer == null || answer.isBlank())) {
            throw new IllegalArgumentException(
                    "Provide one nonblank answer per clarification question.");
        }

        if (ctx.aiMode() == AiMode.DEMO && ctx.scenario() == DemoScenario.AMBIGUOUS_REQUIREMENT) {
            String channel = answers.getFirst().trim().toLowerCase(java.util.Locale.ROOT)
                    .replaceAll("[.!]+$", "").replaceAll("\\s+", " ");
            if (!channel.matches("(please )?(sms|use sms|send by sms|send via sms|send sms|sms only|use sms only)( please)?")) {
                throw new IllegalArgumentException("For this workshop notification, choose SMS (for example, Use SMS).");
            }
            answers = List.of("SMS");
        }

        StringBuilder clarification = new StringBuilder();
        for (int index = 0; index < questions.size(); index++) {
            clarification
                    .append(questions.get(index))
                    .append("\nAnswer: ")
                    .append(answers.get(index).trim())
                    .append('\n');
        }
        String joined = clarification.toString();
        ctx.setRequirementAnalysis(
                new RequirementAnalysis(
                        analysis.summary() + "\nHuman clarification:\n" + joined,
                        List.of(),
                        analysis.assumptions(),
                        analysis.acceptanceCriteria(),
                        analysis.complianceConcerns(),
                        analysis.technicalRisks(),
                        List.of()));
        transition(ctx, PipelineState.GENERATING_CODE);

        events.publish(
                PipelineEvent.of(
                        pipelineId,
                        PipelineEventType.AGENT_COMPLETED,
                        "Human",
                        "Clarifications provided. Resuming implementation."));

        audit.record(
                pipelineId,
                "Human",
                "CLARIFY_REQUIREMENTS",
                "CLARIFIED",
                "HUMAN_ACCOUNTABILITY",
                joined);

        self.getObject().continueAfterRequirements(pipelineId);

        return ctx;
    }

    public synchronized PipelineContext reviewFeedback(UUID pipelineId, String feedback) {
        PipelineContext ctx = store.load(pipelineId).orElseThrow();
        if (ctx.state() != PipelineState.WAITING_FOR_REVIEW_FEEDBACK
                || ctx.reviewDecision() == null
                || ctx.reviewDecision().outcome() != ReviewOutcome.REQUEST_CHANGES) {
            throw new IllegalStateException("This pipeline is not waiting for review feedback.");
        }
        if (feedback == null || feedback.isBlank()) {
            throw new IllegalArgumentException("Provide a requested correction.");
        }
        if (ctx.aiMode() == AiMode.DEMO) {
            String correction = feedback.trim().toLowerCase(java.util.Locale.ROOT)
                    .replaceAll("[.!]+$", "").replaceAll("\\s+", " ");
            if (!correction.matches("(please )?(use (a )?masked (transaction )?references?( instead)?|mask (the )?account numbers?|remove (the )?account numbers?( from (the )?logs)?|do not log (the )?account numbers?)( please)?")) {
                throw new IllegalArgumentException("Request: Use masked references.");
            }
            feedback = "Use masked references";
        }
        ctx.setReviewFeedback(feedback.trim());
        ctx.setCodeChangeSet(null);
        ctx.setReviewDecision(null);
        ctx.setDeploymentDecision(null);
        ctx.setApprovalState(ApprovalState.NOT_REQUIRED);
        if (ctx.executesRepository()) {
            var previous = ctx.repositoryExecution();
            ctx.setRepositoryExecution(previous.candidate(previous.candidateCommit(), previous.sourceFiles(), null));
        }
        transition(ctx, PipelineState.GENERATING_CODE);
        events.publish(PipelineEvent.of(pipelineId, PipelineEventType.AGENT_COMPLETED,
                "Human", "Review feedback received. Nova will revise the proposal and Sentinel will review it again."));
        audit.record(pipelineId, "Human", "REVIEW_FEEDBACK", "REVISION_REQUESTED",
                "HUMAN_ACCOUNTABILITY", ctx.reviewFeedback());
        self.getObject().continueAfterRequirements(pipelineId);
        return ctx;
    }

    /**
     * Resume the pipeline after requirements are clarified: run code, review and the deploy gate.
     */
    @Async
    public void continueAfterRequirements(UUID pipelineId) {

        PipelineContext ctx = store.load(pipelineId).orElseThrow();

        try {

            runImplementationStages(ctx);

        } catch (RuntimeException ex) {

            failPipeline(pipelineId, ctx, ex);
        }
    }

    private void runImplementationStages(PipelineContext ctx) {

        UUID pipelineId = ctx.pipelineId();

        // 2. Code

        if (ctx.state() != PipelineState.GENERATING_CODE) {
            transition(ctx, PipelineState.GENERATING_CODE);
        }

        CodeChangeSet changeSet = codeAgent.generate(ctx);

        if (ctx.executesRepository()) {
            RepositoryExecution execution = repository.applyAndTest(ctx.repositoryExecution(), changeSet, step -> {
                String message = switch (step) {
                    case "APPLY_FILES" -> "Writing proposed Python files to the isolated run clone";
                    case "GIT_DIFF" -> "Reading the actual Git diff for the candidate commit";
                    default -> "Running protected pytest against the candidate commit";
                };
                events.publish(PipelineEvent.of(pipelineId, PipelineEventType.TOOL_INVOKED,
                        CodeGenerationAgent.NAME, message, Map.of("step", step, "repository", true)));
            });
            ctx.setRepositoryExecution(execution);
            String diff = repository.diff(execution);
            changeSet = new CodeChangeSet(changeSet.files().stream().map(file ->
                    new FileChange(file.path(), file.changeType(), execution.sourceFiles().get(file.path()))).toList(),
                    diff, changeSet.explanation(), changeSet.tests(), changeSet.assumptions(), changeSet.testsPass());
            ctx.setCodeChangeSet(changeSet);
            store.save(ctx);
            events.publish(PipelineEvent.of(pipelineId, PipelineEventType.AGENT_COMPLETED, CodeGenerationAgent.NAME,
                    "Actual Git changes recorded; pytest " + (execution.testsPassed() ? "passed" : "failed")
                            + " (exit " + execution.testRun().exitCode() + ", " + execution.testRun().collected() + " tests)",
                    Map.of("repository", true, "step", "PYTEST_RESULT", "candidateCommit", execution.candidateCommit(),
                            "exitCode", execution.testRun().exitCode(), "tests", execution.testRun().collected())));
        }

        ctx.setCodeChangeSet(changeSet);

        transition(ctx, PipelineState.CODE_READY);

        // 3. Review

        transition(ctx, PipelineState.REVIEWING);

        ReviewDecision review = reviewAgent.review(ctx);

        ctx.setReviewDecision(review);
        if (ctx.executesRepository()) ctx.setRepositoryExecution(ctx.repositoryExecution().reviewed());

        if (review.outcome() == ReviewOutcome.REQUEST_CHANGES
                && (ctx.aiMode() == AiMode.LIVE || ctx.scenario() == DemoScenario.SECURITY_FAILURE)) {
            transition(ctx, PipelineState.WAITING_FOR_REVIEW_FEEDBACK);
            events.publish(PipelineEvent.of(pipelineId, PipelineEventType.GATE_BLOCKED,
                    ReviewAgent.NAME, "Paused: awaiting human feedback before revising the proposal."));
            return;
        }

        transition(
                ctx, review.passed() ? PipelineState.REVIEW_PASSED : PipelineState.REVIEW_FAILED);

        // 4. Deploy gate

        DeploymentDecision decision = deployAgent.evaluate(ctx);

        ctx.setDeploymentDecision(decision);

        if (decision.allowed()) {

            deploy(ctx);

        } else if (decision.requiresApproval()
                && review.passed()
                && !review.hasCriticalFindings()
                && (ctx.executesRepository() ? ctx.repositoryExecution().testsPassed() : changeSet.testsPass())) {

            ctx.setApprovalState(ApprovalState.PENDING);

            transition(ctx, PipelineState.WAITING_FOR_APPROVAL);

        } else {

            transition(ctx, PipelineState.BLOCKED);

            events.publish(
                    PipelineEvent.of(
                            pipelineId,
                            PipelineEventType.PIPELINE_FAILED,
                            "System",
                            "Pipeline blocked. " + decision.summary()));
        }
    }

    private void failPipeline(UUID pipelineId, PipelineContext ctx, RuntimeException ex) {

        log.error("Pipeline {} failed", pipelineId, ex);

        transition(ctx, PipelineState.FAILED);

        events.publish(
                PipelineEvent.of(
                        pipelineId,
                        PipelineEventType.PIPELINE_FAILED,
                        "System",
                        "Pipeline failed: " + ex.getMessage()));
    }

    /**
     * Human approves the deployment. AI can never call this path.
     */
    public PipelineContext approve(UUID pipelineId, String approver) {
        return approve(pipelineId, approver, null);
    }

    public synchronized PipelineContext approve(UUID pipelineId, String approver, String candidateCommit) {

        PipelineContext ctx = store.load(pipelineId).orElseThrow();

        if (ctx.state() != PipelineState.WAITING_FOR_APPROVAL) {

            throw new IllegalStateException(
                    "Pipeline is not awaiting approval (state=" + ctx.state() + ")");
        }

        if (ctx.executesRepository()) {
            if (candidateCommit == null || !candidateCommit.equals(ctx.repositoryExecution().candidateCommit()))
                throw new IllegalArgumentException("Explicit approval must identify the displayed candidate commit.");
            repository.verifyCandidate(ctx.repositoryExecution());
            DeploymentDecision check = deployAgent.revalidate(ctx);
            if (!check.requiresApproval() || !ctx.repositoryExecution().testsPassed()
                    || !candidateCommit.equals(ctx.repositoryExecution().reviewedCommit())
                    || !ctx.reviewDecision().passed())
                throw new IllegalStateException("The current repository candidate cannot be approved.");
            ctx.setRepositoryExecution(ctx.repositoryExecution().approved());
        }

        ctx.setApprovalState(ApprovalState.APPROVED);

        store.save(ctx);

        events.publish(
                PipelineEvent.of(
                        pipelineId,
                        PipelineEventType.APPROVAL_GRANTED,
                        "Human",
                        "Deployment approved by " + approver + "."));

        audit.record(
                pipelineId,
                "Human",
                "APPROVE_DEPLOYMENT",
                "APPROVED",
                "HUMAN_ACCOUNTABILITY",
                "Approved by " + approver);

        DeploymentDecision decision = deployAgent.revalidate(ctx);

        ctx.setDeploymentDecision(decision);

        if (decision.allowed()) {

            deploy(ctx);

        } else {

            transition(ctx, PipelineState.BLOCKED);
        }

        return ctx;
    }

    public synchronized PipelineContext merge(UUID pipelineId, String approver, String candidateCommit) {
        PipelineContext ctx = store.load(pipelineId).orElseThrow();
        if (!ctx.executesRepository() || ctx.approvalState() != ApprovalState.APPROVED
                || candidateCommit == null || !candidateCommit.equals(ctx.repositoryExecution().approvedCommit()))
            throw new IllegalStateException("Explicit approval for this candidate is required before local merge.");
        repository.verifyCandidate(ctx.repositoryExecution());
        if (!deployAgent.revalidate(ctx).allowed())
            throw new IllegalStateException("Release gates no longer pass.");
        if (ctx.repositoryExecution().mergedCommit() != null) return ctx;
        ctx.setRepositoryExecution(repository.mergeApproved(ctx.repositoryExecution()));
        store.save(ctx);
        events.publish(PipelineEvent.of(pipelineId, PipelineEventType.AGENT_THINKING, DeployAgent.NAME,
                "Approved candidate merged into the separate local integration clone; baseline unchanged",
                Map.of("step", "LOCAL_MERGE", "repository", true, "commit", ctx.repositoryExecution().mergedCommit())));
        audit.record(pipelineId, "Human", "LOCAL_MERGE", "MERGED", "EXPLICIT_APPROVAL",
                "Merged " + candidateCommit + " by " + approver + " into the integration clone only.");
        return ctx;
    }

    /**
     * Human rejects the deployment.
     */
    public PipelineContext reject(UUID pipelineId, String approver) {

        PipelineContext ctx = store.load(pipelineId).orElseThrow();

        if (ctx.state() != PipelineState.WAITING_FOR_APPROVAL) {
            throw new IllegalStateException(
                    "Pipeline is not awaiting approval (state=" + ctx.state() + ")");
        }

        ctx.setApprovalState(ApprovalState.REJECTED);

        transition(ctx, PipelineState.BLOCKED);

        events.publish(
                PipelineEvent.of(
                        pipelineId,
                        PipelineEventType.APPROVAL_REJECTED,
                        "Human",
                        "Deployment rejected by " + approver + "."));

        audit.record(
                pipelineId,
                "Human",
                "REJECT_DEPLOYMENT",
                "REJECTED",
                "HUMAN_ACCOUNTABILITY",
                "Rejected by " + approver);

        return ctx;
    }

    private void deploy(PipelineContext ctx) {

        transition(ctx, PipelineState.DEPLOYING);

        events.publish(
                PipelineEvent.of(
                        ctx.pipelineId(),
                        PipelineEventType.DEPLOYMENT_STARTED,
                        DeployAgent.NAME,
                        "Simulated deployment started; no production artifacts are deployed."));

        pacer.afterTransition(ctx.aiMode());

        transition(ctx, PipelineState.DEPLOYED);

        events.publish(
                PipelineEvent.of(
                        ctx.pipelineId(),
                        PipelineEventType.DEPLOYMENT_COMPLETED,
                        DeployAgent.NAME,
                        "Simulated deployment completed."));

        events.publish(
                PipelineEvent.of(
                        ctx.pipelineId(),
                        PipelineEventType.PIPELINE_COMPLETED,
                        "System",
                        "Pipeline completed successfully."));

        audit.record(
                ctx.pipelineId(),
                DeployAgent.NAME,
                "DEPLOY",
                "DEPLOYED",
                "OK",
                "Simulated deployment completed; no production deployment was performed.");
    }

    private void transition(PipelineContext ctx, PipelineState state) {

        ctx.setState(state);
        store.save(ctx);
        pacer.afterTransition(ctx.aiMode());
    }
}
