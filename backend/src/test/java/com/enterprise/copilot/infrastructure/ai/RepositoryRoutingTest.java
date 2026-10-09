package com.enterprise.copilot.infrastructure.ai;

import com.enterprise.copilot.domain.*;
import com.enterprise.copilot.domain.audit.AuditService;
import com.enterprise.copilot.orchestration.PipelineEventPublisher;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import java.util.UUID;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class RepositoryRoutingTest {
    @Test @SuppressWarnings("unchecked") void repositoryRunsNeverUseConfiguredDemoFallback() {
        var live = mock(SpringAiAgentAiClient.class);
        var demo = mock(DemoAgentAiClient.class);
        var provider = (ObjectProvider<SpringAiAgentAiClient>) mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(live);
        var router = new RoutingAgentAiClient(demo, provider, mock(DemoState.class),
                mock(PipelineEventPublisher.class), mock(AuditService.class), "demo", 0, 0);
        var ctx = new PipelineContext(UUID.randomUUID(), new Ticket("UB-4824", "Boundary", "Inclusive", "JIRA"), DemoScenario.NORMAL, AiMode.LIVE);
        ctx.setRepositoryExecution(RepositoryExecution.requested());
        var failure = new IllegalStateException("provider unavailable");
        when(live.generateForRun(any(), any(), anyString(), any())).thenThrow(failure);
        assertThatThrownBy(() -> router.generateForRun(AgentKind.CODE, ctx, "prompt", CodeChangeSet.class)).isSameAs(failure);
        verifyNoInteractions(demo);
        var preview = new PipelineContext(UUID.randomUUID(), ctx.ticket(), DemoScenario.NORMAL, AiMode.DEMO);
        preview.setRepositoryExecution(RepositoryExecution.requested());
        assertThatThrownBy(() -> router.generateForRun(AgentKind.CODE, preview, "prompt", CodeChangeSet.class)).hasMessageContaining("scripted DEMO");
        verifyNoInteractions(demo);
    }
}
