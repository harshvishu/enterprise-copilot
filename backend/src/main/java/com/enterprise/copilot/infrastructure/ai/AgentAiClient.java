package com.enterprise.copilot.infrastructure.ai;

import com.enterprise.copilot.domain.DemoScenario;
import com.enterprise.copilot.domain.PipelineContext;

/**
 * Abstraction over the AI model used by agents. Two implementations exist:
 * <ul>
 *     <li>{@code SpringAiAgentAiClient} - Spring AI structured output (default OpenAI / explicit Ollama)</li>
 *     <li>{@code DemoAgentAiClient} - explicit deterministic preview/fallback, no model dependency</li>
 * </ul>
 *
 * <p>Agents pass the run context so execution mode remains fixed throughout the run.
 */
public interface AgentAiClient {

    /**
     * Generate a structured response of the given type.
     *
     * @param agent          which teammate is calling (drives deterministic responses)
     * @param scenario       the active workshop scenario (deterministic mode only)
     * @param renderedPrompt the fully rendered prompt (used by the live provider)
     * @param responseType   the target structured type; the provider maps the model output to it
     */
    <T> T generate(
            AgentKind agent, DemoScenario scenario, String renderedPrompt, Class<T> responseType);

    default <T> T generateForRun(
            AgentKind agent, PipelineContext context, String renderedPrompt, Class<T> responseType) {
        return generate(agent, context.scenario(), renderedPrompt, responseType);
    }
}
