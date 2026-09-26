package com.enterprise.copilot.infrastructure.ai;

import com.enterprise.copilot.domain.CodeChangeSet;
import com.enterprise.copilot.domain.DemoScenario;
import com.enterprise.copilot.domain.RequirementAnalysis;
import com.enterprise.copilot.domain.ReviewDecision;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Deterministic AI provider used in DEMO mode (the default and workshop-safe path).
 *
 * <p>Requires no external service or API key. Returns the canonical UB-4821 outputs from
 * {@link DemoResponses} based on the active scenario, mirroring the shape of real agent outputs.
 */
@Component
@Profile("!azure & !ollama")
public class DemoAgentAiClient implements AgentAiClient {

    private final DemoResponses responses;

    public DemoAgentAiClient(DemoResponses responses) {
        this.responses = responses;
    }

    @Override
    @SuppressWarnings("unchecked")
    public <T> T generate(
            AgentKind agent,
            DemoScenario scenario,
            String renderedPrompt,
            Class<T> responseType) {

        if (responseType.equals(RequirementAnalysis.class)) {
            return (T) responses.requirements(scenario);
        }

        if (responseType.equals(CodeChangeSet.class)) {
            return (T) responses.code(scenario);
        }

        if (responseType.equals(ReviewDecision.class)) {
            return (T) responses.review(scenario);
        }

        throw new IllegalArgumentException(
                "No deterministic response for type " + responseType);
    }
}