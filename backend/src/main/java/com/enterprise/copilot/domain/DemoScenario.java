package com.enterprise.copilot.domain;

/**
 * Deterministic workshop scenarios. Selecting a scenario
 * guarantees a specific, reproducible pipeline outcome
 * regardless of AI model randomness.
 */
public enum DemoScenario {

    /**
     * Clean run: requirements clarified, code approved, deploy waits only for human approval.
     */
    NORMAL,

    /**
     * Generated code logs sensitive customer data – Sentinel rejects.
     */
    SECURITY_FAILURE,

    /**
     * Ticket lacks consent/channel detail – Rhea raises clarification questions.
     */
    AMBIGUOUS_REQUIREMENT,

    /**
     * Generated tests fail – Atlas blocks deployment.
     */
    TEST_FAILURE,

    /**
     * Review passes but no human approval – Atlas blocks deployment.
     */
    MISSING_APPROVAL,

    /**
     * Code calls a non-existent API – Sentinel detects inconsistency vs the API spec.
     */
    HALLUCINATED_API,

    /**
     * Ticket contains an injected instruction to bypass policy – agents refuse.
     */
    PROMPT_INJECTION
}