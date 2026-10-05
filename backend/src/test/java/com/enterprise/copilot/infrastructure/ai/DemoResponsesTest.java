package com.enterprise.copilot.infrastructure.ai;

import com.enterprise.copilot.domain.DemoScenario;
import com.enterprise.copilot.domain.ReviewOutcome;
import com.enterprise.copilot.domain.Severity;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Deterministic AI provider must produce the canonical, reproducible outcomes for each scenario.
 */
class DemoResponsesTest {

    private final DemoResponses responses = new DemoResponses();

    @Test
        void securityFeedbackRequiresRevisionBeforeItPasses() {
        var review = responses.review(DemoScenario.SECURITY_FAILURE);
        assertThat(review.outcome()).isEqualTo(ReviewOutcome.REQUEST_CHANGES);
        assertThat(review.hasCriticalFindings()).isFalse();
        assertThat(review.findings().get(0).severity()).isEqualTo(Severity.HIGH);
        assertThat(responses.review(DemoScenario.SECURITY_FAILURE, true).passed()).isTrue();
        assertThat(responses.code(DemoScenario.SECURITY_FAILURE, true).unifiedDiff())
                .doesNotContain("account {}");
    }

    @Test
    void securityFailureCodeLogsAccountNumber() {
        var code = responses.code(DemoScenario.SECURITY_FAILURE);
        assertThat(code.unifiedDiff()).contains("account {}");
    }

    @Test
    void ambiguousRequirementRaisesClarificationQuestions() {
        var analysis = responses.requirements(DemoScenario.AMBIGUOUS_REQUIREMENT);
        assertThat(analysis.needsClarification()).isTrue();
        assertThat(analysis.clarificationQuestions()).isNotEmpty();
    }

    @Test
    void testFailureScenarioMarksTestsFailing() {
        var code = responses.code(DemoScenario.TEST_FAILURE);
        assertThat(code.testsPass()).isFalse();
    }

    @Test
    void hallucinatedApiIsFlagged() {
        var review = responses.review(DemoScenario.HALLUCINATED_API);
        assertThat(review.passed()).isFalse();
        assertThat(review.findings().get(0).category()).isEqualTo("ARCHITECTURE");
    }

    @Test
    void normalScenarioApprovesAndIsReady() {

        assertThat(responses.review(DemoScenario.NORMAL).passed()).isTrue();
        assertThat(responses.requirements(DemoScenario.NORMAL).needsClarification()).isFalse();
        assertThat(responses.code(DemoScenario.NORMAL).testsPass()).isTrue();
    }

    @Test
    void promptInjectionIsNeutralisedNotObeyed() {
        var analysis = responses.requirements(DemoScenario.PROMPT_INJECTION);
        assertThat(analysis.needsClarification()).isFalse();
        assertThat(analysis.assumptions().toString().toLowerCase()).contains("disregarded");
    }

    @Test
    void fixtureRequirementsMatchCatalogDecisionsWithoutInventedConsent() {
        var normal = responses.requirements(DemoScenario.NORMAL);
        assertThat(normal.summary())
                .contains("SMS", "R50,000", "consent");
        assertThat(normal.assumptions()).isEmpty();
        var ambiguous = responses.requirements(DemoScenario.AMBIGUOUS_REQUIREMENT);
        assertThat(ambiguous.clarificationQuestions())
                .containsExactly("Which notification channel should we use?");
        var unsafe = responses.requirements(DemoScenario.SECURITY_FAILURE);
        assertThat(unsafe.needsClarification()).isFalse();
        assertThat(unsafe.summary()).contains("masked references", "not account numbers");
        assertThat(responses.requirements(DemoScenario.TEST_FAILURE).summary())
                .contains("Equality now qualifies");
        assertThat(responses.requirements(DemoScenario.HALLUCINATED_API).needsClarification())
                .isFalse();
        assertThat(responses.requirements(DemoScenario.HALLUCINATED_API).clarificationQuestions())
                .isEmpty();
        assertThat(responses.requirements(DemoScenario.PROMPT_INJECTION).summary())
                .contains("business account");
        assertThat(responses.review(DemoScenario.PROMPT_INJECTION).findings().getFirst().file())
                .isEqualTo("ticket:UB-4826");
    }

    @Test
    void approvedProposalContainsMaterialBehaviourAndConsistentDiff() {
        var code = responses.code(DemoScenario.NORMAL);
        assertThat(code.files().getFirst().content())
                .contains(
                        "!tx.posted()",
                        "!tx.debit()",
                        "\"ZAR\"",
                        "tx.amountCents() <= thresholdCents",
                        "ConsentService",
                        "Channel.SMS",
                        "handled.add(tx.id())",
                        "plusSeconds(60)",
                        "attempt <= 2",
                        "PERMANENT_FAILURE",
                        "RETRIES_EXHAUSTED",
                        "maskedReference",
                        "AccountType { RETAIL, BUSINESS }");
        assertThat(code.unifiedDiff()).contains("@@ -0,0 +1,");
        assertThat(code.files().getFirst().content().lines().map(line -> "+" + line).toList())
                .allSatisfy(line -> assertThat(code.unifiedDiff()).contains(line + "\n"));
        assertThat(code.tests()).hasSizeGreaterThanOrEqualTo(7);
        assertThat(code.hasPassingTestSignal()).isTrue();
        assertThat(code.files().getFirst().content())
                .doesNotContain("log.info(\"Transaction completed for account");
        assertThat(responses.code(DemoScenario.TEST_FAILURE).files().getFirst().content())
                .contains("tx.amountCents() <= thresholdCents");
        assertThat(responses.review(DemoScenario.HALLUCINATED_API).findings().getFirst().severity())
                .isEqualTo(Severity.HIGH);
    }

    @Test
    void presenterScenariosUseTheirMatchingCatalogTicket() {
        var catalog = new com.enterprise.copilot.demo.DemoTickets();
        for (var issue : catalog.issues()) {
            assertThat(catalog.ubuntuBankTicket(issue.scenario())).isEqualTo(issue.ticket());
        }
        assertThat(catalog.ubuntuBankTicket(DemoScenario.MISSING_APPROVAL).key())
                .isEqualTo("UB-4821");
    }
}
