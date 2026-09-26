package com.enterprise.copilot.domain;

/**
 * A single proposed file change. The Code Agent never writes
 * to the real filesystem – it only proposes changes rendered
 * as a GitHub-style diff.
 *
 * @param path       repository-relative path
 * @param changeType CREATE or MODIFY
 * @param content    full proposed file content (for CREATE)
 *                   or new content (for MODIFY)
 */
public record FileChange(

        String path,

        ChangeType changeType,

        String content

) {

    public enum ChangeType {
        CREATE,
        MODIFY
    }
}