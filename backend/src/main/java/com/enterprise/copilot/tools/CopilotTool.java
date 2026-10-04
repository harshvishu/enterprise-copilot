package com.enterprise.copilot.tools;

/**
 * A deterministic, local knowledge tool an agent can consult.
 */
public interface CopilotTool {

    /**
     * Short identifier surfaced in the UI as a TOOL_INVOKED event.
     */
    String name();

    /**
     * Return guidance/data relevant to the query. Never performs external network calls.
     */
    String lookup(String query);
}
