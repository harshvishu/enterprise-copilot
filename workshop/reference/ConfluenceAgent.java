package com.enterprise.copilot.agents.confluence;

import com.enterprise.copilot.domain.Ticket;
import com.enterprise.copilot.tools.ConfluenceTool;
import org.springframework.stereotype.Component;

@Component
public class ConfluenceAgent {
    private final ConfluenceTool confluenceTool;

    public ConfluenceAgent(ConfluenceTool confluenceTool) {
        this.confluenceTool = confluenceTool;
    }

    public String gatherContext(Ticket ticket) {
        return confluenceTool.lookup(ticket.description());
    }
}
