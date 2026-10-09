package com.enterprise.copilot.infrastructure.ai;

import com.enterprise.copilot.domain.AiMode;
import com.enterprise.copilot.domain.DemoScenario;
import com.enterprise.copilot.domain.PipelineContext;
import com.enterprise.copilot.domain.audit.AuditService;
import com.enterprise.copilot.orchestration.PipelineEvent;
import com.enterprise.copilot.orchestration.PipelineEventPublisher;
import com.enterprise.copilot.orchestration.PipelineEventType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Routes each call by the run's saved mode. LIVE calls are retried; when {@code copilot.ai.fallback}
 * is {@code demo}, an exhausted LIVE call switches the rest of that run to deterministic output
 * and says so in the event stream and audit trail.
 */
@Component
@Primary
public class RoutingAgentAiClient implements AgentAiClient {
    private static final Logger log = LoggerFactory.getLogger(RoutingAgentAiClient.class);

    private final DemoAgentAiClient demo;
    private final ObjectProvider<SpringAiAgentAiClient> live;
    private final DemoState state;
    private final PipelineEventPublisher events;
    private final AuditService audit;
    private final boolean fallbackToDemo;
    private final int retryAttempts;
    private final long retryBackoffMs;
    private final Set<UUID> degradedRuns = ConcurrentHashMap.newKeySet();

    public RoutingAgentAiClient(
            DemoAgentAiClient demo,
            ObjectProvider<SpringAiAgentAiClient> live,
            DemoState state,
            PipelineEventPublisher events,
            AuditService audit,
            @Value("${copilot.ai.fallback:none}") String fallback,
            @Value("${copilot.ai.retry-attempts:2}") int retryAttempts,
            @Value("${copilot.ai.retry-backoff-ms:1000}") long retryBackoffMs) {
        this.demo = demo;
        this.live = live;
        this.state = state;
        this.events = events;
        this.audit = audit;
        this.fallbackToDemo = "demo".equalsIgnoreCase(fallback.trim());
        this.retryAttempts = Math.max(0, retryAttempts);
        this.retryBackoffMs = Math.max(0, retryBackoffMs);
    }

    @Override
    public <T> T generate(
            AgentKind agent, DemoScenario scenario, String prompt, Class<T> responseType) {
        return client(state.aiMode()).generate(agent, scenario, prompt, responseType);
    }

    @Override
    public <T> T generateForRun(
            AgentKind agent, PipelineContext context, String prompt, Class<T> responseType) {
        if (context.aiMode() == AiMode.DEMO || degradedRuns.contains(context.pipelineId())) {
            if (context.executesRepository())
                throw new IllegalStateException("Repository execution cannot use scripted DEMO output.");
            return demo.generateForRun(agent, context, prompt, responseType);
        }

        RuntimeException failure;
        int attempts = 0;
        try {
            SpringAiAgentAiClient provider = liveProvider();
            while (true) {
                attempts++;
                try {
                    return provider.generateForRun(agent, context, prompt, responseType);
                } catch (RuntimeException ex) {
                    // Configuration errors carry no cause; retrying cannot fix them.
                    if (ex.getCause() == null || attempts > retryAttempts) {
                        throw ex;
                    }
                    log.warn("LIVE {} attempt {} failed, retrying: {}", agent, attempts, ex.getMessage());
                    pause(retryBackoffMs * attempts);
                }
            }
        } catch (RuntimeException ex) {
            failure = ex;
        }

        if (!fallbackToDemo || context.executesRepository()) {
            throw failure;
        }
        degradedRuns.add(context.pipelineId());
        log.warn("LIVE {} failed after {} attempt(s); using DEMO output for this run.", agent, attempts, failure);
        events.publish(PipelineEvent.of(
                context.pipelineId(),
                PipelineEventType.AI_FALLBACK,
                "System",
                "LIVE provider failed for " + agent + ". Using deterministic DEMO output for the rest of this run.",
                Map.of("agentKind", agent.name(), "attempts", attempts)));
        audit.record(
                context.pipelineId(),
                "System",
                "AI_FALLBACK",
                "DEMO",
                "DEGRADED",
                "LIVE " + agent + " failed after " + attempts + " attempt(s): " + failure.getMessage());
        return demo.generateForRun(agent, context, prompt, responseType);
    }

    private AgentAiClient client(AiMode mode) {
        return mode == AiMode.DEMO ? demo : liveProvider();
    }

    private SpringAiAgentAiClient liveProvider() {
        SpringAiAgentAiClient provider = live.getIfAvailable();
        if (provider == null) {
            throw new IllegalStateException("LIVE provider is unavailable. No DEMO fallback was used.");
        }
        return provider;
    }

    private static void pause(long millis) {
        if (millis <= 0) {
            return;
        }
        try {
            Thread.sleep(millis);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
        }
    }
}
