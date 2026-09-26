package com.enterprise.copilot.orchestration;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * In-memory pub/sub for live pipeline events, delivered to the dashboard via Server-Sent Events.
 *
 * <p>Kept intentionally simple (no external broker) for workshop reliability. Late subscribers
 * receive a replay of events already emitted for their pipeline so the UI can catch up.
 */
@Service
public class PipelineEventPublisher {

    private static final Logger log =
            LoggerFactory.getLogger(PipelineEventPublisher.class);

    private final Map<UUID, List<SseEmitter>> emitters =
            new ConcurrentHashMap<>();

    private final Map<UUID, List<PipelineEvent>> history =
            new ConcurrentHashMap<>();

    private final ObjectMapper objectMapper;

    public PipelineEventPublisher(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public SseEmitter subscribe(UUID pipelineId) {
        SseEmitter emitter = new SseEmitter(0L); // no timeout
        emitters.computeIfAbsent(
                        pipelineId,
                        k -> new CopyOnWriteArrayList<>())
                .add(emitter);
        emitter.onCompletion(
                () -> remove(pipelineId, emitter));
        emitter.onTimeout(
                () -> remove(pipelineId, emitter));
        emitter.onError(
                e -> remove(pipelineId, emitter));

        // Replay history so a late subscriber sees the full run.
        history.getOrDefault(
                        pipelineId,
                        List.of())
                .forEach(event -> send(emitter, event));
        return emitter;
    }

    public void publish(PipelineEvent event) {
        history.computeIfAbsent(
                        event.pipelineId(),
                        k -> new CopyOnWriteArrayList<>())
                .add(event);
        emitters.getOrDefault(
                        event.pipelineId(),
                        List.of())
                .forEach(emitter -> send(emitter, event));
    }

    public List<PipelineEvent> historyFor(UUID pipelineId) {
        return List.copyOf(
                history.getOrDefault(
                        pipelineId,
                        List.of()));
    }

    private void send(
            SseEmitter emitter,
            PipelineEvent event) {
        try {
            emitter.send(
                    SseEmitter.event()
                            .name(event.type().name())
                            .data(
                                    objectMapper.writeValueAsString(event),
                                    MediaType.APPLICATION_JSON));

        } catch (IOException | IllegalStateException e) {
            log.debug(
                    "Dropping dead SSE emitter for pipeline {}",
                    event.pipelineId());
        }
    }

    private void remove(
            UUID pipelineId,
            SseEmitter emitter) {
        List<SseEmitter> list = emitters.get(pipelineId);
        if (list != null) {
            list.remove(emitter);
        }
    }

    public void complete(UUID pipelineId) {
        emitters.getOrDefault(
                        pipelineId,
                        List.of())
                .forEach(SseEmitter::complete);
    }
}