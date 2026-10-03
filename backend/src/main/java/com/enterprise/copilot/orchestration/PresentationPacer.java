package com.enterprise.copilot.orchestration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Controls how quickly the workshop shows pipeline progress. Never influences decisions;
 * configure both delays to zero to disable pacing.
 */
@Component
public class PresentationPacer {

    private final long stepDelayMs;
    private final long activityDelayMs;

    public PresentationPacer(
            @Value("${copilot.demo.step-delay-ms:0}") long stepDelayMs,
            @Value("${copilot.demo.activity-delay-ms:0}") long activityDelayMs) {
        this.stepDelayMs = stepDelayMs;
        this.activityDelayMs = activityDelayMs;
    }

    /** Pause after a pipeline state transition. */
    public void afterTransition() {
        pause(stepDelayMs);
    }

    /** Pause after a visible agent activity step. */
    public void afterActivity() {
        pause(activityDelayMs);
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
