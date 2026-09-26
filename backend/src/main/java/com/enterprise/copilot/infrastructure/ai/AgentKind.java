package com.enterprise.copilot.infrastructure.ai;

/**
 * Identifies which AI teammate is making a call, so the deterministic provider can respond in character.
 */
public enum AgentKind {
    REQUIREMENTS, // Rhea
    CODE,         // Nova
    REVIEW,       // Sentinel
    DEPLOY        // Atlas
}