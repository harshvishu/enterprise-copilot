package com.enterprise.copilot.domain;

/**
 * A single review finding produced by the Review Agent (Sentinel).
 *
 * @param severity       CRITICAL / HIGH / MEDIUM / LOW
 * @param category       SECURITY / COMPLIANCE / QUALITY / ARCHITECTURE
 * @param file           file the finding relates to
 * @param location       line number or approximate location
 * @param description    what is wrong
 * @param recommendation how to fix it
 */
public record ReviewFinding(
        Severity severity,
        String category,
        String file,
        String location,
        String description,
        String recommendation
) {
}