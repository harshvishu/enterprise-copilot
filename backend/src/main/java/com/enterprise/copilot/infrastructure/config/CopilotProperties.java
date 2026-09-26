package com.enterprise.copilot.infrastructure.config;

import com.enterprise.copilot.domain.AiMode;
import com.enterprise.copilot.domain.DemoScenario;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Bound from the {@code copilot.*} section of application.yml. The demo scenario and AI mode are
 * mutable at runtime via the presenter controls, so this holds the startup defaults only.
 */
@ConfigurationProperties(prefix = "copilot")
public record CopilotProperties(
        Ai ai,
        Demo demo,
        GitHub github
) {

    public CopilotProperties {

        if (ai == null) {
            ai = new Ai(AiMode.DEMO);
        }

        if (demo == null) {
            demo = new Demo(DemoScenario.NORMAL);
        }

        if (github == null) {
            github = new GitHub("MOCK");
        }
    }

    public record Ai(AiMode mode) {
    }

    public record Demo(DemoScenario scenario) {
    }

    public record GitHub(String mode) {
    }
}