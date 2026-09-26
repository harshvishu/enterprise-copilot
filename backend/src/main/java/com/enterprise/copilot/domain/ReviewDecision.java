package com.enterprise.copilot.domain;

import java.util.List;

/**
 * Structured output of the Review Agent (Sentinel).
 *
 * @param outcome  APPROVE / REQUEST_CHANGES / REJECT
 * @param summary  reviewer summary
 * @param findings individual findings with severity
 */
public record ReviewDecision(
        ReviewOutcome outcome,
        String summary,
        List<ReviewFinding> findings
) {
    /**
     * Any finding at CRITICAL severity blocks deployment outright.
     */
    public boolean hasCriticalFindings() {
        return findings != null
                && findings.stream()
                .anyMatch(f -> f.severity() == Severity.CRITICAL);
    }

    public boolean passed() {
        return outcome == ReviewOutcome.APPROVE;
    }
}