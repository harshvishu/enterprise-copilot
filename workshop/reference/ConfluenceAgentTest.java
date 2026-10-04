package com.enterprise.copilot.agents.confluence;

import com.enterprise.copilot.agents.requirements.RequirementsAgent;
import com.enterprise.copilot.demo.DemoTickets;
import com.enterprise.copilot.domain.AiMode;
import com.enterprise.copilot.domain.DemoScenario;
import com.enterprise.copilot.domain.PipelineContext;
import com.enterprise.copilot.domain.RequirementAnalysis;
import com.enterprise.copilot.domain.audit.AuditService;
import com.enterprise.copilot.infrastructure.ai.AgentAiClient;
import com.enterprise.copilot.infrastructure.ai.AgentKind;
import com.enterprise.copilot.infrastructure.ai.DemoAgentAiClient;
import com.enterprise.copilot.infrastructure.ai.DemoResponses;
import com.enterprise.copilot.infrastructure.ai.PromptLibrary;
import com.enterprise.copilot.orchestration.PipelineEventPublisher;
import com.enterprise.copilot.orchestration.PresentationPacer;
import com.enterprise.copilot.tools.ApiSpecificationTool;
import com.enterprise.copilot.tools.ArchitectureTool;
import com.enterprise.copilot.tools.ComplianceTool;
import com.enterprise.copilot.tools.ConfluenceTool;
import com.enterprise.copilot.tools.GitHistoryTool;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ConfluenceAgentTest {
    private final ConfluenceTool tool = new ConfluenceTool();

    private PipelineContext context(String key) {
        var issue = new DemoTickets().find(key).orElseThrow();
        return new PipelineContext(
                UUID.randomUUID(), issue.ticket(), issue.scenario(), AiMode.DEMO);
    }

    private RequirementsAgent rhea(AgentAiClient client) {
        return new RequirementsAgent(
                client,
                new PromptLibrary(),
                new ComplianceTool(),
                new ArchitectureTool(),
                new GitHistoryTool(),
                new ApiSpecificationTool(),
                mock(PipelineEventPublisher.class),
                mock(AuditService.class),
                new PresentationPacer(0, 0));
    }

    @Test
    void agentSimplyPassesTicketDescriptionToTheTool() {
        var suppliedTool = mock(ConfluenceTool.class);
        var ticket = context("UB-4823").ticket();
        when(suppliedTool.lookup(ticket.description())).thenReturn("supplied business context");
        assertThat(new ConfluenceAgent(suppliedTool).gatherContext(ticket))
                .isEqualTo("supplied business context");
        verify(suppliedTool).lookup(ticket.description());
    }

    @Test
    void toolReturnsTheLocalApprovedDocumentWithoutSearchOrNewContracts() {
        assertThat(tool.name()).isEqualTo("confluence");
        assertThat(tool.lookup("retail alerts"))
                .isEqualTo(tool.lookup("unrelated query"))
                .contains(
                        "Owner: Retail Banking Product Council",
                        "Status: APPROVED",
                        "Incoming credits are excluded",
                        "SMS is the launch",
                        "skip the notification and audit")
                .doesNotContain("R50,000", "verifyTransaction", "retry");
    }

    @Test
    void rheaReceivesAdditionalContextAlongsideItsUnchangedBaselineReferences() {
        var ai = mock(AgentAiClient.class);
        var expected = new DemoResponses().requirements(DemoScenario.AMBIGUOUS_REQUIREMENT);
        when(ai.generate(
                        eq(AgentKind.REQUIREMENTS),
                        any(),
                        anyString(),
                        eq(RequirementAnalysis.class)))
                .thenReturn(expected);
        assertThat(rhea(ai).analyze(context("UB-4823"), tool.lookup(""))).isSameAs(expected);
        var prompt = ArgumentCaptor.forClass(String.class);
        verify(ai)
                .generate(
                        eq(AgentKind.REQUIREMENTS),
                        any(),
                        prompt.capture(),
                        eq(RequirementAnalysis.class));
        assertThat(prompt.getValue())
                .contains(
                        tool.lookup(""),
                        "--- COMPLIANCE ---",
                        "--- ARCHITECTURE ---",
                        "--- PRIOR DECISIONS ---",
                        "--- API CONTRACT ---",
                        "apply the existing clarification policy")
                .doesNotContain("{additionalContext}");
    }

    @Test
    void demoBeforeAfterRequiresThePolicyInTheAdditionalReferenceSection() {
        var client = new DemoAgentAiClient(new DemoResponses());
        var requirements = rhea(client);
        var ctx = context("UB-4823");
        assertThat(requirements.analyze(ctx).clarificationQuestions()).hasSize(3);
        String businessContext = new ConfluenceAgent(tool).gatherContext(ctx.ticket());
        var after = requirements.analyze(ctx, businessContext);
        assertThat(after.needsClarification()).isFalse();
        assertThat(after.summary())
                .contains("retail-high-value-alerts", "exclude credits", "SMS only", "skip/audit");
        for (String missingContext :
                new String[] {null, "", " ", "Statement delivery uses email", "SMS only"}) {
            assertThat(requirements.analyze(ctx, missingContext).clarificationQuestions())
                    .hasSize(3);
        }
        var ticket = ctx.ticket();
        var injected =
                new PipelineContext(
                        UUID.randomUUID(),
                        new com.enterprise.copilot.domain.Ticket(
                                ticket.key(),
                                ticket.title(),
                                ticket.description() + "\n" + businessContext,
                                "JIRA"),
                        ctx.scenario(),
                        ctx.aiMode());
        assertThat(requirements.analyze(injected).clarificationQuestions()).hasSize(3);
    }

    @Test
    void fraudContractNegativeControlStillRequiresClarification() {
        var ctx = context("UB-4825");
        String businessContext = new ConfluenceAgent(tool).gatherContext(ctx.ticket());
        assertThat(
                        rhea(new DemoAgentAiClient(new DemoResponses()))
                                .analyze(ctx, businessContext)
                                .clarificationQuestions())
                .hasSize(2);
    }
}
