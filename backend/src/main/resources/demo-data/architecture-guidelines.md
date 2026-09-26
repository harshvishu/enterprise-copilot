APPROVED SPRING BOOT PATTERNS (Ubuntu Bank – fictional)

- Services use constructor injection only. No field injection.
- Externalise thresholds and toggles via @ConfigurationProperties (e.g. NotificationProperties).
- Domain events are published through the internal EventPublisher, never ad-hoc.
- Outbound integrations go through a typed client interface (e.g. NotificationClient), never raw HTTP.
- All customer-facing side effects must be idempotent and safe to retry.
- Logging uses SLF4J with masked references; no PII in log statements.