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
    void securityFailureIsRejectedWithCriticalFinding() {
        var review =
                responses.review(
                        DemoScenario.SECURITY_FAILURE);
        assertThat(review.outcome())
                .isEqualTo(
                        ReviewOutcome.REJECT);
        assertThat(review.hasCriticalFindings())
                .isTrue();
        assertThat(
                review.findings()
                        .get(0)
                        .severity())
                .isEqualTo(
                        Severity.CRITICAL);
    }

    @Test
    void securityFailureCodeLogsAccountNumber() {
        var code =
                responses.code(
                        DemoScenario.SECURITY_FAILURE);
        assertThat(
                code.unifiedDiff())
                .contains("account {}");
    }

    @Test
    void ambiguousRequirementRaisesClarificationQuestions() {
        var analysis =
                responses.requirements(
                        DemoScenario.AMBIGUOUS_REQUIREMENT);
        assertThat(
                analysis.needsClarification())
                .isTrue();
        assertThat(
                analysis.clarificationQuestions())
                .isNotEmpty();
    }

    @Test
    void testFailureScenarioMarksTestsFailing() {
        var code =
                responses.code(
                        DemoScenario.TEST_FAILURE);
        assertThat(
                code.testsPass())
                .isFalse();
    }

    @Test
    void hallucinatedApiIsFlagged() {
        var review =
                responses.review(
                        DemoScenario.HALLUCINATED_API);
        assertThat(review.passed())
                .isFalse();
        assertThat(
                review.findings()
                        .get(0)
                        .category())
                .isEqualTo("ARCHITECTURE");
    }

    @Test
    void normalScenarioApprovesAndIsReady() {

        assertThat(
                responses.review(DemoScenario.NORMAL)
                        .passed())
                .isTrue();
        assertThat(
                responses.requirements(DemoScenario.NORMAL)
                        .needsClarification())
                .isFalse();
        assertThat(
                responses.code(DemoScenario.NORMAL)
                        .testsPass())
                .isTrue();
    }

    @Test
    void promptInjectionIsNeutralisedNotObeyed() {
        var analysis =
                responses.requirements(
                        DemoScenario.PROMPT_INJECTION);
        assertThat(
                analysis.needsClarification())
                .isFalse();
        assertThat(
                analysis.assumptions()
                        .toString()
                        .toLowerCase())
                .contains("disregarded");
    }
}