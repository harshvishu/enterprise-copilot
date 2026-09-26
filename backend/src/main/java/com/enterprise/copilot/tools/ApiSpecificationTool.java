package com.enterprise.copilot.tools;

import org.springframework.stereotype.Component;

/**
 * Returns the existing API contract, and can confirm whether an operation exists. Used by the Review
 * Agent to detect hallucinated APIs. Backed by {@code demo-data/notification-api.yaml}.
 */
@Component
public class ApiSpecificationTool implements CopilotTool {

    @Override
    public String name() {
        return "api-spec";
    }

    @Override
    public String lookup(String query) {
        return ToolResources.read("demo-data/notification-api.yaml");
    }

    /**
     * True only when the given operationId is defined in the published contract.
     */
    public boolean operationExists(String operationId) {
        return ToolResources.read("demo-data/notification-api.yaml")
                .contains("operationId: " + operationId);
    }
}