package com.enterprise.copilot.infrastructure.ai;

import com.enterprise.copilot.domain.AiMode;
import com.enterprise.copilot.domain.DemoScenario;
import com.enterprise.copilot.domain.PipelineContext;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

@Component
@Primary
public class RoutingAgentAiClient implements AgentAiClient {
    private final DemoAgentAiClient demo;
    private final ObjectProvider<SpringAiAgentAiClient> live;
    private final DemoState state;

    public RoutingAgentAiClient(
            DemoAgentAiClient demo, ObjectProvider<SpringAiAgentAiClient> live, DemoState state) {
        this.demo = demo;
        this.live = live;
        this.state = state;
    }

    @Override
    public <T> T generate(
            AgentKind agent, DemoScenario scenario, String prompt, Class<T> responseType) {
        return client(state.aiMode()).generate(agent, scenario, prompt, responseType);
    }

    @Override
    public <T> T generateForRun(
            AgentKind agent, PipelineContext context, String prompt, Class<T> responseType) {
        return client(context.aiMode()).generateForRun(agent, context, prompt, responseType);
    }

    private AgentAiClient client(AiMode mode) {
        if (mode == AiMode.DEMO) {
            return demo;
        }
        SpringAiAgentAiClient provider = live.getIfAvailable();
        if (provider == null) {
            throw new IllegalStateException("LIVE provider is unavailable. No DEMO fallback was used.");
        }
        return provider;
    }
}