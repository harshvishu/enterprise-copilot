package com.enterprise.copilot.infrastructure.ai;

import com.enterprise.copilot.domain.AiMode;
import com.enterprise.copilot.domain.DemoScenario;
import com.enterprise.copilot.infrastructure.config.CopilotProperties;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicReference;

/**
 * Holds presenter selections for the next run. Each pipeline captures an immutable selection.
 */
@Service
public class DemoState {

    public record Selection(AiMode mode, DemoScenario scenario) {}

    private final AtomicReference<Selection> selection;
    private final String provider;

    public DemoState(CopilotProperties properties, Environment environment) {
        this.provider =
                environment.matchesProfiles("openai")
                        ? "OPENAI"
                        : environment.matchesProfiles("ollama") ? "OLLAMA" : "DEMO";
        this.selection = new AtomicReference<>(
            new Selection(provider.equals("DEMO") ? AiMode.DEMO : AiMode.LIVE,
                properties.demo().scenario()));
    }

    public DemoScenario scenario() {
        Selection current = snapshot();
        return current.mode() == AiMode.DEMO ? current.scenario() : DemoScenario.NORMAL;
    }

    public void setScenario(DemoScenario scenario) {
        selection.updateAndGet(current -> {
            if (current.mode() != AiMode.DEMO) {
                throw new IllegalStateException("Scenario selection requires DEMO mode.");
            }
            return new Selection(current.mode(), scenario);
        });
    }

    public AiMode aiMode() {
        return snapshot().mode();
    }

    public String provider() {
        return aiMode() == AiMode.DEMO ? "DEMO" : provider;
    }

    public Selection snapshot() {
        return selection.get();
    }

    public boolean liveAvailable() {
        return !provider.equals("DEMO");
    }

    public String liveProvider() {
        return provider;
    }

    public void setMode(AiMode mode) {
        if (mode == null || (mode == AiMode.LIVE && !liveAvailable())) {
            throw new IllegalArgumentException("LIVE requires a configured OpenAI or Ollama provider.");
        }
        selection.updateAndGet(current -> new Selection(mode, current.scenario()));
    }
}
