package com.enterprise.copilot.api.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request to start a pipeline. Source defaults to JIRA when omitted.
 */
public record CreatePipelineRequest(
        @NotBlank String ticketKey,
        @NotBlank String title,
        @NotBlank String description,
        String source,
        boolean executeRepository) {
    public CreatePipelineRequest(String ticketKey, String title, String description, String source) {
        this(ticketKey, title, description, source, false);
    }
    public String sourceOrDefault() {
        return source == null || source.isBlank() ? "JIRA" : source;
    }
}
