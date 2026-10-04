package com.enterprise.copilot.tools;

import org.springframework.stereotype.Component;

/**
 * Returns previous engineering decisions relevant to a topic. Backed by {@code demo-data/git-history.json}.
 */
@Component
public class GitHistoryTool implements CopilotTool {

    @Override
    public String name() {
        return "git-history";
    }

    @Override
    public String lookup(String query) {
        return ToolResources.read("demo-data/git-history.json");
    }
}
