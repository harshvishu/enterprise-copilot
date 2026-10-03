import { describe, expect, it } from 'vitest';
import { hasPassingTestSignal, pipelineAttention } from './pipeline';

describe('proposed test signal', () => {
    it.each([undefined, null, [], [''], [' '], [null], ['checks consent', ''], 'not an array']
        .map((tests) => ({ tests })))(
        'does not pass with missing or blank proposed tests: %j',
        ({ tests }) => expect(hasPassingTestSignal({ tests, testsPass: true })).toBe(false),
    );
    it('requires both proposed tests and a passing signal', () => {
        expect(hasPassingTestSignal({ tests: ['Consent skips delivery'], testsPass: true })).toBe(true);
        expect(hasPassingTestSignal({ tests: ['Consent skips delivery'], testsPass: false })).toBe(false);
        expect(hasPassingTestSignal(undefined)).toBe(false);
    });
});

describe('blocked terminal next steps', () => {
    it.each(['REQUEST_CHANGES', 'REJECT'])('explains a %s review block', (outcome) => {
        const attention = pipelineAttention({ state: 'BLOCKED', reviewDecision: { outcome, findings: [] } });
        expect(attention.description).toContain('Atlas blocks deployment');
        expect(attention.nextStep).toBe('Address the implementation findings and start a new pipeline run.');
        expect(attention.action).toBe('View findings');
    });
    it.each([[], ['checks threshold']].map((tests) => ({ tests })))('explains an invalid or failing test signal', ({ tests }) => {
        const attention = pipelineAttention({ state: 'BLOCKED',
            reviewDecision: { outcome: 'APPROVE', findings: [] },
            codeChangeSet: { tests, testsPass: false },
            deploymentDecision: { blockingReasons: ['Test signal blocked'] } });
        expect(attention.description).toBe('Test signal blocked');
        expect(attention.nextStep).toContain('Correct the proposed implementation/tests');
    });
    it('distinguishes human rejection from a technical gate failure', () => {
        const attention = pipelineAttention({ state: 'BLOCKED', approvalState: 'REJECTED' });
        expect(attention.title).toBe('Deployment rejected by a human');
        expect(attention.nextStep).toContain('Discuss the rejection with the approver');
    });
    it('does not prescribe another run during clarification or approval', () => {
        expect(pipelineAttention({ state: 'REQUIREMENTS_READY',
            requirementAnalysis: { clarificationQuestions: ['Channel?'] } }).nextStep).toBeUndefined();
        expect(pipelineAttention({ state: 'WAITING_FOR_APPROVAL' }).nextStep).toBeUndefined();
    });
});