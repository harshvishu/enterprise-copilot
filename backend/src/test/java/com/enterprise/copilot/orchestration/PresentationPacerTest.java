package com.enterprise.copilot.orchestration;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PresentationPacerTest {

    @Test
    void zeroDelaysDoNotPause() {
        PresentationPacer pacer = new PresentationPacer(0, 0);
        long start = System.nanoTime();

        pacer.afterTransition();
        pacer.afterActivity();

        assertThat(System.nanoTime() - start).isLessThan(50_000_000L);
    }

    @Test
    void activityDelayIsApplied() {
        PresentationPacer pacer = new PresentationPacer(0, 30);
        long start = System.nanoTime();

        pacer.afterActivity();

        assertThat(System.nanoTime() - start).isGreaterThanOrEqualTo(30_000_000L);
    }
}
