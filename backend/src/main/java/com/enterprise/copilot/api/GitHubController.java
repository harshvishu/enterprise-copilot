package com.enterprise.copilot.api;

import com.enterprise.copilot.github.GitHubGateway;
import com.enterprise.copilot.github.GitHubView;
import com.enterprise.copilot.persistence.PipelineStore;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Returns the simulated GitHub view (issue, PR,
 * review comments, checks) for a pipeline.
 */
@RestController
@RequestMapping("/api/github")
@RequiredArgsConstructor
public class GitHubController {

    private final GitHubGateway gitHub;
    private final PipelineStore store;

    @GetMapping("/pipelines/{id}")
    public ResponseEntity<GitHubView> view(@PathVariable UUID id) {

        return store.load(id)
                .map(gitHub::view)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
