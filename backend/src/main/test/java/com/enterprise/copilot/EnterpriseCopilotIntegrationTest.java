package com.enterprise.copilot;

import com.enterprise.copilot.domain.DemoScenario;
import com.enterprise.copilot.domain.PipelineContext;
import com.enterprise.copilot.domain.PipelineState;
import com.enterprise.copilot.domain.Ticket;
import com.enterprise.copilot.infrastructure.ai.DemoState;
import com.enterprise.copilot.orchestration.PipelineOrchestrator;
import com.enterprise.copilot.persistence.PipelineStore;
import org.awaitility.Awaitility;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import java.time.Duration;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Full-stack test on H2: exercises the orchestrator, agents, persistence and approval gate for the
 * key scenarios. No external AI provider required (deterministic demo mode).
 */
@SpringBootTest
@TestPropertySource(properties = "copilot.demo.step-delay-ms=0")
class EnterpriseCopilotIntegrationTest {

    @Autowired
    PipelineOrchestrator orchestrator;

    @Autowired
    PipelineStore store;

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