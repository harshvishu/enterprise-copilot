package com.enterprise.copilot.agents.code;

import com.enterprise.copilot.domain.CodeChangeSet;
import com.enterprise.copilot.domain.PipelineContext;
import com.enterprise.copilot.domain.audit.AuditService;
import com.enterprise.copilot.infrastructure.ai.AgentAiClient;
import com.enterprise.copilot.infrastructure.ai.AgentKind;
import com.enterprise.copilot.infrastructure.ai.PromptLibrary;
import com.enterprise.copilot.orchestration.PipelineEvent;
import com.enterprise.copilot.orchestration.PipelineEventPublisher;
import com.enterprise.copilot.orchestration.PipelineEventType;
import com.enterprise.copilot.orchestration.PresentationPacer;
import com.enterprise.copilot.tools.ApiSpecificationTool;
import com.enterprise.copilot.tools.ArchitectureTool;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Nova – the Senior Java Engineer. Turns an approved {@link com.enterprise.copilot.domain.RequirementAnalysis}
 * into a {@link CodeChangeSet}. The output is always a proposal rendered as a diff – never applied to disk.
 */
@Component
@RequiredArgsConstructor
public class CodeGenerationAgent {

    public static final String NAME = "Nova";

    private final AgentAiClient ai;
    private final PromptLibrary prompts;
    private final ArchitectureTool architecture;
    private final ApiSpecificationTool apiSpec;
    private final PipelineEventPublisher events;
    private final AuditService audit;
    private final PresentationPacer pacer;

    public CodeChangeSet generate(PipelineContext ctx) {

        events.publish(
                PipelineEvent.of(
                        ctx.pipelineId(),
                        PipelineEventType.AGENT_STARTED,
                        NAME,
                        "Generating an implementation proposal..."));

        events.publish(
                PipelineEvent.of(
                        ctx.pipelineId(),
                        PipelineEventType.AGENT_THINKING,
                        NAME,
                        "Reviewing approved requirement analysis",
                        Map.of("step", "REQUIREMENTS")));

        String analysisSummary =
                ctx.requirementAnalysis() == null ? "" : ctx.requirementAnalysis().summary();

        pacer.afterActivity();

        events.publish(
                PipelineEvent.of(
                        ctx.pipelineId(),
                        PipelineEventType.TOOL_INVOKED,
                        NAME,
                        "Reading architecture guidance",
                        Map.of("tool", architecture.name(), "step", "ARCHITECTURE")));

        String architectureGuidance = architecture.lookup("notification service");

        pacer.afterActivity();

        events.publish(
                PipelineEvent.of(
                        ctx.pipelineId(),
                        PipelineEventType.TOOL_INVOKED,
                        NAME,
                        "Reading published API contract",
                        Map.of("tool", apiSpec.name(), "step", "API_SPEC")));
        String contract = apiSpec.lookup(ctx.ticket().description());
        pacer.afterActivity();

        events.publish(
                PipelineEvent.of(
                        ctx.pipelineId(),
                        PipelineEventType.AGENT_THINKING,
                        NAME,
                        "Requesting implementation proposal",
                        Map.of("step", "MODEL_CALL")));

        pacer.afterActivity();

        String prompt =
                prompts.render(
                        "codegen",
                        Map.of(
                                "analysis", analysisSummary,
                                "acceptanceCriteria",
                                        ctx.requirementAnalysis() == null
                                                ? ""
                                                : String.join(
                                                        "\n",
                                                        ctx.requirementAnalysis()
                                                                .acceptanceCriteria()),
                                "architecture", architectureGuidance,
                                "apiSpec", contract));

        CodeChangeSet changeSet =
                ai.generate(AgentKind.CODE, ctx.scenario(), prompt, CodeChangeSet.class);

        int testsProposed = changeSet.tests() == null ? 0 : changeSet.tests().size();

        events.publish(
                PipelineEvent.of(
                        ctx.pipelineId(),
                        PipelineEventType.AGENT_COMPLETED,
                        NAME,
                        "Proposed "
                                + changeSet.files().size()
                                + " file change(s) and "
                                + testsProposed
                                + " test(s). Awaiting review.",
                        Map.of(
                                "filesChanged",
                                changeSet.files().size(),
                                "testsProposed",
                                testsProposed)));

        audit.record(
                ctx.pipelineId(), NAME, "GENERATE_CODE", "PROPOSAL", "OK", changeSet.explanation());

        return changeSet;
    }
}
