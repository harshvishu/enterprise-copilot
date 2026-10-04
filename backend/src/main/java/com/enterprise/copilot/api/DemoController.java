package com.enterprise.copilot.api;

import com.enterprise.copilot.api.dto.PipelineResponse;
import com.enterprise.copilot.demo.DemoTickets;
import com.enterprise.copilot.domain.AiMode;
import com.enterprise.copilot.domain.DemoScenario;
import com.enterprise.copilot.domain.PipelineContext;
import com.enterprise.copilot.infrastructure.ai.DemoState;
import com.enterprise.copilot.orchestration.PipelineOrchestrator;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Presenter controls: switch scenario, read the mode banner,
 * and run the one-click workshop demo.
 */
@RestController
@RequestMapping("/api/demo")
@RequiredArgsConstructor
public class DemoController {

    private final DemoState demoState;
    private final DemoTickets demoTickets;
    private final PipelineOrchestrator orchestrator;

    @GetMapping("/status")
    public Map<String, Object> status() {

        return Map.of(
                "aiMode", demoState.aiMode(),
                "provider", demoState.provider(),
                "scenario", demoState.scenario(),
                "scenarios",
                        demoState.aiMode() == AiMode.DEMO
                                ? List.of(DemoScenario.values())
                                : List.of(),
                "live", demoState.aiMode() == AiMode.LIVE);
    }

    @PostMapping("/scenario")
    public Map<String, Object> setScenario(@RequestParam DemoScenario scenario) {

        demoState.setScenario(scenario);

        return Map.of("scenario", demoState.scenario());
    }

    @GetMapping("/issues")
    public List<Map<String, Object>> issues() {

        return demoTickets.issues().stream()
                .map(
                        issue ->
                                Map.<String, Object>of(
                                        "key", issue.ticket().key(),
                                        "title", issue.ticket().title(),
                                        "description", issue.ticket().description(),
                                        "labels", issue.labels()))
                .toList();
    }

    /**
     * Run a backlog issue, or without issueKey the UB-4821 ticket for the active scenario.
     * LIVE providers always receive the real ticket; only DEMO uses the issue's scenario.
     */
    @PostMapping("/run")
    public PipelineResponse run(@RequestParam(required = false) String issueKey) {

        if (issueKey == null || issueKey.isBlank()) {
            return PipelineResponse.from(
                    orchestrator.createAndRun(demoTickets.ubuntuBankTicket(demoState.scenario())));
        }

        DemoTickets.DemoIssue issue =
                demoTickets
                        .find(issueKey)
                        .orElseThrow(
                                () ->
                                        new IllegalArgumentException(
                                                "Unknown demo issue: " + issueKey));

        DemoScenario scenario =
                demoState.aiMode() == AiMode.DEMO ? issue.scenario() : DemoScenario.NORMAL;

        PipelineContext ctx = orchestrator.createAndRun(issue.ticket(), scenario);

        return PipelineResponse.from(ctx);
    }
}
