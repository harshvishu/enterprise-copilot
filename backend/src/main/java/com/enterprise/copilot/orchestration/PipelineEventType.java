package com.enterprise.copilot.orchestration;

/**
 * Event types streamed to the dashboard over SSE and (for the important ones) persisted to audit.
 */
public enum PipelineEventType {
    PIPELINE_STARTED,
    AGENT_STARTED,
    AGENT_THINKING,
    TOOL_INVOKED,
    AGENT_COMPLETED,
    FINDING_CREATED,
    GATE_BLOCKED,
    APPROVAL_REQUIRED,
    APPROVAL_GRANTED,
    APPROVAL_REJECTED,
    DEPLOYMENT_STARTED,
    DEPLOYMENT_COMPLETED,
    PIPELINE_COMPLETED,
    PIPELINE_FAILED
}