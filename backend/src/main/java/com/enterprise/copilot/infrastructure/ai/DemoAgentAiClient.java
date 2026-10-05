package com.enterprise.copilot.infrastructure.ai;

import com.enterprise.copilot.domain.CodeChangeSet;
import com.enterprise.copilot.domain.DemoScenario;
import com.enterprise.copilot.domain.RequirementAnalysis;
import com.enterprise.copilot.domain.ReviewDecision;
import com.enterprise.copilot.domain.PipelineContext;
import org.springframework.stereotype.Component;

/**
 * Deterministic AI provider used in the explicitly selected DEMO preview/fallback profile.
 *
 * <p>Requires no external service or API key. Returns the canonical UB-4821 outputs from
 * {@link DemoResponses} based on the active scenario, mirroring the shape of real agent outputs.
 */
@Component
public class DemoAgentAiClient implements AgentAiClient {

    private static final String ADDITIONAL_CONTEXT_START =
            "--- ADDITIONAL TRUSTED BUSINESS CONTEXT ---";
    private static final String ADDITIONAL_CONTEXT_END =
            "--- END ADDITIONAL TRUSTED BUSINESS CONTEXT ---";
    private static final String APPROVED_RETAIL_POLICY_ID = "Source ID: retail-high-value-alerts";

    private final DemoResponses responses;

    public DemoAgentAiClient(DemoResponses responses) {
        this.responses = responses;
    }

    @Override
    @SuppressWarnings("unchecked")
    public <T> T generate(
            AgentKind agent, DemoScenario scenario, String renderedPrompt, Class<T> responseType) {

        if (responseType.equals(RequirementAnalysis.class)) {
            return (T) responses.requirements(scenario, hasApprovedRetailPolicy(renderedPrompt));
        }

        if (responseType.equals(CodeChangeSet.class)) {
            return (T) responses.code(scenario);
        }

        if (responseType.equals(ReviewDecision.class)) {
            return (T) responses.review(scenario);
        }

        throw new IllegalArgumentException("No deterministic response for type " + responseType);
    }

    private static boolean hasApprovedRetailPolicy(String renderedPrompt) {
        int sectionStart = renderedPrompt.lastIndexOf(ADDITIONAL_CONTEXT_START);
        if (sectionStart < 0) {
            return false;
        }

        int contextStart = sectionStart + ADDITIONAL_CONTEXT_START.length();
        int sectionEnd = renderedPrompt.indexOf(ADDITIONAL_CONTEXT_END, contextStart);
        return sectionEnd >= 0
                && renderedPrompt.substring(contextStart, sectionEnd)
                        .contains(APPROVED_RETAIL_POLICY_ID);
    }

    @Override
    @SuppressWarnings("unchecked")
    public <T> T generateForRun(
            AgentKind agent, PipelineContext context, String prompt, Class<T> responseType) {
        boolean revised = context.reviewFeedback() != null && !context.reviewFeedback().isBlank();
        if (responseType.equals(CodeChangeSet.class)) {
            return (T) responses.code(context.scenario(), revised);
        }
        if (responseType.equals(ReviewDecision.class)) {
            return (T) responses.review(context.scenario(), revised);
        }
        return generate(agent, context.scenario(), prompt, responseType);
    }
}
