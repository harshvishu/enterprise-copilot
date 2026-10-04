package com.enterprise.copilot.infrastructure.ai;

import com.enterprise.copilot.domain.CodeChangeSet;
import com.enterprise.copilot.domain.DemoScenario;
import com.enterprise.copilot.domain.RequirementAnalysis;
import com.enterprise.copilot.domain.ReviewDecision;
import com.enterprise.copilot.tools.ConfluenceTool;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Deterministic AI provider used in the explicitly selected DEMO preview/fallback profile.
 *
 * <p>Requires no external service or API key. Returns the canonical UB-4821 outputs from
 * {@link DemoResponses} based on the active scenario, mirroring the shape of real agent outputs.
 */
@Component
@Profile("demo")
public class DemoAgentAiClient implements AgentAiClient {

    private final DemoResponses responses;
    private final ConfluenceTool confluence;

    public DemoAgentAiClient(DemoResponses responses, ConfluenceTool confluence) {
        this.responses = responses;
        this.confluence = confluence;
    }

    @Override
    @SuppressWarnings("unchecked")
    public <T> T generate(
            AgentKind agent, DemoScenario scenario, String renderedPrompt, Class<T> responseType) {

        if (responseType.equals(RequirementAnalysis.class)) {
            String policySection =
                    "\n--- ADDITIONAL TRUSTED BUSINESS CONTEXT ---\n"
                            + confluence.lookup("")
                            + "\n--- END ADDITIONAL TRUSTED BUSINESS CONTEXT ---\n";
            return (T) responses.requirements(scenario, renderedPrompt.endsWith(policySection));
        }

        if (responseType.equals(CodeChangeSet.class)) {
            return (T) responses.code(scenario);
        }

        if (responseType.equals(ReviewDecision.class)) {
            return (T) responses.review(scenario);
        }

        throw new IllegalArgumentException("No deterministic response for type " + responseType);
    }
}
