package com.enterprise.copilot.domain;

import java.util.List;

/**
 * Structured output of Nova. Initially a proposal; in repository runs the orchestrator
 * replaces its preview with actual Git evidence after applying files in the isolated clone.
 *
 * @param files       proposed file changes
 * @param unifiedDiff GitHub-style unified diff rendered in the UI
 * @param explanation human-readable rationale
 * @param tests       proposed test names / descriptions
 * @param assumptions assumptions the reviewer must validate
 * @param testsPass   simulated/model-provided signal, never generated-test execution evidence
 *                    (TEST_FAILURE scripts this false)
 */
public record CodeChangeSet(
        List<FileChange> files,
        String unifiedDiff,
        String explanation,
        List<String> tests,
        List<String> assumptions,
        boolean testsPass) {

    public boolean hasProposedTests() {
        return tests != null
                && !tests.isEmpty()
                && tests.stream().allMatch(test -> test != null && !test.isBlank());
    }

    public boolean hasPassingTestSignal() {
        return hasProposedTests() && testsPass;
    }
}
