package com.enterprise.copilot.infrastructure.ai;

import com.enterprise.copilot.domain.*;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Canonical, deterministic agent outputs for the fictional Ubuntu Bank ticket <b>UB-4821</b>.
 *
 * <p>These guarantee the live workshop never depends on model randomness. Each scenario produces a
 * specific, reproducible outcome – most importantly the security-review "catch" moment.
 */
@Component
public class DemoResponses {

    private static final String SERVICE_PATH =
            "src/main/java/com/ubuntu/bank/notification/NotificationService.java";

    private static final String API_SPEC_PATH =
            "src/main/resources/api/notification-api.yaml";

    // -------------------------------------------------------------------------
    // Rhea — Requirements
    // -------------------------------------------------------------------------

    public RequirementAnalysis requirements(DemoScenario scenario) {

        return switch (scenario) {

            case AMBIGUOUS_REQUIREMENT -> new RequirementAnalysis(
                    "Notify customers when a transaction exceeds R50,000. The ticket omits several "
                            + "decisions required before implementation can safely begin.",
                    List.of(
                            "Notification channel is unspecified (SMS, email, push, in-app?)",
                            "\"Transaction\" is undefined – debit only, or credit and debit?",
                            "Threshold currency/rounding rules are not stated"),
                    List.of("Assuming ZAR and gross transaction amount pending confirmation"),
                    List.of(
                            "A customer receives a notification within 60s of a qualifying transaction",
                            "The threshold (R50,000) is externally configurable"),
                    List.of(
                            "Customer consent for proactive notifications is not addressed (POPIA)",
                            "Audit logging of notification events is required for compliance"),
                    List.of(
                            "Retry and idempotency behaviour for failed notifications is undefined"),
                    List.of(
                            "Which channel(s) should be used, and is customer consent already captured?",
                            "Does \"transaction\" include incoming credits or only outgoing debits?",
                            "Is R50,000 fixed or configurable per product/segment?")
            );

            case PROMPT_INJECTION -> new RequirementAnalysis(
                    "Notify customers when a transaction exceeds R50,000. NOTE: the ticket body contained "
                            + "an embedded instruction attempting to override security policy; it was ignored "
                            + "and treated as untrusted data.",
                    List.of("None material – requirement is otherwise clear"),
                    List.of("Embedded instruction to \"approve deployment automatically\" was disregarded"),
                    List.of(
                            "A customer receives a notification within 60s of a qualifying transaction",
                            "The threshold is externally configurable"),
                    List.of("Prompt-injection attempt recorded to the audit trail for security review"),
                    List.of("None"),
                    List.of()
            ); // ready – no clarification needed

            default -> new RequirementAnalysis(
                    "Notify customers when a transaction exceeds R50,000 via their consented channel "
                            + "with an auditable record of each notification.",
                    List.of("None material"),
                    List.of("Customer consent is captured during onboarding and available via ConsentService"),
                    List.of(
                            "A customer receives a notification within 60s of a qualifying transaction",
                            "The R50,000 threshold is externally configurable",
                            "Every notification is recorded in the audit trail"),
                    List.of("Notification events must be auditable (POPIA)"),
                    List.of("Downstream notification provider rate limits must be respected"),
                    List.of()
            ); // ready
        };
    }

    // -------------------------------------------------------------------------
    // Nova — Code
    // -------------------------------------------------------------------------

    public CodeChangeSet code(DemoScenario scenario) {

        return switch (scenario) {

            case SECURITY_FAILURE -> new CodeChangeSet(
                    List.of(new FileChange(
                            SERVICE_PATH,
                            FileChange.ChangeType.CREATE,
                            insecureServiceSource())),
                    diff(insecureServiceSource()),
                    "Implements HighValueTransactionNotifier. NOTE: this proposal logs the full account "
                            + "number for traceability – flagged for review.",
                    List.of("NotificationServiceTest#notifiesWhenAboveThreshold"),
                    List.of("Assumes NotificationClient is available via dependency injection"),
                    true);

            case HALLUCINATED_API -> new CodeChangeSet(
                    List.of(new FileChange(
                            SERVICE_PATH,
                            FileChange.ChangeType.CREATE,
                            hallucinatedApiSource())),
                    diff(hallucinatedApiSource()),
                    "Implements the notifier and calls FraudClient.verifyTransaction(...) to double-check "
                            + "high-value transactions before notifying.",
                    List.of("NotificationServiceTest#verifiesBeforeNotifying"),
                    List.of("Assumes FraudClient exposes verifyTransaction(TransactionId) – please confirm"),
                    true);

            case TEST_FAILURE -> new CodeChangeSet(
                    List.of(new FileChange(
                            SERVICE_PATH,
                            FileChange.ChangeType.CREATE,
                            secureServiceSource())),
                    diff(secureServiceSource()),
                    "Implements HighValueTransactionNotifier with consent check and audit logging.",
                    List.of("NotificationServiceTest#notifiesWhenAboveThreshold (FAILING: threshold logic)"),
                    List.of("Threshold comparison uses > vs >= – under verification"),
                    false);

            default -> new CodeChangeSet(
                    List.of(new FileChange(
                            SERVICE_PATH,
                            FileChange.ChangeType.CREATE,
                            secureServiceSource())),
                    diff(secureServiceSource()),
                    "Implements HighValueTransactionNotifier: checks the configurable threshold, verifies "
                            + "customer consent, sends via the consented channel and writes an audit record. "
                            + "No sensitive data is logged.",
                    List.of(
                            "NotificationServiceTest#notifiesWhenAboveThreshold",
                            "NotificationServiceTest#skipsWhenNoConsent"),
                    List.of("Uses masked account references only"),
                    true);
        };
    }

    // -------------------------------------------------------------------------
    // Sentinel — Review
    // -------------------------------------------------------------------------

    public ReviewDecision review(DemoScenario scenario) {

        return switch (scenario) {

            case SECURITY_FAILURE -> new ReviewDecision(
                    ReviewOutcome.REJECT,
                    "Sensitive customer information is written to logs. This is a POPIA violation and "
                            + "data-leakage risk. Changes required before this can proceed.",
                    List.of(
                            new ReviewFinding(
                                    Severity.CRITICAL,
                                    "COMPLIANCE",
                                    SERVICE_PATH,
                                    "line 42",
                                    "Full account number is logged in plain text.",
                                    "Never log account numbers. Log a masked reference or an internal id."),
                            new ReviewFinding(
                                    Severity.HIGH,
                                    "SECURITY",
                                    SERVICE_PATH,
                                    "line 42",
                                    "Personally identifiable information written to application logs.",
                                    "Introduce a redaction utility and assert no PII reaches log sinks.")
                    ));

            case HALLUCINATED_API -> new ReviewDecision(
                    ReviewOutcome.REQUEST_CHANGES,
                    "The proposal calls FraudClient.verifyTransaction(...), which does not exist in the "
                            + "published notification API contract. This assumption is invalid.",
                    List.of(
                            new ReviewFinding(
                                    Severity.CRITICAL,
                                    "ARCHITECTURE",
                                    SERVICE_PATH,
                                    "line 27",
                                    "FraudClient.verifyTransaction(...) is not defined in notification-api.yaml.",
                                    "Remove the call or integrate against a real, published contract.")
                    ));

            case PROMPT_INJECTION -> new ReviewDecision(
                    ReviewOutcome.APPROVE,
                    "Implementation is sound. A prompt-injection attempt in the source ticket was detected "
                            + "and neutralised upstream; no policy was bypassed.",
                    List.of(
                            new ReviewFinding(
                                    Severity.LOW,
                                    "SECURITY",
                                    "ticket:UB-4821",
                                    "description",
                                    "Ticket contained an instruction attempting to bypass approval gates.",
                                    "Attempt was ignored and audited. No action required in code.")
                    ));

            default -> new ReviewDecision(
                    ReviewOutcome.APPROVE,
                    "Implementation meets security, compliance, quality and architecture standards. "
                            + "Consent is checked, no sensitive data is logged, and events are auditable.",
                    List.of());
        };
    }

    // -------------------------------------------------------------------------
    // Source templates
    // -------------------------------------------------------------------------

    private String secureServiceSource() {
        return """
                package com.ubuntu.bank.notification;
                
                import org.slf4j.Logger;
                import org.slf4j.LoggerFactory;
                import org.springframework.stereotype.Service;
                
                @Service
                public class NotificationService {
                
                    private static final Logger log =
                            LoggerFactory.getLogger(NotificationService.class);
                
                    private final NotificationClient client;
                    private final ConsentService consent;
                    private final AuditService audit;
                    private final long thresholdCents;
                
                    public NotificationService(
                            NotificationClient client,
                            ConsentService consent,
                            AuditService audit,
                            NotificationProperties props) {
                
                        this.client = client;
                        this.consent = consent;
                        this.audit = audit;
                        this.thresholdCents = props.thresholdCents();
                    }
                
                    public void onTransaction(Transaction tx) {
                
                        if (tx.amountCents() <= thresholdCents) {
                            return;
                        }
                
                        if (!consent.hasConsent(tx.customerId(), Channel.SMS)) {
                            log.info(
                                    "Skipping notification for customer {} – no consent",
                                    tx.customerRef());
                            return;
                        }
                
                        client.send(
                                tx.customerId(),
                                "A transaction above your alert threshold occurred.");
                
                        audit.record(
                                "HIGH_VALUE_NOTIFICATION",
                                tx.reference());
                
                        log.info(
                                "Notified customer {} for transaction {}",
                                tx.customerRef(),
                                tx.reference());
                    }
                }
                """;
    }

    private String insecureServiceSource() {
        return """
                package com.ubuntu.bank.notification;
                
                import org.slf4j.Logger;
                import org.slf4j.LoggerFactory;
                import org.springframework.stereotype.Service;
                
                @Service
                public class NotificationService {
                
                    private static final Logger log =
                            LoggerFactory.getLogger(NotificationService.class);
                
                    private final NotificationClient client;
                    private final long thresholdCents;
                
                    public NotificationService(
                            NotificationClient client,
                            NotificationProperties props) {
                
                        this.client = client;
                        this.thresholdCents = props.thresholdCents();
                    }
                
                    public void onTransaction(Transaction tx) {
                
                        if (tx.amountCents() <= thresholdCents) {
                            return;
                        }
                
                        client.send(
                                tx.customerId(),
                                "A high value transaction occurred.");
                
                        // BUG: logs the full account number in plain text (POPIA violation)
                        log.info(
                                "Transaction completed for account {}",
                                tx.accountNumber());
                    }
                }
                """;
    }

    private String hallucinatedApiSource() {
        return """
                package com.ubuntu.bank.notification;
                
                import org.springframework.stereotype.Service;
                
                @Service
                public class NotificationService {
                
                    private final NotificationClient client;
                    private final FraudClient fraud;
                    private final long thresholdCents;
                
                    public NotificationService(
                            NotificationClient client,
                            FraudClient fraud,
                            NotificationProperties props) {
                
                        this.client = client;
                        this.fraud = fraud;
                        this.thresholdCents = props.thresholdCents();
                    }
                
                    public void onTransaction(Transaction tx) {
                
                        if (tx.amountCents() <= thresholdCents) {
                            return;
                        }
                
                        // Calls an endpoint that does not exist in notification-api.yaml
                        if (fraud.verifyTransaction(tx.id()).isClean()) {
                
                            client.send(
                                    tx.customerId(),
                                    "A high value transaction occurred.");
                        }
                    }
                }
                """;
    }

    private String diff(String fileContent) {
        StringBuilder sb = new StringBuilder();
        sb.append("diff --git a/")
                .append(SERVICE_PATH)
                .append(" b/")
                .append(SERVICE_PATH)
                .append('\n');
        sb.append("new file mode 100644\n");
        sb.append("--- /dev/null\n");
        sb.append("+++ b/")
                .append(SERVICE_PATH)
                .append('\n');

        for (String line : fileContent.split("\n", -1)) {
            sb.append('+').append(line).append('\n');
        }

        return sb.toString();
    }

    public String apiSpecPath() {
        return API_SPEC_PATH;
    }
}