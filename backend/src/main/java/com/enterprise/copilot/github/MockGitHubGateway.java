package com.enterprise.copilot.github;

import com.enterprise.copilot.domain.*;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Builds a realistic GitHub-style view entirely from the pipeline context. Simulates the issue, the
 * pull request diff, Sentinel's review comments, CI checks and deployment status.
 */
@Component
@Profile("!real-github")
public class MockGitHubGateway implements GitHubGateway {

    @Override
    public GitHubView view(PipelineContext ctx) {

        var ticket = ctx.ticket();

        GitHubView.Issue issue =
                new GitHubView.Issue(
                        ticket.key(),
                        ticket.title(),
                        ctx.state() == PipelineState.DEPLOYED ? "closed" : "open",
                        ticket.description());

        CodeChangeSet code = ctx.codeChangeSet();

        GitHubView.PullRequest pr =
                code == null
                        ? null
                        : new GitHubView.PullRequest(
                                "PR-" + ticket.key(),
                                ticket.key() + " " + ticket.title(),
                                prState(ctx),
                                code.unifiedDiff());

        List<GitHubView.ReviewComment> comments = new ArrayList<>();

        ReviewDecision review = ctx.reviewDecision();

        if (review != null) {

            for (ReviewFinding f : review.findings()) {

                comments.add(
                        new GitHubView.ReviewComment(
                                "Sentinel",
                                review.outcome().name(),
                                "["
                                        + f.severity()
                                        + "] "
                                        + f.description()
                                        + " – "
                                        + f.recommendation(),
                                f.file() + ":" + f.location()));
            }

            if (review.findings().isEmpty()) {

                comments.add(
                        new GitHubView.ReviewComment(
                                "Sentinel", review.outcome().name(), review.summary(), ""));
            }
        }

        List<GitHubView.Check> checks =
                ctx.executesRepository() ? List.of(
                        new GitHubView.Check("Actual local pytest", ctx.repositoryExecution().testRun() == null
                                ? "not_evaluated" : ctx.repositoryExecution().testsPassed() ? "success" : "failure"),
                        new GitHubView.Check("Sentinel candidate review", review == null ? "not_evaluated"
                                : review.passed() ? "success" : "failure")) : List.of(
                        new GitHubView.Check("Generated build (not executed)", "not_evaluated"),
                        new GitHubView.Check(
                                "Test signal (simulated/model-provided)",
                                code == null || !code.hasProposedTests()
                                        ? "not_evaluated"
                                        : code.hasPassingTestSignal() ? "success" : "failure"),
                        new GitHubView.Check(
                                "Sentinel review (not a CI scan)",
                                review == null
                                        ? "not_evaluated"
                                        : review.passed() && !review.hasCriticalFindings()
                                                ? "success"
                                                : "failure"));

        return new GitHubView(issue, pr, comments, checks, deploymentStatus(ctx));
    }

    private String prState(PipelineContext ctx) {

        if (ctx.executesRepository()) return ctx.repositoryExecution().mergedCommit() != null ? "merged_locally" : "not_merged";

        return switch (ctx.state()) {
            case DEPLOYED -> "merged";

            case BLOCKED, REVIEW_FAILED, FAILED -> "changes_requested";

            default -> "open";
        };
    }

    private String deploymentStatus(PipelineContext ctx) {

        return switch (ctx.state()) {
            case DEPLOYED -> "Simulated deployment completed";

            case WAITING_FOR_APPROVAL -> "Blocked – human approval required";

            case BLOCKED -> "Blocked";

            default -> "Pending";
        };
    }
}
