package com.enterprise.copilot.domain;

/**
 * A single proposed file change. Nova returns data; LocalRepositoryTool may apply
 * the validated contents in an isolated repository run.
 *
 * @param path       repository-relative path
 * @param changeType CREATE or MODIFY
 * @param content    full proposed file content (for CREATE)
 *                   or new content (for MODIFY)
 */
public record FileChange(String path, ChangeType changeType, String content) {

    public enum ChangeType {
        CREATE,
        MODIFY
    }
}
