package com.enterprise.copilot.agents;

import com.enterprise.copilot.agents.code.CodeGenerationAgent;
import com.enterprise.copilot.agents.review.ReviewAgent;
import com.enterprise.copilot.domain.*;
import com.enterprise.copilot.domain.audit.AuditService;
import com.enterprise.copilot.infrastructure.ai.*;
import com.enterprise.copilot.orchestration.PipelineEventPublisher;
import com.enterprise.copilot.orchestration.PresentationPacer;
import com.enterprise.copilot.tools.ApiSpecificationTool;
import com.enterprise.copilot.tools.ArchitectureTool;
import com.enterprise.copilot.tools.ComplianceTool;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class AgentGroundingTest {
    private final AgentAiClient ai = mock(AgentAiClient.class);
    private final PipelineEventPublisher events = mock(PipelineEventPublisher.class);
    private final AuditService audit = mock(AuditService.class);
    private final PromptLibrary prompts = new PromptLibrary();
    private final PresentationPacer pacer = new PresentationPacer(0, 0);

    @Test
    void routingUsesSavedRunModeInsteadOfThePresentersCurrentSelection() {
        DemoState state = mock(DemoState.class);
        when(state.aiMode()).thenReturn(AiMode.LIVE);
        SpringAiAgentAiClient live = mock(SpringAiAgentAiClient.class);
        org.springframework.beans.factory.ObjectProvider<SpringAiAgentAiClient> available =
                mock(org.springframework.beans.factory.ObjectProvider.class);
        when(available.getIfAvailable()).thenReturn(live);
        var router = new RoutingAgentAiClient(new DemoAgentAiClient(new DemoResponses()), available, state);
        var demoRun = new PipelineContext(UUID.randomUUID(), context().ticket(), DemoScenario.NORMAL, AiMode.DEMO);
        assertThat(router.generateForRun(AgentKind.REVIEW, demoRun, "", ReviewDecision.class).passed())
                .isTrue();
        verifyNoInteractions(live);

        var liveRun = context();
        var review = new DemoResponses().review(DemoScenario.NORMAL);
        when(state.aiMode()).thenReturn(AiMode.DEMO);
        when(live.generateForRun(AgentKind.REVIEW, liveRun, "", ReviewDecision.class)).thenReturn(review);
        assertThat(router.generateForRun(AgentKind.REVIEW, liveRun, "", ReviewDecision.class)).isSameAs(review);
        verify(live).generateForRun(AgentKind.REVIEW, liveRun, "", ReviewDecision.class);
    }

    @Test
    void liveRunWithoutAProviderDoesNotSilentlyUseDemo() {
        org.springframework.beans.factory.ObjectProvider<SpringAiAgentAiClient> unavailable =
                mock(org.springframework.beans.factory.ObjectProvider.class);
        var router = new RoutingAgentAiClient(new DemoAgentAiClient(new DemoResponses()), unavailable, mock(DemoState.class));
        org.assertj.core.api.Assertions.assertThatThrownBy(() ->
                router.generateForRun(AgentKind.REVIEW, context(), "", ReviewDecision.class))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("No DEMO fallback");
    }

    private PipelineContext context() {
        var ctx =
                new PipelineContext(
                        UUID.randomUUID(),
                        new Ticket(
                                "EXAMPLE-1",
                                "Debit alerts",
                                "Require two retries without duplicates.",
                                "JIRA"),
                        DemoScenario.NORMAL,
                        AiMode.LIVE);
        ctx.setRequirementAnalysis(
                new RequirementAnalysis(
                        "Generic consented alerts.\nHuman clarification:\nChannel?\nAnswer: SMS only.",
                        List.of(),
                        List.of(),
                        List.of(
                                "Retry transient failures twice without duplicates",
                                "Audit failures"),
                        List.of("No PII"),
                        List.of(),
                        List.of()));
        return ctx;
    }

    @Test
    void novaReceivesSummaryHumanAnswersArchitectureAndApiEvidence() {
        var proposal = new DemoResponses().code(DemoScenario.NORMAL);
        when(ai.generateForRun(eq(AgentKind.CODE), any(), anyString(), eq(CodeChangeSet.class)))
                .thenReturn(proposal);
        var agent =
                new CodeGenerationAgent(
                        ai,
                        prompts,
                        new ArchitectureTool(),
                        new ApiSpecificationTool(),
                        events,
                        audit,
                        pacer);
        var ctx = context();

        assertThat(agent.generate(ctx)).isSameAs(proposal);

        var prompt = ArgumentCaptor.forClass(String.class);
        verify(ai)
                .generateForRun(
                        eq(AgentKind.CODE),
                        eq(ctx),
                        prompt.capture(),
                        eq(CodeChangeSet.class));
        assertThat(prompt.getValue())
                .contains(
                        ctx.requirementAnalysis().summary(),
                        "Retry transient failures twice without duplicates",
                        "Audit failures",
                        "All customer-facing side effects must be idempotent",
                        "operationId: sendNotification",
                        "missing evidence",
                        "internally consistent Java",
                        "behavioural tests");
        assertThat(prompt.getValue())
                .doesNotContain(
                        "{analysis}", "{acceptanceCriteria}", "{architecture}", "{apiSpec}");
    }

    @Test
    void sentinelReceivesIndependentRequirementProposalAndEnterpriseEvidence() {
        var ctx = context();
        ctx.setCodeChangeSet(
                new CodeChangeSet(
                        List.of(
                                new FileChange(
                                        "Example.java",
                                        FileChange.ChangeType.CREATE,
                                        "class Example { void missingFromDiff() {} }")),
                        "+class Example {}",
                        "local adapter proposal",
                        List.of("Retries stop after exhaustion"),
                        List.of("API signature must be confirmed"),
                        true));
        var decision =
                new ReviewDecision(ReviewOutcome.REQUEST_CHANGES, "Incomplete proposal", List.of());
        when(ai.generateForRun(eq(AgentKind.REVIEW), any(), anyString(), eq(ReviewDecision.class)))
                .thenReturn(decision);
        var agent =
                new ReviewAgent(
                        ai,
                        prompts,
                        new ApiSpecificationTool(),
                        new ComplianceTool(),
                        new ArchitectureTool(),
                        new ObjectMapper(),
                        events,
                        audit,
                        pacer);

        assertThat(agent.review(ctx)).isSameAs(decision);

        var prompt = ArgumentCaptor.forClass(String.class);
        verify(ai)
                .generateForRun(
                        eq(AgentKind.REVIEW),
                        eq(ctx),
                        prompt.capture(),
                        eq(ReviewDecision.class));
        assertThat(prompt.getValue())
                .contains(
                        "EXAMPLE-1",
                        "SMS only",
                        "Audit failures",
                        "No PII",
                        "missingFromDiff",
                        "+class Example {}",
                        "Retries stop after exhaustion",
                        "API signature must be confirmed",
                        "local adapter proposal",
                        "testsPass",
                        "ConsentService.hasConsent",
                        "All customer-facing side effects must be idempotent",
                        "operationId: sendNotification",
                        "unsupported, not proven nonexistent",
                        "not a compiler");
        assertThat(prompt.getValue())
                .doesNotContain(
                        "{ticket}",
                        "{analysis}",
                        "{proposal}",
                        "{compliance}",
                        "{architecture}",
                        "{apiSpec}");
    }
}
