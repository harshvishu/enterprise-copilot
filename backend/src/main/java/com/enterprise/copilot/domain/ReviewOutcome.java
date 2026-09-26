package com.enterprise.copilot.domain;

/**
 * Outcome of the Review Agent (Sentinel).
 */
public enum ReviewOutcome {
    APPROVE,
    REQUEST_CHANGES,
    REJECT
}