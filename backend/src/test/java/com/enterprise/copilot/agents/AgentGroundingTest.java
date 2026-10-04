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
        when(ai.generate(eq(AgentKind.CODE), any(), anyString(), eq(CodeChangeSet.class)))
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
                .generate(
                        eq(AgentKind.CODE),
                        eq(DemoScenario.NORMAL),
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
        when(ai.generate(eq(AgentKind.REVIEW), any(), anyString(), eq(ReviewDecision.class)))
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
                .generate(
                        eq(AgentKind.REVIEW),
                        eq(DemoScenario.NORMAL),
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
