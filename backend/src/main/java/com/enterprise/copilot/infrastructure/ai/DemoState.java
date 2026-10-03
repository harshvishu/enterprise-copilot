package com.enterprise.copilot.infrastructure.ai;

import com.enterprise.copilot.domain.AiMode;
import com.enterprise.copilot.domain.DemoScenario;
import com.enterprise.copilot.infrastructure.config.CopilotProperties;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicReference;

/**
 * Holds the selected provider and presenter-controlled deterministic scenario.
 * Scenarios can change at runtime only in DEMO; provider changes require restart.
 */
@Service
public class DemoState {

    private final AtomicReference<DemoScenario> scenario;
    private final AiMode aiMode;
    private final String provider;

    public DemoState(CopilotProperties properties, Environment environment) {
        this.scenario =
                new AtomicReference<>(
                        properties.demo().scenario());
        this.provider = environment.matchesProfiles("openai")
            ? "OPENAI"
            : environment.matchesProfiles("ollama") ? "OLLAMA" : "DEMO";
        this.aiMode = provider.equals("DEMO") ? AiMode.DEMO : AiMode.LIVE;
    }

    public DemoScenario scenario() {
        return aiMode == AiMode.DEMO ? scenario.get() : DemoScenario.NORMAL;
    }

    public void setScenario(DemoScenario scenario) {
        if (aiMode != AiMode.DEMO) {
            throw new IllegalStateException("Deterministic scenarios require the demo profile.");
        }
        this.scenario.set(scenario);
    }

    public AiMode aiMode() {
        return aiMode;
    }

    public String provider() {
        return provider;
    }
}