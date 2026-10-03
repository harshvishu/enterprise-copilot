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
                "scenarios", demoState.aiMode() == AiMode.DEMO
                    ? List.of(DemoScenario.values()) : List.of(),
                "live", demoState.aiMode() == AiMode.LIVE
        );
    }

    @PostMapping("/scenario")
    public Map<String, Object> setScenario(
            @RequestParam DemoScenario scenario) {

        demoState.setScenario(scenario);

        return Map.of(
                "scenario",
                demoState.scenario()
        );
    }

    /**
     * One-click workshop demo: seed the Ubuntu Bank ticket
     * for the active scenario and run it.
     */
    @PostMapping("/run")
    public PipelineResponse run() {

        PipelineContext ctx =
                orchestrator.createAndRun(
                        demoTickets.ubuntuBankTicket(
                                demoState.scenario()));

        return PipelineResponse.from(ctx);
    }
}