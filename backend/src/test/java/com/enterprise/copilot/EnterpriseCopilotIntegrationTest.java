package com.enterprise.copilot;

import com.enterprise.copilot.domain.DemoScenario;
import com.enterprise.copilot.domain.ApprovalState;
import com.enterprise.copilot.domain.AiMode;
import com.enterprise.copilot.domain.PipelineContext;
import com.enterprise.copilot.domain.PipelineState;
import com.enterprise.copilot.domain.Ticket;
import com.enterprise.copilot.infrastructure.ai.DemoState;
import com.enterprise.copilot.orchestration.PipelineOrchestrator;
import com.enterprise.copilot.persistence.PipelineStore;
import com.enterprise.copilot.persistence.entity.PipelineEntity;
import com.enterprise.copilot.persistence.repository.PipelineRepository;
import org.awaitility.Awaitility;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Full-stack test on H2: exercises the orchestrator, agents, persistence and approval gate for the
 * key scenarios. No external AI provider required (deterministic demo mode).
 */
@SpringBootTest
@ActiveProfiles("demo")
@TestPropertySource(properties = "copilot.demo.step-delay-ms=0")
class EnterpriseCopilotIntegrationTest {

    @Autowired
    PipelineOrchestrator orchestrator;

    @Autowired
    PipelineStore store;

        @Autowired
        PipelineRepository pipelineRepository;

    @Autowired
    DemoState demoState;

    private Ticket ticket() {

        return new Ticket(
                "UB-4821",
                "High Value Transaction Notification",
                "Customers should receive a notification when a transaction exceeds R50,000.",
                "JIRA"
        );
    }

    private PipelineState awaitState(
            UUID id,
            PipelineState... accepted) {

        Awaitility.await()
                .atMost(Duration.ofSeconds(15))
                .until(() ->
                        store.load(id)
                                .map(c -> {
                                    for (PipelineState s : accepted) {
                                        if (c.state() == s) {
                                            return true;
                                        }
                                    }
                                    return false;
                                })
                                .orElse(false)
                );

        return store.load(id)
                .orElseThrow()
                .state();
    }

        @Test
        void persistedTimestampsAreRestoredWhenLoaded() {
                Instant createdAt = Instant.parse("2024-01-02T03:04:05Z");
                PipelineContext ctx = new PipelineContext(
                                UUID.randomUUID(), ticket(), DemoScenario.NORMAL, AiMode.DEMO, createdAt);

                store.save(ctx);

                PipelineEntity persisted = pipelineRepository.findById(ctx.pipelineId()).orElseThrow();
                PipelineContext loaded = store.load(ctx.pipelineId()).orElseThrow();

                assertThat(loaded.createdAt()).isEqualTo(persisted.getCreatedAt());
                assertThat(loaded.updatedAt()).isEqualTo(persisted.getUpdatedAt());
        }

    @Test
    void securityFailureIsBlockedByReview() {

        demoState.setScenario(
                DemoScenario.SECURITY_FAILURE);

        PipelineContext ctx =
                orchestrator.createAndRun(ticket());

        PipelineState state =
                awaitState(
                        ctx.pipelineId(),
                        PipelineState.REVIEW_FAILED,
                        PipelineState.BLOCKED);

        PipelineContext loaded =
                store.load(ctx.pipelineId())
                        .orElseThrow();

        assertThat(
                loaded.reviewDecision()
                        .hasCriticalFindings())
                .isTrue();

        assertThat(state)
                .isIn(
                        PipelineState.REVIEW_FAILED,
                        PipelineState.BLOCKED);
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

        demoState.setScenario(
                DemoScenario.NORMAL);

        PipelineContext ctx =
                orchestrator.createAndRun(ticket());

        awaitState(
                ctx.pipelineId(),
                PipelineState.WAITING_FOR_APPROVAL);

        orchestrator.approve(
                ctx.pipelineId(),
                "test-presenter");

        PipelineState state =
                awaitState(
                        ctx.pipelineId(),
                        PipelineState.DEPLOYED);

        assertThat(state)
                .isEqualTo(
                        PipelineState.DEPLOYED);
    }

    @Test
    void clarificationAnswersAreSavedBeforeImplementationResumes() {
        demoState.setScenario(DemoScenario.AMBIGUOUS_REQUIREMENT);
        PipelineContext ctx = orchestrator.createAndRun(ticket());
        awaitState(ctx.pipelineId(), PipelineState.REQUIREMENTS_READY);

        PipelineContext resumed = orchestrator.clarify(ctx.pipelineId(), List.of(
                "Use consented SMS only.", "Outgoing debits only.", "Configure R50,000 per product."));

        assertThat(resumed.state()).isEqualTo(PipelineState.GENERATING_CODE);
        assertThat(resumed.requirementAnalysis().needsClarification()).isFalse();
        assertThat(resumed.requirementAnalysis().summary()).contains("Use consented SMS only.");
        assertThatThrownBy(() -> orchestrator.clarify(ctx.pipelineId(), List.of()))
                .isInstanceOf(IllegalStateException.class);
        awaitState(ctx.pipelineId(), PipelineState.WAITING_FOR_APPROVAL);
        assertThat(store.load(ctx.pipelineId()).orElseThrow().requirementAnalysis().summary())
                .contains("Outgoing debits only.", "Configure R50,000 per product.");
    }

    @Test
    void blankClarificationDoesNotResumePipeline() {
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

        demoState.setScenario(
                DemoScenario.AMBIGUOUS_REQUIREMENT);

        PipelineContext ctx =
                orchestrator.createAndRun(ticket());

        PipelineState state =
                awaitState(
                        ctx.pipelineId(),
                        PipelineState.REQUIREMENTS_READY);

        assertThat(state)
                .isEqualTo(
                        PipelineState.REQUIREMENTS_READY);

        assertThat(
                store.load(ctx.pipelineId())
                        .orElseThrow()
                        .requirementAnalysis()
                        .needsClarification())
                .isTrue();
    }
}