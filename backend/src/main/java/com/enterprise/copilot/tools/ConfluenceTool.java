package com.enterprise.copilot.tools;

import org.springframework.stereotype.Component;

@Component
public class ConfluenceTool implements CopilotTool {
    @Override
    public String name() {
        return "confluence";
    }

    @Override
    public String lookup(String query) {
        return ToolResources.read("demo-data/confluence.md");
    }
}
