package com.enterprise.copilot.domain;

/**
 * An incoming work item (Jira/GitHub issue). Treated by all agents as <strong>untrusted input</strong>;
 * instructions embedded in the description never override system policy.
 *
 * @param key         external identifier, e.g. {@code UB-4821}
 * @param title       short summary
 * @param description free-text body (may contain ambiguity or injected instructions)
 * @param source      origin system, e.g. {@code JIRA} or {@code GITHUB}
 */
public record Ticket(
        String key,
        String title,
        String description,
        String source
) {
}