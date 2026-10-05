package com.enterprise.copilot.orchestration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import com.enterprise.copilot.domain.AiMode;
import org.springframework.stereotype.Component;

/**
 * Controls how quickly the workshop shows pipeline progress. Never influences decisions;
 * configure both delays to zero to disable pacing.
 */
@Component
public class PresentationPacer {

    private final long stepDelayMs;
    private final long activityDelayMs;
    private final long demoStepDelayMs;
    private final long demoActivityDelayMs;

    public PresentationPacer(
            long stepDelayMs, long activityDelayMs) {
        this(stepDelayMs, activityDelayMs, stepDelayMs, activityDelayMs);
    }

    @Autowired
    public PresentationPacer(
            @Value("${copilot.demo.step-delay-ms:0}") long stepDelayMs,
            @Value("${copilot.demo.activity-delay-ms:0}") long activityDelayMs,
            @Value("${copilot.demo.workshop-step-delay-ms:400}") long demoStepDelayMs,
            @Value("${copilot.demo.workshop-activity-delay-ms:700}") long demoActivityDelayMs) {
        this.stepDelayMs = stepDelayMs;
        this.activityDelayMs = activityDelayMs;
        boolean disabled = stepDelayMs <= 0 && activityDelayMs <= 0;
        this.demoStepDelayMs = disabled ? 0 : demoStepDelayMs;
        this.demoActivityDelayMs = disabled ? 0 : demoActivityDelayMs;
    }

    /** Pause after a pipeline state transition. */
    public void afterTransition() {
        pause(stepDelayMs);
    }

    /** Pause after a visible agent activity step. */
    public void afterActivity() {
        pause(activityDelayMs);
    }

    public void afterTransition(AiMode mode) {
        pause(mode == AiMode.DEMO ? demoStepDelayMs : stepDelayMs);
    }

    public void afterActivity(AiMode mode) {
        pause(mode == AiMode.DEMO ? demoActivityDelayMs : activityDelayMs);
    }

    private static void pause(long delayMs) {
        if (delayMs <= 0) {
            return;
        }
        try {
            Thread.sleep(delayMs);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
