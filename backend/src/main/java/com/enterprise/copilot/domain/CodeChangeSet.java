package com.enterprise.copilot.domain;

import java.util.List;

/**
 * Structured output of the Code Agent (Nova): a <strong>proposal</strong>,
 * never an applied change.
 *
 * @param files       proposed file changes
 * @param unifiedDiff GitHub-style unified diff rendered in the UI
 * @param explanation human-readable rationale
 * @param tests       proposed test names / descriptions
 * @param assumptions assumptions the reviewer must validate
 * @param testsPass   deterministic signal used by demo scenarios
 *                    (TEST_FAILURE flips this false)
 */
public record CodeChangeSet(

        List<FileChange> files,

        String unifiedDiff,

        String explanation,

        List<String> tests,

        List<String> assumptions,

        boolean testsPass

) {
}