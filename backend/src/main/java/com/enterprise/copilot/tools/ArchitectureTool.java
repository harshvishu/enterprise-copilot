package com.enterprise.copilot.tools;

import org.springframework.stereotype.Component;

/**
 * Returns approved Spring Boot patterns for a service. Backed by {@code demo-data/architecture-guidelines.md}.
 */
@Component
public class ArchitectureTool implements CopilotTool {

    @Override
    public String name() {
        return "architecture";
    }

    @Override
    public String lookup(String query) {
        return ToolResources.read("demo-data/architecture-guidelines.md");
    }
}
