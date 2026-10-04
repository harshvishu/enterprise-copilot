package com.enterprise.copilot.tools;

import org.springframework.stereotype.Component;

/**
 * Returns relevant compliance/POPIA guidance for a requirement. Deterministic and local – the live
 * workshop never depends on an external call. Backed by {@code demo-data/compliance-policy.md}.
 */
@Component
public class ComplianceTool implements CopilotTool {

    @Override
    public String name() {
        return "compliance";
    }

    @Override
    public String lookup(String query) {
        return ToolResources.read("demo-data/compliance-policy.md");
    }
}
