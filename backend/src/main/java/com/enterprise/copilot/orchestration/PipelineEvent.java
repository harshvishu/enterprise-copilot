package com.enterprise.copilot.orchestration;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * A single live pipeline event. {@code agent} is the teammate name (Rhea/Nova/Sentinel/Atlas) or
 * {@code System}; {@code data} carries small, non-sensitive structured extras for the UI.
 */
public record PipelineEvent(
        UUID pipelineId,
        PipelineEventType type,
        String agent,
        String message,
        Map<String, Object> data,
        Instant timestamp
) {
    public static PipelineEvent of(
            UUID pipelineId,
            PipelineEventType type,
            String agent,
            String message) {
        return new PipelineEvent(
                pipelineId,
                type,
                agent,
                message,
                Map.of(),
                Instant.now());
    }

    public static PipelineEvent of(
            UUID pipelineId,
            PipelineEventType type,
            String agent,
            String message,
            Map<String, Object> data) {

        return new PipelineEvent(
                pipelineId,
                type,
                agent,
                message,
                data,
                Instant.now());
    }
}