package com.enterprise.copilot.api;

import com.enterprise.copilot.agents.code.CodeGenerationAgent;
import com.enterprise.copilot.agents.deploy.DeployAgent;
import com.enterprise.copilot.agents.requirements.RequirementsAgent;
import com.enterprise.copilot.agents.review.ReviewAgent;
import com.enterprise.copilot.api.dto.CreatePipelineRequest;
import com.enterprise.copilot.domain.*;
import com.enterprise.copilot.infrastructure.ai.DemoState;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Runs individual agents in isolation (useful for teaching each step).
 * These use a transient, non-persisted context with the active
 * scenario so each teammate's output can be inspected alone.
 */
@RestController
@RequestMapping("/api/agents")
@RequiredArgsConstructor
public class AgentController {

    private final RequirementsAgent requirementsAgent;
    private final CodeGenerationAgent codeAgent;
    private final ReviewAgent reviewAgent;
    private final DeployAgent deployAgent;
    private final DemoState demoState;

    @PostMapping("/requirements")
    public RequirementAnalysis requirements(@Valid @RequestBody CreatePipelineRequest req) {

        return requirementsAgent.analyze(context(req));
    }

    @PostMapping("/code")
    public CodeChangeSet code(@Valid @RequestBody CreatePipelineRequest req) {

        PipelineContext ctx = context(req);

        ctx.setRequirementAnalysis(requirementsAgent.analyze(ctx));

        return codeAgent.generate(ctx);
    }

    @PostMapping("/review")
    public ReviewDecision review(@Valid @RequestBody CreatePipelineRequest req) {

        PipelineContext ctx = context(req);

        ctx.setRequirementAnalysis(requirementsAgent.analyze(ctx));

        ctx.setCodeChangeSet(codeAgent.generate(ctx));

        return reviewAgent.review(ctx);
    }

    @PostMapping("/deploy")
    public DeploymentDecision deploy(@Valid @RequestBody CreatePipelineRequest req) {

        PipelineContext ctx = context(req);

        ctx.setRequirementAnalysis(requirementsAgent.analyze(ctx));

        ctx.setCodeChangeSet(codeAgent.generate(ctx));

        ctx.setReviewDecision(reviewAgent.review(ctx));

        return deployAgent.evaluate(ctx);
    }

    private PipelineContext context(CreatePipelineRequest req) {

        Ticket ticket =
                new Ticket(req.ticketKey(), req.title(), req.description(), req.sourceOrDefault());

        return new PipelineContext(
                UUID.randomUUID(), ticket, demoState.scenario(), demoState.aiMode());
    }
}
