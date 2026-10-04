package com.enterprise.copilot.infrastructure.security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RedactorTest {

    private final Redactor redactor = new Redactor();

    @Test
    void redactsAccountNumbers() {
        assertThat(redactor.redact("account 1234567890 debited")).doesNotContain("1234567890");
    }

    @Test
    void redactsSecrets() {
        assertThat(redactor.redact("api_key=sk-secret-value"))
                .contains("REDACTED")
                .doesNotContain("sk-secret-value");
    }

    @Test
    void redactsEmails() {
        assertThat(redactor.redact("contact john@ubuntu.bank")).doesNotContain("john@ubuntu.bank");
    }

    @Test
    void leavesSafeTextUntouched() {
        assertThat(redactor.redact("High value notification sent"))
                .isEqualTo("High value notification sent");
    }
}
