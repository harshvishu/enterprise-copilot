package com.enterprise.copilot.infrastructure.ai;

import com.enterprise.copilot.domain.AiMode;
import com.enterprise.copilot.domain.DemoScenario;
import com.enterprise.copilot.domain.PipelineContext;
import com.enterprise.copilot.domain.ReviewDecision;
import com.enterprise.copilot.domain.Ticket;
import com.enterprise.copilot.domain.audit.AuditService;
import com.enterprise.copilot.orchestration.PipelineEvent;
import com.enterprise.copilot.orchestration.PipelineEventPublisher;
import com.enterprise.copilot.orchestration.PipelineEventType;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.ObjectProvider;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RoutingAgentAiClientTest {
    private final SpringAiAgentAiClient live = mock(SpringAiAgentAiClient.class);
    private final PipelineEventPublisher events = mock(PipelineEventPublisher.class);
    private final AuditService audit = mock(AuditService.class);

    private static final IllegalStateException PROVIDER_FAILURE =
            new IllegalStateException("OpenAI LIVE REVIEW failed", new RuntimeException("503"));

    @SuppressWarnings("unchecked")
    private RoutingAgentAiClient router(String fallback, int retries) {
        ObjectProvider<SpringAiAgentAiClient> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(live);
        return new RoutingAgentAiClient(
                new DemoAgentAiClient(new DemoResponses()),
                provider,
                mock(DemoState.class),
                events,
                audit,
                fallback,
                retries,
                0);
    }

    private PipelineContext liveRun() {
        return new PipelineContext(
                UUID.randomUUID(),
                new Ticket("UB-1", "Alerts", "Notify on high value transactions.", "JIRA"),
                DemoScenario.NORMAL,
                AiMode.LIVE);
    }

    @Test
    void transientFailureIsRetriedWithoutFallback() {
        var run = liveRun();
        var review = new DemoResponses().review(DemoScenario.NORMAL);
        when(live.generateForRun(AgentKind.REVIEW, run, "", ReviewDecision.class))
                .thenThrow(PROVIDER_FAILURE)
                .thenReturn(review);

        var result = router("none", 2).generateForRun(AgentKind.REVIEW, run, "", ReviewDecision.class);

        assertThat(result).isSameAs(review);
        verify(events, never()).publish(any());
    }

    @Test
    void exhaustedRetriesFallBackToDemoAndStickForTheRun() {
        var run = liveRun();
        when(live.generateForRun(eq(AgentKind.REVIEW), any(), any(), eq(ReviewDecision.class)))
                .thenThrow(PROVIDER_FAILURE);
        var router = router("demo", 1);

        var first = router.generateForRun(AgentKind.REVIEW, run, "", ReviewDecision.class);
        var second = router.generateForRun(AgentKind.REVIEW, run, "", ReviewDecision.class);

        assertThat(first).isNotNull();
        assertThat(second).isNotNull();
        verify(live, times(2)).generateForRun(eq(AgentKind.REVIEW), any(), any(), eq(ReviewDecision.class));
        ArgumentCaptor<PipelineEvent> event = ArgumentCaptor.forClass(PipelineEvent.class);
        verify(events, times(1)).publish(event.capture());
        assertThat(event.getValue().type()).isEqualTo(PipelineEventType.AI_FALLBACK);
        verify(audit).record(eq(run.pipelineId()), eq("System"), eq("AI_FALLBACK"), eq("DEMO"), any(), any());
    }

    @Test
    void otherRunsStillTryLiveFirst() {
        when(live.generateForRun(eq(AgentKind.REVIEW), any(), any(), eq(ReviewDecision.class)))
                .thenThrow(PROVIDER_FAILURE);
        var router = router("demo", 0);

        router.generateForRun(AgentKind.REVIEW, liveRun(), "", ReviewDecision.class);
        router.generateForRun(AgentKind.REVIEW, liveRun(), "", ReviewDecision.class);

        verify(live, times(2)).generateForRun(eq(AgentKind.REVIEW), any(), any(), eq(ReviewDecision.class));
    }

    @Test
    void withoutFallbackTheFailureIsPropagatedAfterRetries() {
        var run = liveRun();
        when(live.generateForRun(AgentKind.REVIEW, run, "", ReviewDecision.class)).thenThrow(PROVIDER_FAILURE);

        assertThatThrownBy(() -> router("none", 2).generateForRun(AgentKind.REVIEW, run, "", ReviewDecision.class))
                .isSameAs(PROVIDER_FAILURE);
        verify(live, times(3)).generateForRun(AgentKind.REVIEW, run, "", ReviewDecision.class);
        verify(events, never()).publish(any());
    }

    @Test
    void configurationErrorsAreNotRetriedButStillFallBack() {
        var run = liveRun();
        when(live.generateForRun(AgentKind.REVIEW, run, "", ReviewDecision.class))
                .thenThrow(new IllegalStateException("OPENAI_API_KEY is not set"));

        var result = router("demo", 2).generateForRun(AgentKind.REVIEW, run, "", ReviewDecision.class);

        assertThat(result).isNotNull();
        verify(live, times(1)).generateForRun(AgentKind.REVIEW, run, "", ReviewDecision.class);
    }
}
