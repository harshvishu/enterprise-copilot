package com.enterprise.copilot.domain;

import java.util.List;

/**
 * Structured output of the Deploy Agent (Atlas).
 *
 * <p>AI can recommend but never bypass a blocking gate.
 * {@code allowed} is only true when every gate passes AND
 * (when required) a human approval exists.
 *
 * @param allowed          whether deployment may proceed
 * @param requiresApproval whether human approval is a precondition
 * @param blockingReasons  why deployment is blocked (empty when allowed)
 * @param summary          human-readable explanation
 */
public record DeploymentDecision(
        boolean allowed, boolean requiresApproval, List<String> blockingReasons, String summary) {}
