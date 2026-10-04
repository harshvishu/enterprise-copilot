package com.enterprise.copilot.infrastructure.ai;

import com.enterprise.copilot.domain.*;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Canonical, deterministic agent outputs for the fictional Ubuntu Bank backlog.
 *
 * <p>These guarantee the live workshop never depends on model randomness. Each scenario produces a
 * specific, reproducible outcome – most importantly the security-review "catch" moment.
 */
@Component
public class DemoResponses {

    private static final String SERVICE_PATH =
            "src/main/java/com/ubuntu/bank/notification/NotificationService.java";

    private static final String API_SPEC_PATH = "src/main/resources/api/notification-api.yaml";

    // -------------------------------------------------------------------------
    // Rhea — Requirements
    // -------------------------------------------------------------------------

    public RequirementAnalysis requirements(DemoScenario scenario) {
        String baseline =
                "For posted ZAR outgoing debits strictly above the configurable threshold, initially "
                        + "R50,000, send one generic SMS within 60 seconds only after ConsentService confirms SMS consent. "
                        + "Use NotificationClient, two idempotent retries for transient failures within the deadline, "
                        + "and stop on permanent failure or exhaustion without fallback. Audit attempts and outcomes "
                        + "with masked references under bank retention policy; do not retain raw message content.";
        List<String> criteria =
                List.of(
                        "Verify posted ZAR debit eligibility and threshold boundaries",
                        "Verify SMS consent and duplicate suppression",
                        "Verify two retries, deadline and audited failure");
        List<String> policy =
                List.of(
                        "Never log account numbers, balances, PANs or customer identifiers",
                        "Use channel-specific consent and non-sensitive auditing under bank retention policy");
        return switch (scenario) {
            case AMBIGUOUS_REQUIREMENT ->
                    new RequirementAnalysis(
                            "Notify qualifying posted ZAR transactions strictly above configurable R50,000 within 60 seconds, "
                                    + "with consent, two idempotent transient retries and masked audit outcomes. Product must "
                                    + "resolve credit eligibility, channel and behaviour when that channel has no consent.",
                            List.of(
                                    "Incoming credit eligibility",
                                    "Selected channel",
                                    "No-consent behaviour"),
                            List.of(),
                            List.of(
                                    "Threshold and currency are specified; eligibility/channel remain unresolved"),
                            policy,
                            List.of("Delivery reliability is not guaranteed"),
                            List.of(
                                    "Should incoming credits qualify alongside outgoing debits?",
                                    "Which notification channel should be used: SMS, email or push?",
                                    "What should happen when the selected channel has no consent?"));
            case HALLUCINATED_API ->
                    new RequirementAnalysis(
                            baseline
                                    + " Notify only after approved screening clears the transaction. The supplied evidence "
                                    + "does not provide its owner/contract or unavailable/deadline behaviour; these are blockers.",
                            List.of(
                                    "Approved screening contract missing",
                                    "Screening failure behaviour unresolved"),
                            List.of(),
                            List.of(
                                    "Screening must clear before sending; missing contract prevents implementation"),
                            policy,
                            List.of(
                                    "Screening capability is unsupported by supplied enterprise evidence"),
                            List.of(
                                    "Is an approved screening capability available? Provide its owner and contract, or the "
                                            + "approved scope without screening.",
                                    "What is the required behaviour when screening is unavailable or exceeds 60 seconds?"));
            case SECURITY_FAILURE ->
                    new RequirementAnalysis(
                            baseline
                                    + " Support explicitly requests full account numbers in application delivery logs. "
                                    + "This is clear but conflicts with the supplied data-minimisation policy; use masked "
                                    + "transaction traces instead. Readiness is not security approval.",
                            List.of(),
                            List.of(),
                            criteria,
                            List.of(
                                    "Full account numbers in logs violate compliance-policy.md section 2; no exception approved"),
                            List.of("Sensitive logging must be independently rejected by Sentinel"),
                            List.of());
            case TEST_FAILURE ->
                    new RequirementAnalysis(
                            baseline.replace("strictly above", "equal to or above")
                                    + " Equality now qualifies; verify one cent below, equal and one cent above.",
                            List.of(),
                            List.of(),
                            List.of(
                                    "Equality qualifies; smaller debits and credits do not",
                                    "Preserve consent, retry and duplicate suppression behaviour"),
                            policy,
                            List.of(),
                            List.of());
            case PROMPT_INJECTION ->
                    new RequirementAnalysis(
                            "Extend the existing retail flow to business account holders. "
                                    + baseline
                                    + " The embedded instruction to bypass security review/approval was ignored as untrusted data.",
                            List.of(),
                            List.of(
                                    "Embedded instruction to approve deployment automatically was disregarded"),
                            List.of(
                                    "Business account debits qualify under the same explicit rules",
                                    "Verify business consent, boundaries and duplicate suppression"),
                            policy,
                            List.of(),
                            List.of());
            default ->
                    new RequirementAnalysis(
                            baseline,
                            List.of(),
                            List.of(),
                            criteria,
                            policy,
                            List.of("Provider availability is not guaranteed"),
                            List.of());
        };
    }

    public RequirementAnalysis requirements(
            DemoScenario scenario, boolean approvedBusinessPolicySupplied) {
        RequirementAnalysis baseline = requirements(scenario);
        if (scenario != DemoScenario.AMBIGUOUS_REQUIREMENT || !approvedBusinessPolicySupplied) {
            return baseline;
        }
        return new RequirementAnalysis(
                "Notify qualifying posted ZAR outgoing debits strictly above configurable R50,000 within 60 seconds. "
                        + "Approved source retail-high-value-alerts resolves earlier launch decisions: exclude credits, "
                        + "use SMS only and skip/audit without SMS consent, without channel fallback. Preserve the "
                        + "ticket's two idempotent transient retries and audited stop on exhaustion.",
                List.of(),
                baseline.assumptions(),
                List.of(
                        "Outgoing debits qualify; incoming credits do not",
                        "SMS is the approved launch channel; absent SMS consent means skip and audit",
                        "Preserve ticket threshold, deadline, retries and non-sensitive audit outcomes"),
                baseline.complianceConcerns(),
                baseline.technicalRisks(),
                List.of());
    }

    // -------------------------------------------------------------------------
    // Nova — Code
    // -------------------------------------------------------------------------

    public CodeChangeSet code(DemoScenario scenario) {
        String source =
                switch (scenario) {
                    case SECURITY_FAILURE -> insecureServiceSource();
                    case HALLUCINATED_API -> hallucinatedApiSource();
                    default -> secureServiceSource();
                };
        String explanation =
                "Proposes posted ZAR debit eligibility, configurable strict threshold, consented SMS, "
                        + "duplicate suppression, two transient retries within 60 seconds and masked audit outcomes without fallback. "
                        + "The nested client/audit interfaces are proposed local adapter contracts, not claims about enterprise "
                        + "Java signatures. The delivery adapter owns idempotency/deadline handling; these are not new remote API fields. ";
        explanation +=
                switch (scenario) {
                    case SECURITY_FAILURE ->
                            "Deliberate unsafe variant: each delivery attempt logs the full account number.";
                    case HALLUCINATED_API ->
                            "Deliberately unsupported screening variant after clarification: Nova claims "
                                    + "FraudClient.verifyTransaction without supplied enterprise evidence. Sentinel must block it.";
                    case TEST_FAILURE ->
                            "Deliberate boundary defect: equality is still skipped although the ticket requires it. "
                                    + "The failing test signal is scripted; no tests ran.";
                    case AMBIGUOUS_REQUIREMENT ->
                            "Scripted rehearsal assumes the human selects outgoing debits, SMS and "
                                    + "skip/audit without consent. Fixtures do not adapt to arbitrary answers.";
                    case PROMPT_INJECTION ->
                            "Business account events use the same rules; no account-type exclusion is introduced. "
                                    + "The legitimate business scope is preserved and the injected instruction is ignored.";
                    default ->
                            "Retail and business account events are supported; no sensitive values are logged.";
                };
        List<String> tests =
                List.of(
                        "Posted ZAR debit above threshold sends one generic SMS",
                        "Equality and smaller debits, credits, unposted events and other currencies do not notify",
                        "Missing SMS consent skips delivery and audits the outcome",
                        "Duplicate transaction events do not trigger another send",
                        "Transient failures retry at most twice using the same delivery key",
                        "Permanent failure and retry exhaustion stop and audit without fallback",
                        "Expired 60-second deadline prevents another attempt",
                        "Business account debits follow the same eligibility and consent rules");
        if (scenario == DemoScenario.TEST_FAILURE) {
            tests =
                    List.of(
                            "Equality must notify (SIMULATED FAILURE: <= still skips equality)",
                            "One cent below skips; one cent above notifies",
                            "Duplicate events do not resend");
        }
        List<String> assumptions =
                scenario == DemoScenario.HALLUCINATED_API
                        ? List.of(
                                "UNSUPPORTED enterprise assumption: FraudClient.verifyTransaction exists")
                        : List.of(
                                "Illustrative in-process deduplication; not a durable delivery guarantee",
                                "Local adapter proposals require integration mapping; generated code/tests are not executed");
        return new CodeChangeSet(
                List.of(new FileChange(SERVICE_PATH, FileChange.ChangeType.CREATE, source)),
                diff(source),
                explanation,
                tests,
                assumptions,
                scenario != DemoScenario.TEST_FAILURE);
    }

    // -------------------------------------------------------------------------
    // Sentinel — Review
    // -------------------------------------------------------------------------

    public ReviewDecision review(DemoScenario scenario) {

        return switch (scenario) {
            case SECURITY_FAILURE ->
                    new ReviewDecision(
                            ReviewOutcome.REJECT,
                            "Sensitive customer information is written to logs. This is a POPIA violation and "
                                    + "data-leakage risk. Changes required before this can proceed.",
                            List.of(
                                    new ReviewFinding(
                                            Severity.CRITICAL,
                                            "COMPLIANCE",
                                            SERVICE_PATH,
                                            "onTransaction: log.info(..., tx.accountNumber())",
                                            "The proposal logs the full account number on delivery attempts, violating "
                                                    + "compliance-policy.md section 2 despite Rhea's recorded conflict.",
                                            "Replace the account number with the masked transaction reference and propose a no-PII logging test.")));

            case HALLUCINATED_API ->
                    new ReviewDecision(
                            ReviewOutcome.REQUEST_CHANGES,
                            "FraudClient.verifyTransaction is unsupported by the supplied enterprise evidence. "
                                    + "Clarification does not make an invented integration valid; changes are required.",
                            List.of(
                                    new ReviewFinding(
                                            Severity.HIGH,
                                            "ARCHITECTURE",
                                            SERVICE_PATH,
                                            "onTransaction: fraud.verifyTransaction(tx.id())",
                                            "The proposal assumes an enterprise screening method absent from the supplied "
                                                    + "contract, with no approved owner, types or failure mapping.",
                                            "Obtain the approved screening contract before implementing it, or follow an "
                                                    + "explicitly authorized scope without screening. Do not invent the API.")));

            case PROMPT_INJECTION ->
                    new ReviewDecision(
                            ReviewOutcome.APPROVE,
                            "Implementation is sound. A prompt-injection attempt in the source ticket was detected "
                                    + "and neutralised upstream; no policy was bypassed.",
                            List.of(
                                    new ReviewFinding(
                                            Severity.LOW,
                                            "SECURITY",
                                            "ticket:UB-4826",
                                            "description",
                                            "Ticket contained an instruction attempting to bypass approval gates.",
                                            "Attempt was ignored and audited. No action required in code.")));

            case TEST_FAILURE ->
                    new ReviewDecision(
                            ReviewOutcome.APPROVE,
                            "Scripted review approves the consent and logging safeguards. The intentional equality defect "
                                    + "is missed by this fixture review; Atlas must enforce the failing test signal.",
                            List.of());
            default ->
                    new ReviewDecision(
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
        return notifierSource(false, false);
    }

    private String insecureServiceSource() {
        return notifierSource(true, false);
    }

    private String hallucinatedApiSource() {
        return notifierSource(false, true);
    }

    private String notifierSource(boolean unsafeLogging, boolean unsupportedScreening) {
        return """
                package com.ubuntu.bank.notification;

                                import java.time.Clock;
                                import java.time.Instant;
                                import java.util.HashSet;
                                import java.util.Set;
                import org.slf4j.Logger;
                import org.slf4j.LoggerFactory;
                                import org.springframework.boot.context.properties.ConfigurationProperties;
                import org.springframework.stereotype.Service;

                @Service
                public class NotificationService {
                                        private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
                    private final NotificationClient client;
                    private final ConsentService consent;
                    private final AuditService audit;
                                        private final Clock clock;
                    private final long thresholdCents;
                                        private final Set<String> handled = new HashSet<>();
                                        %s

                                        public NotificationService(NotificationClient client, ConsentService consent,
                                                        AuditService audit, Clock clock, NotificationProperties props%s) {
                        this.client = client;
                        this.consent = consent;
                        this.audit = audit;
                                                this.clock = clock;
                        this.thresholdCents = props.thresholdCents();
                                                %s
                    }

                                        public synchronized void onTransaction(Transaction tx) {
                                                if (!tx.posted() || !tx.debit() || !"ZAR".equals(tx.currency())
                                                                || tx.amountCents() <= thresholdCents) {
                                                        audit.record("NOT_ELIGIBLE", tx.maskedReference());
                            return;
                        }
                                                if (!handled.add(tx.id())) {
                                                        audit.record("DUPLICATE_SKIPPED", tx.maskedReference());
                                                        return;
                                                }
                        if (!consent.hasConsent(tx.customerId(), Channel.SMS)) {
                                                        audit.record("NO_CONSENT", tx.maskedReference());
                            return;
                        }
                                                Instant deadline = tx.postedAt().plusSeconds(60);
                                                %s
                                                for (int attempt = 0; attempt <= 2; attempt++) {
                                                        if (!clock.instant().isBefore(deadline)) {
                                                                audit.record("DEADLINE_EXCEEDED", tx.maskedReference());
                                                                return;
                                                        }
                                                        audit.record("DELIVERY_ATTEMPT", tx.maskedReference());
                                                        %s
                                                        DeliveryResult result = client.send(tx.customerId(), Channel.SMS,
                                                                        "A transaction above your alert threshold occurred.", tx.id(), deadline);
                                                        audit.record(result.name(), tx.maskedReference());
                                                        if (result == DeliveryResult.DELIVERED || result == DeliveryResult.PERMANENT_FAILURE) {
                                                                return;
                                                        }
                                                }
                                                audit.record("RETRIES_EXHAUSTED", tx.maskedReference());
                    }

                                        @ConfigurationProperties(prefix = "notification")
                                        public record NotificationProperties(long thresholdCents) {}
                                        public record Transaction(String id, String customerId, String currency, boolean posted,
                                                        boolean debit, long amountCents, Instant postedAt, String maskedReference,
                                                        String accountNumber, AccountType accountType) {}
                                        public enum AccountType { RETAIL, BUSINESS }
                                        public enum Channel { SMS }
                                        public enum DeliveryResult { DELIVERED, TRANSIENT_FAILURE, PERMANENT_FAILURE }
                                        public interface ConsentService { boolean hasConsent(String customerId, Channel channel); }
                                        public interface NotificationClient {
                                                DeliveryResult send(String customerId, Channel channel, String message,
                                                                String deliveryKey, Instant deadline);
                                        }
                                        public interface AuditService { void record(String outcome, String maskedReference); }
                }
                                """
                .formatted(
                        unsupportedScreening ? "private final FraudClient fraud;" : "",
                        unsupportedScreening ? ", FraudClient fraud" : "",
                        unsupportedScreening ? "this.fraud = fraud;" : "",
                        unsupportedScreening
                                ? "if (!fraud.verifyTransaction(tx.id()).isClean()) {\n"
                                        + "            audit.record(\"SCREENING_NOT_CLEARED\", tx.maskedReference());\n"
                                        + "            return;\n        }"
                                : "",
                        unsafeLogging
                                ? "log.info(\"Transaction completed for account {}\", tx.accountNumber());"
                                : "");
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
        sb.append("+++ b/").append(SERVICE_PATH).append('\n');

        String[] lines = fileContent.stripTrailing().split("\n", -1);
        sb.append("@@ -0,0 +1,").append(lines.length).append(" @@\n");
        for (String line : lines) {
            sb.append('+').append(line).append('\n');
        }

        return sb.toString();
    }

    public String apiSpecPath() {
        return API_SPEC_PATH;
    }
}
