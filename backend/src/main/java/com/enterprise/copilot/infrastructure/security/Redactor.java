package com.enterprise.copilot.infrastructure.security;

import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

/**
 * Best-effort redaction applied before anything is written to the audit trail or logs.
 *
 * <p>Defends against accidental leakage of secrets and customer PII. This is a safety net, not a
 * substitute for agents that never emit sensitive data in the first place.
 */
@Component
public class Redactor {

    private static final Pattern PAN = Pattern.compile("\\b(?:\\d[ -]?){13,19}\\b");

    private static final Pattern ACCOUNT = Pattern.compile("\\b\\d{8,12}\\b");

    private static final Pattern SECRET =
            Pattern.compile("(?i)(api[_-]?key|secret|token|password|bearer)\\s*[:=]\\s*\\S+");

    private static final Pattern EMAIL =
            Pattern.compile("\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b");

    public String redact(String input) {

        if (input == null || input.isBlank()) {
            return input;
        }

        String out = SECRET.matcher(input).replaceAll("$1=***REDACTED***");
        out = PAN.matcher(out).replaceAll("****-****-****-****");
        out = ACCOUNT.matcher(out).replaceAll("***ACCOUNT***");
        out = EMAIL.matcher(out).replaceAll("***EMAIL***");
        return out;
    }
}
