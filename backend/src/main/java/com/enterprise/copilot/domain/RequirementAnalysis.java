package com.enterprise.copilot.domain;

import java.util.List;

/**
 * Structured output of the Requirements Agent (Rhea).
 *
 * <p>Produced via Spring AI structured output in LIVE mode, or the deterministic provider in DEMO mode.
 * The agent must surface ambiguity instead of silently guessing.
 */
public record RequirementAnalysis(
        String summary,
        List<String> ambiguities,
        List<String> assumptions,
        List<String> acceptanceCriteria,
        List<String> complianceConcerns,
        List<String> technicalRisks,
        List<String> clarificationQuestions
) {
    /**
     * True when the agent needs human clarification before implementation should proceed.
     */
    public boolean needsClarification() {
        return clarificationQuestions != null
                && !clarificationQuestions.isEmpty();
    }
}