package com.enterprise.copilot.agents.requirements;

import com.enterprise.copilot.domain.PipelineContext;
import com.enterprise.copilot.domain.RequirementAnalysis;
import com.enterprise.copilot.domain.Ticket;
import com.enterprise.copilot.domain.audit.AuditService;
import com.enterprise.copilot.infrastructure.ai.AgentAiClient;
import com.enterprise.copilot.infrastructure.ai.AgentKind;
import com.enterprise.copilot.infrastructure.ai.PromptLibrary;
import com.enterprise.copilot.orchestration.PipelineEvent;
import com.enterprise.copilot.orchestration.PipelineEventPublisher;
import com.enterprise.copilot.orchestration.PipelineEventType;
import com.enterprise.copilot.tools.ApiSpecificationTool;
import com.enterprise.copilot.tools.ArchitectureTool;
import com.enterprise.copilot.tools.ComplianceTool;
import com.enterprise.copilot.tools.GitHistoryTool;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Rhea – the Requirements Analyst. Consults the local tools, then produces a structured
 * {@link RequirementAnalysis}. Surfaces ambiguity rather than guessing.
 */
@Component
@RequiredArgsConstructor
public class RequirementsAgent {

    public static final String NAME = "Rhea";

    private final AgentAiClient ai;
    private final PromptLibrary prompts;
    private final ComplianceTool compliance;
    private final ArchitectureTool architecture;
    private final GitHistoryTool gitHistory;
    private final ApiSpecificationTool apiSpec;
    private final PipelineEventPublisher events;
    private final AuditService audit;

    public RequirementAnalysis analyze(PipelineContext ctx) {

        Ticket ticket = ctx.ticket();

        events.publish(
                PipelineEvent.of(
                        ctx.pipelineId(),
                        PipelineEventType.AGENT_STARTED,
                        NAME,
                        "Analyzing " + ticket.key() + "..."
                ));

        String complianceGuidance =
                invokeTool(
                        ctx,
                        compliance.name(),
                        () -> compliance.lookup(ticket.description()));

        String architectureGuidance =
                invokeTool(
                        ctx,
                        architecture.name(),
                        () -> architecture.lookup(ticket.description()));

        String history =
                invokeTool(
                        ctx,
                        gitHistory.name(),
                        () -> gitHistory.lookup(ticket.description()));

        String spec =
                invokeTool(
                        ctx,
                        apiSpec.name(),
                        () -> apiSpec.lookup(ticket.description()));

        events.publish(
                PipelineEvent.of(
                        ctx.pipelineId(),
                        PipelineEventType.AGENT_THINKING,
                        NAME,
                        "Cross-checking the requirement against compliance, architecture and prior decisions."
                ));

        String prompt = prompts.render(
                "requirements",
                Map.of(
                        "ticketKey", ticket.key(),
                        "title", ticket.title(),
                        "description", ticket.description(),
                        "compliance", complianceGuidance,
                        "architecture", architectureGuidance,
                        "gitHistory", history,
                        "apiSpec", spec
                ));

        RequirementAnalysis analysis =
                ai.generate(
                        AgentKind.REQUIREMENTS,
                        ctx.scenario(),
                        prompt,
                        RequirementAnalysis.class);

        String decision =
                analysis.needsClarification()
                        ? "NEEDS_CLARIFICATION"
                        : "READY";

        events.publish(
                PipelineEvent.of(
                        ctx.pipelineId(),
                        PipelineEventType.AGENT_COMPLETED,
                        NAME,
                        analysis.needsClarification()
                                ? "Found "
                                  + analysis.clarificationQuestions().size()
                                  + " clarification question(s)."
                                : "Requirement is clear and ready.",
                        Map.of(
                                "decision",
                                decision
                        )
                ));

        audit.record(
                ctx.pipelineId(),
                NAME,
                "ANALYZE_REQUIREMENTS",
                decision,
                "OK",
                analysis.summary()
        );

        return analysis;
    }

    private String invokeTool(
            PipelineContext ctx,
            String toolName,
            java.util.function.Supplier<String> call) {

        events.publish(
                PipelineEvent.of(
                        ctx.pipelineId(),
                        PipelineEventType.TOOL_INVOKED,
                        NAME,
                        "Consulting tool: " + toolName,
                        Map.of("tool", toolName)
                ));

        return call.get();
    }
}