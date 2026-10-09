package com.enterprise.copilot.domain;

import java.util.Map;

/** Server-owned execution evidence; never populated from a model response. */
public record RepositoryExecution(
        String workspace, String branch, String baseCommit, String candidateCommit,
        Map<String, String> sourceFiles, TestRun testRun, String reviewedCommit,
        String approvedCommit, String mergedCommit, String baselineCommit,
        String baselineFingerprint) {

    public static RepositoryExecution requested() {
        return new RepositoryExecution(null, null, null, null, Map.of(), null,
                null, null, null, null, null);
    }

    public RepositoryExecution candidate(String commit, Map<String, String> files, TestRun tests) {
        return new RepositoryExecution(workspace, branch, baseCommit, commit, files, tests,
                null, null, null, baselineCommit, baselineFingerprint);
    }

    public RepositoryExecution reviewed() {
        return new RepositoryExecution(workspace, branch, baseCommit, candidateCommit, sourceFiles,
                testRun, candidateCommit, null, null, baselineCommit, baselineFingerprint);
    }

    public RepositoryExecution approved() {
        return new RepositoryExecution(workspace, branch, baseCommit, candidateCommit, sourceFiles,
                testRun, reviewedCommit, candidateCommit, null, baselineCommit, baselineFingerprint);
    }

    public RepositoryExecution merged(String commit) {
        return new RepositoryExecution(workspace, branch, baseCommit, candidateCommit, sourceFiles,
                testRun, reviewedCommit, approvedCommit, commit, baselineCommit, baselineFingerprint);
    }

    public boolean testsPassed() {
        return testRun != null && candidateCommit != null
                && candidateCommit.equals(testRun.commit()) && testRun.passed();
    }

    public record TestRun(String command, String commit, int exitCode, boolean timedOut,
                          long durationMs, int collected, int failures, int errors, int skipped,
                          String stdout, String stderr) {
        public boolean passed() {
            return !timedOut && exitCode == 0 && collected > skipped
                    && failures == 0 && errors == 0;
        }
    }
}
