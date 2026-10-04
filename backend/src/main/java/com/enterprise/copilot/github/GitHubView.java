package com.enterprise.copilot.github;

import java.util.List;

/**
 * A simulated GitHub view of a pipeline: issue, pull request, review comments, CI checks, deployment.
 */
public record GitHubView(
        Issue issue,
        PullRequest pullRequest,
        List<ReviewComment> reviewComments,
        List<Check> checks,
        String deploymentStatus) {
    public record Issue(String key, String title, String state, String body) {}

    public record PullRequest(String number, String title, String state, String diff) {}

    public record ReviewComment(String author, String verdict, String body, String location) {}

    public record Check(String name, String status) {}
}
