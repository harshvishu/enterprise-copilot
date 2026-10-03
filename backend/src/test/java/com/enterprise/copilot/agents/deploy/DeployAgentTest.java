package com.enterprise.copilot.agents.deploy;

import com.enterprise.copilot.domain.ApprovalState;
import com.enterprise.copilot.domain.CodeChangeSet;
import com.enterprise.copilot.domain.FileChange;
import com.enterprise.copilot.domain.DemoScenario;
import com.enterprise.copilot.domain.AiMode;
import com.enterprise.copilot.domain.PipelineContext;
import com.enterprise.copilot.domain.ReviewDecision;
import com.enterprise.copilot.domain.ReviewFinding;
import com.enterprise.copilot.domain.ReviewOutcome;
import com.enterprise.copilot.domain.Severity;
import com.enterprise.copilot.domain.Ticket;
import com.enterprise.copilot.domain.audit.AuditService;
import com.enterprise.copilot.infrastructure.ai.DemoResponses;
import com.enterprise.copilot.orchestration.PipelineEvent;
import com.enterprise.copilot.orchestration.PipelineEventPublisher;
import com.enterprise.copilot.orchestration.PipelineEventType;
import com.enterprise.copilot.orchestration.PresentationPacer;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

/**
 * Atlas must never allow deployment unless every gate passes AND a human has approved.
 */
class DeployAgentTest {

    private final PipelineEventPublisher events = mock(PipelineEventPublisher.class);

    private final DeployAgent agent =
            new DeployAgent(
                    events,
                    mock(AuditService.class),
                    new PresentationPacer(0, 0));

    private List<PipelineEvent> gateEvents() {
        ArgumentCaptor<PipelineEvent> captor = ArgumentCaptor.forClass(PipelineEvent.class);
        verify(events, atLeastOnce()).publish(captor.capture());
        return captor.getAllValues().stream()
                .filter(event -> event.type() == PipelineEventType.GATE_EVALUATED)
                .toList();
    }

    @Test
    void publishesEachGateWithStableIdentifiers() {
        var ctx = ctx();
        ctx.setCodeChangeSet(code(true));
        ctx.setReviewDecision(new ReviewDecision(ReviewOutcome.APPROVE, "ok", List.of()));

        agent.evaluate(ctx);

        List<PipelineEvent> gates = gateEvents();
        assertThat(gates).extracting(event -> event.data().get("gate")).containsExactly(
                "REQUIREMENTS_RESOLVED", "CODE_PROPOSAL_PRESENT", "REVIEW_APPROVED",
                "NO_CRITICAL_FINDINGS", "TESTS_PASS", "HUMAN_APPROVAL");
        assertThat(gates.get(5).data()).containsEntry("passed", false).containsEntry("waiting", true);
    }

    @Test
    void failedGateIsReportedAndApprovalIsNotRequested() {
        var ctx = ctx();
        ctx.setCodeChangeSet(code(false));
        ctx.setReviewDecision(new ReviewDecision(ReviewOutcome.APPROVE, "ok", List.of()));

        agent.evaluate(ctx);

        List<PipelineEvent> gates = gateEvents();
        assertThat(gates).extracting(event -> event.data().get("gate")).doesNotContain("HUMAN_APPROVAL");
        assertThat(gates.get(4).data()).containsEntry("gate", "TESTS_PASS").containsEntry("passed", false);
    }

    @Test
    void revalidationAppliesTheSameRulesWithoutPerGateEvents() {
        var ctx = ctx();
        ctx.setCodeChangeSet(code(true));
        ctx.setReviewDecision(new ReviewDecision(ReviewOutcome.APPROVE, "ok", List.of()));
        ctx.setApprovalState(ApprovalState.APPROVED);

        assertThat(agent.revalidate(ctx).allowed()).isTrue();
        assertThat(gateEvents()).isEmpty();

        ctx.setCodeChangeSet(code(false));
        assertThat(agent.revalidate(ctx).allowed()).isFalse();
    }

    private PipelineContext ctx() {

        PipelineContext ctx = new PipelineContext(
                UUID.randomUUID(),
                new Ticket(
                        "UB-4821",
                        "t",
                        "d",
                        "JIRA"
                ),
                DemoScenario.NORMAL,
                AiMode.DEMO
        );
        ctx.setRequirementAnalysis(new DemoResponses().requirements(DemoScenario.NORMAL));
        return ctx;
    }

    private CodeChangeSet code(boolean testsPass) {

        return new CodeChangeSet(
                List.of(new FileChange("Service.java", FileChange.ChangeType.CREATE, "class Service {}")),
                "+class Service {}",
                "",
                List.of(),
                List.of(),
                testsPass
        );
    }

    @Test
        void approvalCannotOverrideMissingArtifacts() {
                var ctx = ctx();
                ctx.setReviewDecision(new ReviewDecision(ReviewOutcome.APPROVE, "ok", List.of()));
                ctx.setApprovalState(ApprovalState.APPROVED);

                assertThat(agent.evaluate(ctx).allowed()).isFalse();
                assertThat(agent.evaluate(ctx).blockingReasons()).contains("Code proposal artifacts are missing.");

                ctx.setCodeChangeSet(code(true));
                ctx.setRequirementAnalysis(null);
                assertThat(agent.evaluate(ctx).allowed()).isFalse();
        }

        @Test
        void approvalCannotOverrideUnresolvedClarification() {
                var ctx = ctx();
                ctx.setCodeChangeSet(code(true));
                ctx.setRequirementAnalysis(new DemoResponses().requirements(DemoScenario.AMBIGUOUS_REQUIREMENT));
                ctx.setReviewDecision(new ReviewDecision(ReviewOutcome.APPROVE, "ok", List.of()));
                ctx.setApprovalState(ApprovalState.APPROVED);

                assertThat(agent.evaluate(ctx).allowed()).isFalse();
        }

        @Test
    void blocksWhenReviewRejected() {

        var ctx = ctx();

        ctx.setCodeChangeSet(code(true));

        ctx.setReviewDecision(
                new ReviewDecision(
                        ReviewOutcome.REJECT,
                        "no",
                        List.of()
                ));

        var decision = agent.evaluate(ctx);

        assertThat(decision.allowed()).isFalse();
    }

    @Test
    void blocksWhenTestsFail() {

        var ctx = ctx();

        ctx.setCodeChangeSet(code(false));

        ctx.setReviewDecision(
                new ReviewDecision(
                        ReviewOutcome.APPROVE,
                        "ok",
                        List.of()
                ));

        var decision = agent.evaluate(ctx);

        assertThat(decision.allowed()).isFalse();

        assertThat(
                decision.blockingReasons().toString())
                .contains("Tests");
    }

    @Test
    void blocksWhenCriticalFindingPresent() {

        var ctx = ctx();

        ctx.setCodeChangeSet(code(true));

        ctx.setReviewDecision(
                new ReviewDecision(
                        ReviewOutcome.APPROVE,
                        "ok",
                        List.of(
                                new ReviewFinding(
                                        Severity.CRITICAL,
                                        "SECURITY",
                                        "f",
                                        "1",
                                        "d",
                                        "r"
                                )
                        )
                )
        );

        assertThat(
                agent.evaluate(ctx).allowed())
                .isFalse();
    }

    @Test
    void requiresHumanApprovalWhenGatesPass() {

        var ctx = ctx();

        ctx.setCodeChangeSet(code(true));

        ctx.setReviewDecision(
                new ReviewDecision(
                        ReviewOutcome.APPROVE,
                        "ok",
                        List.of()
                ));

        var decision = agent.evaluate(ctx);

        assertThat(decision.allowed()).isFalse();

        assertThat(
                decision.requiresApproval())
                .isTrue();
    }

    @Test
    void allowsOnlyAfterHumanApproval() {

        var ctx = ctx();

        ctx.setCodeChangeSet(code(true));

        ctx.setReviewDecision(
                new ReviewDecision(
                        ReviewOutcome.APPROVE,
                        "ok",
                        List.of()
                ));

        ctx.setApprovalState(
                ApprovalState.APPROVED);

        assertThat(
                agent.evaluate(ctx).allowed())
                .isTrue();
    }
}