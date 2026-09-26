package com.enterprise.copilot.github;

import com.enterprise.copilot.domain.PipelineContext;

/**
 * Abstraction over GitHub. The workshop defaults to {@link MockGitHubGateway}; a real implementation
 * is an optional extension enabled by configuration. No GitHub credentials are needed for the demo.
 */
public interface GitHubGateway {
    GitHubView view(PipelineContext context);
}
