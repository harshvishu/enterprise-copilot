package com.enterprise.copilot.agents.deploy;

import com.enterprise.copilot.domain.ApprovalState;
import com.enterprise.copilot.domain.CodeChangeSet;
import com.enterprise.copilot.domain.DemoScenario;
import com.enterprise.copilot.domain.AiMode;
import com.enterprise.copilot.domain.PipelineContext;
import com.enterprise.copilot.domain.ReviewDecision;
import com.enterprise.copilot.domain.ReviewFinding;
import com.enterprise.copilot.domain.ReviewOutcome;
import com.enterprise.copilot.domain.Severity;
import com.enterprise.copilot.domain.Ticket;
import com.enterprise.copilot.domain.audit.AuditService;
import com.enterprise.copilot.orchestration.PipelineEventPublisher;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

/**
 * Atlas must never allow deployment unless every gate passes AND a human has approved.
 */
class DeployAgentTest {

    private final DeployAgent agent =
            new DeployAgent(
                    mock(PipelineEventPublisher.class),
                    mock(AuditService.class));

    private PipelineContext ctx() {

        return new PipelineContext(
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
    }

    private CodeChangeSet code(boolean testsPass) {

        return new CodeChangeSet(
                List.of(),
                "",
                "",
                List.of(),
                List.of(),
                testsPass
        );
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