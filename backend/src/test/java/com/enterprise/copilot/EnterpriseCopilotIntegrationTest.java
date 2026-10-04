package com.enterprise.copilot;

import com.enterprise.copilot.domain.DemoScenario;
import com.enterprise.copilot.domain.ApprovalState;
import com.enterprise.copilot.domain.AiMode;
import com.enterprise.copilot.domain.PipelineContext;
import com.enterprise.copilot.domain.PipelineState;
import com.enterprise.copilot.domain.Ticket;
import com.enterprise.copilot.demo.DemoTickets;
import com.enterprise.copilot.infrastructure.ai.DemoState;
import com.enterprise.copilot.orchestration.PipelineOrchestrator;
import com.enterprise.copilot.orchestration.PipelineEventPublisher;
import com.enterprise.copilot.orchestration.PipelineEventType;
import com.enterprise.copilot.persistence.PipelineStore;
import com.enterprise.copilot.persistence.entity.PipelineEntity;
import com.enterprise.copilot.persistence.repository.PipelineRepository;
import com.enterprise.copilot.tools.ConfluenceTool;
import org.awaitility.Awaitility;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.doThrow;

/**
 * Full-stack test on H2: exercises the orchestrator, agents, persistence and approval gate for the
 * key scenarios. No external AI provider required (deterministic demo mode).
 */
@SpringBootTest
@ActiveProfiles("demo")
@TestPropertySource(
        properties = {"copilot.demo.step-delay-ms=0", "copilot.demo.activity-delay-ms=0"})
class EnterpriseCopilotIntegrationTest {

    @Autowired PipelineOrchestrator orchestrator;

    @Autowired PipelineStore store;

    @Autowired PipelineRepository pipelineRepository;

    @Autowired DemoState demoState;

    @Autowired PipelineEventPublisher events;

        @MockitoSpyBean ConfluenceTool confluenceTool;

    private Ticket ticket() {

        return new Ticket(
                "UB-4821",
                "High Value Transaction Notification",
                "Customers should receive a notification when a transaction exceeds R50,000.",
                "JIRA");
    }

    private PipelineState awaitState(UUID id, PipelineState... accepted) {

        Awaitility.await()
                .atMost(Duration.ofSeconds(15))
                .until(
                        () ->
                                store.load(id)
                                        .map(
                                                c -> {
                                                    for (PipelineState s : accepted) {
                                                        if (c.state() == s) {
                                                            return true;
                                                        }
                                                    }
                                                    return false;
                                                })
                                        .orElse(false));

        return store.load(id).orElseThrow().state();
    }

    @Test
    void persistedTimestampsAreRestoredWhenLoaded() {
        Instant createdAt = Instant.parse("2024-01-02T03:04:05Z");
        PipelineContext ctx =
                new PipelineContext(
                        UUID.randomUUID(), ticket(), DemoScenario.NORMAL, AiMode.DEMO, createdAt);

        store.save(ctx);

        PipelineEntity persisted = pipelineRepository.findById(ctx.pipelineId()).orElseThrow();
        PipelineContext loaded = store.load(ctx.pipelineId()).orElseThrow();

        assertThat(loaded.createdAt()).isEqualTo(persisted.getCreatedAt());
        assertThat(loaded.updatedAt()).isEqualTo(persisted.getUpdatedAt());
    }

    @Test
    void securityFailureIsBlockedByReview() {

        demoState.setScenario(DemoScenario.SECURITY_FAILURE);

        PipelineContext ctx = orchestrator.createAndRun(ticket());

        PipelineState state =
                awaitState(ctx.pipelineId(), PipelineState.REVIEW_FAILED, PipelineState.BLOCKED);

        PipelineContext loaded = store.load(ctx.pipelineId()).orElseThrow();

        assertThat(loaded.reviewDecision().hasCriticalFindings()).isTrue();

        assertThat(state).isIn(PipelineState.REVIEW_FAILED, PipelineState.BLOCKED);
    }

    @Test
    void rejectionIsOnlyAllowedWhileAwaitingApproval() {
        demoState.setScenario(DemoScenario.NORMAL);
        PipelineContext ctx = orchestrator.createAndRun(ticket());
        awaitState(ctx.pipelineId(), PipelineState.WAITING_FOR_APPROVAL);

        PipelineContext rejected = orchestrator.reject(ctx.pipelineId(), "test-presenter");
        assertThat(rejected.state()).isEqualTo(PipelineState.BLOCKED);
        assertThat(rejected.approvalState()).isEqualTo(ApprovalState.REJECTED);
        assertThatThrownBy(() -> orchestrator.reject(ctx.pipelineId(), "test-presenter"))
                .isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> orchestrator.approve(ctx.pipelineId(), "test-presenter"))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void normalScenarioReachesApprovalThenDeploys() {

        demoState.setScenario(DemoScenario.NORMAL);

        PipelineContext ctx = orchestrator.createAndRun(ticket());

        awaitState(ctx.pipelineId(), PipelineState.WAITING_FOR_APPROVAL);

        orchestrator.approve(ctx.pipelineId(), "test-presenter");

        PipelineState state = awaitState(ctx.pipelineId(), PipelineState.DEPLOYED);

        assertThat(state).isEqualTo(PipelineState.DEPLOYED);
    }

    @Test
    void clarificationAnswersAreSavedBeforeImplementationResumes() {
                doReturn("").when(confluenceTool).lookup(anyString());
        demoState.setScenario(DemoScenario.AMBIGUOUS_REQUIREMENT);
        PipelineContext ctx = orchestrator.createAndRun(ticket());
        awaitState(ctx.pipelineId(), PipelineState.REQUIREMENTS_READY);

        PipelineContext resumed =
                orchestrator.clarify(
                        ctx.pipelineId(),
                        List.of(
                                "Outgoing debits only.",
                                "Use consented SMS only.",
                                "Skip and audit when there is no SMS consent."));

        assertThat(resumed.state()).isEqualTo(PipelineState.GENERATING_CODE);
        assertThat(resumed.requirementAnalysis().needsClarification()).isFalse();
        assertThat(resumed.requirementAnalysis().summary()).contains("Use consented SMS only.");
        assertThatThrownBy(() -> orchestrator.clarify(ctx.pipelineId(), List.of()))
                .isInstanceOf(IllegalStateException.class);
        awaitState(ctx.pipelineId(), PipelineState.WAITING_FOR_APPROVAL);
        assertThat(store.load(ctx.pipelineId()).orElseThrow().requirementAnalysis().summary())
                .contains("Outgoing debits only.", "Skip and audit when there is no SMS consent.");
    }

    @Test
    void blankClarificationDoesNotResumePipeline() {
                doReturn("").when(confluenceTool).lookup(anyString());
        demoState.setScenario(DemoScenario.AMBIGUOUS_REQUIREMENT);
        PipelineContext ctx = orchestrator.createAndRun(ticket());
        awaitState(ctx.pipelineId(), PipelineState.REQUIREMENTS_READY);

        assertThatThrownBy(() -> orchestrator.clarify(ctx.pipelineId(), List.of("SMS", " ", "ZAR")))
                .isInstanceOf(IllegalArgumentException.class);
        assertThat(store.load(ctx.pipelineId()).orElseThrow().state())
                .isEqualTo(PipelineState.REQUIREMENTS_READY);
    }

    @Test
    void ambiguousRequirementPausesForClarification() {
                doReturn("").when(confluenceTool).lookup(anyString());

        demoState.setScenario(DemoScenario.AMBIGUOUS_REQUIREMENT);

        PipelineContext ctx = orchestrator.createAndRun(ticket());

        PipelineState state = awaitState(ctx.pipelineId(), PipelineState.REQUIREMENTS_READY);

        assertThat(state).isEqualTo(PipelineState.REQUIREMENTS_READY);

        assertThat(
                        store.load(ctx.pipelineId())
                                .orElseThrow()
                                .requirementAnalysis()
                                .needsClarification())
                .isTrue();
    }

    @Test
    void confluenceActivityPrecedesRheaUsingExistingEventTypes() {
        var issue = new DemoTickets().find("UB-4823").orElseThrow();
        var ctx = orchestrator.createAndRun(issue.ticket(), issue.scenario());
        PipelineState state =
                awaitState(
                        ctx.pipelineId(),
                        PipelineState.WAITING_FOR_APPROVAL,
                        PipelineState.REQUIREMENTS_READY);
        var history = events.historyFor(ctx.pipelineId());
        var confluenceEvents =
                history.stream().filter(event -> "Confluence".equals(event.agent())).toList();

        if (state == PipelineState.REQUIREMENTS_READY) {
            assertThat(
                            store.load(ctx.pipelineId())
                                    .orElseThrow()
                                    .requirementAnalysis()
                                    .needsClarification())
                    .isTrue();
            assertThat(confluenceEvents).isEmpty();
            return;
        }

        assertThat(confluenceEvents)
                .extracting(event -> event.type())
                .containsExactly(
                        PipelineEventType.AGENT_STARTED,
                        PipelineEventType.TOOL_INVOKED,
                        PipelineEventType.AGENT_COMPLETED);
        assertThat(confluenceEvents.get(1).data()).containsEntry("tool", "confluence");
        var rheaStarted =
                history.stream()
                        .filter(
                                event ->
                                        "Rhea".equals(event.agent())
                                                && event.type() == PipelineEventType.AGENT_STARTED)
                        .findFirst()
                        .orElseThrow();
        assertThat(history.indexOf(confluenceEvents.getLast()))
                .isLessThan(history.indexOf(rheaStarted));
    }

    @Test
    void failedConfluenceLookupDoesNotStartRheaOrEmitCompletion() {
        doThrow(new IllegalStateException("Confluence context unavailable"))
                .when(confluenceTool)
                .lookup(anyString());
        var issue = new DemoTickets().find("UB-4823").orElseThrow();
        var ctx = orchestrator.createAndRun(issue.ticket(), issue.scenario());
        PipelineState state =
                awaitState(
                        ctx.pipelineId(), PipelineState.FAILED, PipelineState.REQUIREMENTS_READY);

        if (state == PipelineState.REQUIREMENTS_READY) {
            assertThat(
                            store.load(ctx.pipelineId())
                                    .orElseThrow()
                                    .requirementAnalysis()
                                    .needsClarification())
                    .isTrue();
            assertThat(events.historyFor(ctx.pipelineId()))
                    .noneMatch(event -> "Confluence".equals(event.agent()));
            return;
        }

        Awaitility.await()
                .atMost(Duration.ofSeconds(15))
                .untilAsserted(
                        () ->
                                assertThat(events.historyFor(ctx.pipelineId()))
                                        .anyMatch(
                                                event ->
                                                        event.type()
                                                                == PipelineEventType
                                                                        .PIPELINE_FAILED));
        var history = events.historyFor(ctx.pipelineId());
        assertThat(store.load(ctx.pipelineId()).orElseThrow().requirementAnalysis()).isNull();
        assertThat(history)
                .filteredOn(event -> "Confluence".equals(event.agent()))
                .extracting(event -> event.type())
                .containsExactly(PipelineEventType.AGENT_STARTED, PipelineEventType.TOOL_INVOKED);
        assertThat(history).noneMatch(event -> "Rhea".equals(event.agent()));
    }

    @Test
    void allCatalogIssuesFollowTheirTeachingLifecycle() {
        for (var issue : new DemoTickets().issues()) {
            var ctx = orchestrator.createAndRun(issue.ticket(), issue.scenario());
            UUID id = ctx.pipelineId();
            switch (issue.scenario()) {
                case AMBIGUOUS_REQUIREMENT -> {
                    PipelineState state =
                            awaitState(
                                    id,
                                    PipelineState.WAITING_FOR_APPROVAL,
                                    PipelineState.REQUIREMENTS_READY);
                    var resolved = store.load(id).orElseThrow();
                    if (state == PipelineState.REQUIREMENTS_READY) {
                        assertThat(resolved.requirementAnalysis().needsClarification()).isTrue();
                        assertThatThrownBy(() -> orchestrator.approve(id, "catalog-presenter"))
                                .isInstanceOf(IllegalStateException.class);
                    } else {
                        assertThat(resolved.requirementAnalysis().needsClarification()).isFalse();
                        assertThat(resolved.requirementAnalysis().summary())
                                .contains(
                                        "retail-high-value-alerts",
                                        "exclude credits",
                                        "SMS only",
                                        "skip/audit");
                        assertThat(resolved.requirementAnalysis().summary())
                                .doesNotContain("Human clarification:");
                        assertThat(orchestrator.approve(id, "catalog-presenter").state())
                                .isEqualTo(PipelineState.DEPLOYED);
                    }
                }
                case HALLUCINATED_API -> {
                    awaitState(id, PipelineState.REQUIREMENTS_READY);
                    assertThat(store.load(id).orElseThrow().codeChangeSet()).isNull();
                    assertThatThrownBy(() -> orchestrator.approve(id, "presenter"))
                            .isInstanceOf(IllegalStateException.class);
                    orchestrator.clarify(
                            id,
                            List.of(
                                    "No contract supplied; do not invent screening.",
                                    "Stop and audit without notification when screening is unavailable."));
                    awaitState(id, PipelineState.BLOCKED);
                    var blocked = store.load(id).orElseThrow();
                    assertThat(blocked.reviewDecision().outcome().name())
                            .isEqualTo("REQUEST_CHANGES");
                    assertThat(blocked.reviewDecision().hasCriticalFindings()).isFalse();
                    assertThat(blocked.approvalState()).isEqualTo(ApprovalState.NOT_REQUIRED);
                }
                case SECURITY_FAILURE, TEST_FAILURE -> {
                    awaitState(id, PipelineState.BLOCKED);
                    var blocked = store.load(id).orElseThrow();
                    assertThat(blocked.deploymentDecision().requiresApproval()).isFalse();
                    if (issue.scenario() == DemoScenario.TEST_FAILURE) {
                        assertThat(blocked.reviewDecision().passed()).isTrue();
                        assertThat(blocked.codeChangeSet().hasPassingTestSignal()).isFalse();
                        assertThat(blocked.deploymentDecision().blockingReasons())
                                .anyMatch(
                                        reason ->
                                                reason.contains("simulated/model-provided signal"));
                    }
                    assertThatThrownBy(() -> orchestrator.approve(id, "presenter"))
                            .isInstanceOf(IllegalStateException.class);
                }
                default -> {
                    awaitState(id, PipelineState.WAITING_FOR_APPROVAL);
                    assertThat(orchestrator.approve(id, "catalog-presenter").state())
                            .isEqualTo(PipelineState.DEPLOYED);
                }
            }
            assertThat(store.load(id).orElseThrow().ticket()).isEqualTo(issue.ticket());
        }
    }
}
