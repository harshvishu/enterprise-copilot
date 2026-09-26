package com.enterprise.copilot.api.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request to start a pipeline. Source defaults to JIRA when omitted.
 */
public record CreatePipelineRequest(
        @NotBlank String ticketKey,
        @NotBlank String title,
        @NotBlank String description,
        String source
) {
    public String sourceOrDefault() {
        return source == null || source.isBlank()
                ? "JIRA"
                : source;
    }
}
