package com.enterprise.copilot.tools;

import com.enterprise.copilot.domain.*;
import com.enterprise.copilot.demo.DemoTickets;
import com.enterprise.copilot.infrastructure.ai.*;
import com.enterprise.copilot.orchestration.*;
import com.enterprise.copilot.persistence.PipelineStore;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import java.nio.file.*;
import java.time.Duration;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.awaitility.Awaitility.await;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doAnswer;

/** AI responses are controlled fixtures; filesystem, Git, pytest, persistence and gates are real. */
@SpringBootTest
@ActiveProfiles("demo")
class RepositoryPipelineIntegrationTest {
    static final Path ROOT = fixture();
    static final Path BANK = Path.of("../ubuntu-bank-demo").toAbsolutePath().normalize();
    @Autowired PipelineOrchestrator orchestrator;
    @Autowired PipelineStore store;
    @Autowired DemoState mode;
    @Autowired PipelineEventPublisher events;
    @MockitoSpyBean RoutingAgentAiClient ai;
    boolean failTests, clarify, requestChanges, revise;

    static Path fixture() {
        try {
            Path root = Files.createTempDirectory("copilot-repository-test-").toRealPath();
            Path bank = Path.of("../ubuntu-bank-demo").toAbsolutePath().normalize();
            Path baseline = root.resolve("baseline");
            Files.createDirectories(baseline);
            try (var paths = Files.walk(bank)) {
                for (Path source : paths.filter(Files::isRegularFile)
                        .filter(p -> bank.relativize(p).toString().matches("(app|tests)/[^/]+\\.py|README.md|pytest.ini|requirements.txt|\\.gitignore")).toList()) {
                    Path target = baseline.resolve(bank.relativize(source));
                    Files.createDirectories(target.getParent());
                    Files.copy(source, target);
                }
            }
            LocalRepositoryToolTest.git(baseline, "init");
            LocalRepositoryToolTest.git(baseline, "config", "user.name", "Fixture");
            LocalRepositoryToolTest.git(baseline, "config", "user.email", "fixture@example.invalid");
            LocalRepositoryToolTest.git(baseline, "add", ".");
            LocalRepositoryToolTest.git(baseline, "commit", "-m", "Fixture baseline");
            return root;
        } catch (Exception ex) { throw new IllegalStateException(ex); }
    }
    @DynamicPropertySource static void properties(DynamicPropertyRegistry registry) {
        registry.add("copilot.repository.path", () -> ROOT.resolve("baseline").toString());
        registry.add("copilot.repository.workspace-root", () -> ROOT.resolve("workspaces").toString());
        registry.add("copilot.repository.python", () -> BANK.resolve(".venv/bin/python").toString());
        registry.add("copilot.demo.step-delay-ms", () -> "0");
        registry.add("copilot.demo.activity-delay-ms", () -> "0");
        registry.add("spring.datasource.url", () -> "jdbc:h2:mem:repository-tests;MODE=PostgreSQL;DB_CLOSE_DELAY=-1");
    }

    @BeforeEach void fixtureResponses() {
        mode.setMode(AiMode.LIVE);
        doAnswer(invocation -> {
            AgentKind kind = invocation.getArgument(0);
            PipelineContext ctx = invocation.getArgument(1);
            String prompt = invocation.getArgument(2);
            assertThat(prompt).contains("amount_cents");
            return switch (kind) {
                case REQUIREMENTS -> new RequirementAnalysis("Inclusive R50,000 boundary test", List.of(), List.of(), List.of("R50,000 is included"), List.of(), List.of(), clarify ? List.of("Which notification channel?") : List.of());
                case CODE -> {
                    String path = "tests/test_boundary_" + ctx.pipelineId().toString().replace("-", "") + ".py";
                    String code = "from fastapi.testclient import TestClient\nfrom app.main import app\nfrom app import store\n"
                            + "def test_inclusive_boundary():\n    store.reset_store()\n    client = TestClient(app)\n"
                            + "    response = client.post('/payments', json={'customer_id': 'personal-001', 'amount_cents': 5_000_000})\n"
                            + "    assert response.status_code == 201\n    assert len(client.get('/notifications').json()) == " + (failTests ? "0" : "1") + "\n"
                            + (revise ? "    assert response.json()['currency'] == 'ZAR'\n" : "");
                    yield new CodeChangeSet(List.of(new FileChange(path, ctx.repositoryExecution().sourceFiles().containsKey(path) ? FileChange.ChangeType.MODIFY : FileChange.ChangeType.CREATE, code)), "fake preview", "Add exact boundary test", List.of("inclusive boundary"), List.of(), true);
                }
                case REVIEW -> {
                    assertThat(prompt).contains("diff --git", "SERVER-RECORDED", "collected", ctx.repositoryExecution().candidateCommit());
                    yield new ReviewDecision(requestChanges ? ReviewOutcome.REQUEST_CHANGES : ReviewOutcome.APPROVE, "Fixture review of actual evidence", List.of());
                }
                default -> throw new AssertionError("Atlas must not call a model");
            };
        }).when(ai).generateForRun(any(), any(), anyString(), any());
    }

    PipelineContext start() {
        var issue = new DemoTickets().find("UB-4824").orElseThrow();
        return orchestrator.createAndRun(issue.ticket(), true);
    }
    PipelineContext waitFor(UUID id, PipelineState state) {
        await().atMost(Duration.ofSeconds(30)).until(() -> store.load(id).orElseThrow().state() == state);
        return store.load(id).orElseThrow();
    }

    @Test void approvalIsCommitBoundAndMergeRequiresSeparateExplicitAction() throws Exception {
        var ctx = start();
        ctx = waitFor(ctx.pipelineId(), PipelineState.WAITING_FOR_APPROVAL);
        UUID id = ctx.pipelineId();
        String commit = ctx.repositoryExecution().candidateCommit();
        assertThat(ctx.repositoryExecution().testsPassed()).isTrue();
        assertThat(ctx.repositoryExecution().reviewedCommit()).isEqualTo(commit);
        assertThat(ctx.codeChangeSet().unifiedDiff()).contains("diff --git").doesNotContain("fake preview");
        assertThatThrownBy(() -> orchestrator.merge(id, "test", commit)).isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> orchestrator.approve(id, "test")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> orchestrator.approve(id, "test", "wrong-commit")).isInstanceOf(IllegalArgumentException.class);
        ctx = orchestrator.approve(id, "test", commit);
        assertThat(ctx.approvalState()).isEqualTo(ApprovalState.APPROVED);
        assertThat(ctx.repositoryExecution().mergedCommit()).isNull();
        ctx = orchestrator.merge(id, "test", commit);
        assertThat(ctx.repositoryExecution().mergedCommit()).isEqualTo(commit);
        assertThat(orchestrator.merge(id, "test", commit).repositoryExecution().mergedCommit()).isEqualTo(commit);
        assertThat(store.load(id).orElseThrow().repositoryExecution().testRun().collected()).isEqualTo(12);
        assertThat(ROOT.resolve("baseline/tests/test_boundary_workshop.py")).doesNotExist();
        LocalRepositoryToolTest.git(ROOT.resolve("baseline"), "diff", "--exit-code");
    }

    @Test void failingRealTestsCannotBeApprovedEvenWithModelSuccessFlag() {
        failTests = true;
        var initial = start();
        var ctx = waitFor(initial.pipelineId(), PipelineState.BLOCKED);
        assertThat(ctx.codeChangeSet().testsPass()).isTrue();
        assertThat(ctx.repositoryExecution().testsPassed()).isFalse();
        assertThat(ctx.deploymentDecision().blockingReasons()).anyMatch(reason -> reason.contains("pytest"));
        assertThatThrownBy(() -> orchestrator.approve(ctx.pipelineId(), "test", ctx.repositoryExecution().candidateCommit())).isInstanceOf(IllegalStateException.class);
    }

    @Test void clarificationAndReviewFeedbackPauseAndThenReexecuteRealTests() {
        clarify = true;
        requestChanges = true;
        var ctx = start();
        ctx = waitFor(ctx.pipelineId(), PipelineState.REQUIREMENTS_READY);
        UUID id = ctx.pipelineId();
        assertThat(ctx.repositoryExecution().candidateCommit()).isNull();
        orchestrator.clarify(id, List.of("SMS"));
        ctx = waitFor(id, PipelineState.WAITING_FOR_REVIEW_FEEDBACK);
        String first = ctx.repositoryExecution().candidateCommit();
        requestChanges = false;
        revise = true;
        orchestrator.reviewFeedback(id, "Also assert currency is ZAR");
        ctx = waitFor(id, PipelineState.WAITING_FOR_APPROVAL);
        assertThat(ctx.repositoryExecution().candidateCommit()).isNotEqualTo(first);
        assertThat(ctx.repositoryExecution().reviewedCommit()).isEqualTo(ctx.repositoryExecution().candidateCommit());
        assertThat(ctx.repositoryExecution().approvedCommit()).isNull();
        assertThat(ctx.repositoryExecution().testsPassed()).isTrue();
        orchestrator.reject(id, "test");
        assertThatThrownBy(() -> orchestrator.approve(id, "test", first)).isInstanceOf(IllegalStateException.class);
        assertThat(events.historyFor(id).stream().filter(e -> "PYTEST_RESULT".equals(e.data().get("step"))).count()).isEqualTo(2);
    }

    @Test void repositoryExecutionRejectsDemoBeforeCreatingWorkspaces() {
        mode.setMode(AiMode.DEMO);
        assertThatThrownBy(this::start).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("LIVE");
    }
}
