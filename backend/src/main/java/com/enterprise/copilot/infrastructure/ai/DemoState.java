package com.enterprise.copilot.infrastructure.ai;

import com.enterprise.copilot.domain.AiMode;
import com.enterprise.copilot.domain.DemoScenario;
import com.enterprise.copilot.infrastructure.config.CopilotProperties;
import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicReference;

/**
 * Holds the presenter-controlled runtime state: the active workshop scenario and the AI mode banner.
 * Mutable so the demo controls can switch scenarios live without a restart.
 */
@Service
public class DemoState {

    private final AtomicReference<DemoScenario> scenario;
    private final AiMode aiMode;

    public DemoState(CopilotProperties properties) {
        this.scenario =
                new AtomicReference<>(
                        properties.demo().scenario());
        this.aiMode =
                properties.ai().mode();
    }

    public DemoScenario scenario() {
        return scenario.get();
    }

    public void setScenario(DemoScenario scenario) {
        this.scenario.set(scenario);
    }

    public AiMode aiMode() {
        return aiMode;
    }
}