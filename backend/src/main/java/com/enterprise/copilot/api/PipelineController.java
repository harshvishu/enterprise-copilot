package com.enterprise.copilot.api;

import com.enterprise.copilot.api.dto.CreatePipelineRequest;
import com.enterprise.copilot.api.dto.PipelineResponse;
import com.enterprise.copilot.domain.PipelineContext;
import com.enterprise.copilot.domain.Ticket;
import com.enterprise.copilot.orchestration.PipelineEventPublisher;
import com.enterprise.copilot.orchestration.PipelineOrchestrator;
import com.enterprise.copilot.persistence.PipelineStore;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.UUID;

/**
 * Pipeline lifecycle API, including the live SSE event stream
 * and the human approval endpoints.
 */
@RestController
@RequestMapping("/api/pipelines")
@RequiredArgsConstructor
public class PipelineController {

    private final PipelineOrchestrator orchestrator;
    private final PipelineStore store;
    private final PipelineEventPublisher events;

    @PostMapping
    @ResponseStatus(HttpStatus.ACCEPTED)
    public PipelineResponse create(@Valid @RequestBody CreatePipelineRequest request) {

        Ticket ticket =
                new Ticket(
                        request.ticketKey(),
                        request.title(),
                        request.description(),
                        request.sourceOrDefault());

        PipelineContext ctx = orchestrator.createAndRun(ticket);

        return PipelineResponse.from(ctx);
    }

    @GetMapping
    public List<PipelineResponse> list() {

        return store.listAll().stream().map(store::toContext).map(PipelineResponse::from).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<PipelineResponse> get(@PathVariable UUID id) {

        return store.load(id)
                .map(PipelineResponse::from)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/events")
    public SseEmitter events(@PathVariable UUID id) {

        return events.subscribe(id);
    }

    @PostMapping("/{id}/approve")
    public PipelineResponse approve(
            @PathVariable UUID id, @RequestParam(defaultValue = "presenter") String approver) {

        return PipelineResponse.from(orchestrator.approve(id, approver));
    }

    @PostMapping("/{id}/clarify")
    public PipelineResponse clarify(
            @PathVariable UUID id, @RequestBody(required = false) ClarifyRequest request) {

        List<String> answers =
                request == null || request.answers() == null ? List.of() : request.answers();
        return PipelineResponse.from(orchestrator.clarify(id, answers));
    }

    @PostMapping("/{id}/reject")
    public PipelineResponse reject(
            @PathVariable UUID id, @RequestParam(defaultValue = "presenter") String approver) {

        return PipelineResponse.from(orchestrator.reject(id, approver));
    }

    public record ClarifyRequest(List<String> answers) {}
}
