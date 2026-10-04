package com.enterprise.copilot.domain;

/**
 * Lifecycle states of an Enterprise Copilot delivery pipeline.
 *
 * <p>The orchestrator persists every transition so the audit trail is complete.
 */
public enum PipelineState {
    CREATED,
    ANALYZING_REQUIREMENTS,
    REQUIREMENTS_READY,
    GENERATING_CODE,
    CODE_READY,
    REVIEWING,
    REVIEW_FAILED,
    REVIEW_PASSED,
    WAITING_FOR_APPROVAL,
    DEPLOYING,
    DEPLOYED,
    BLOCKED,
    FAILED
}
