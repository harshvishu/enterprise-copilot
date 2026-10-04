import { describe, expect, it } from 'vitest';
import {
    confluenceStageStatus,
    hasPassingTestSignal,
    pipelineAttention,
    stageStatuses,
} from './pipeline';

describe('proposed test signal', () => {
    it.each(
        [undefined, null, [], [''], [' '], [null], ['checks consent', ''], 'not an array'].map(
            (tests) => ({ tests }),
        ),
    )('does not pass with missing or blank proposed tests: %j', ({ tests }) =>
        expect(hasPassingTestSignal({ tests, testsPass: true })).toBe(false),
    );
    it('requires both proposed tests and a passing signal', () => {
        expect(hasPassingTestSignal({ tests: ['Consent skips delivery'], testsPass: true })).toBe(
            true,
        );
        expect(hasPassingTestSignal({ tests: ['Consent skips delivery'], testsPass: false })).toBe(
            false,
        );
        expect(hasPassingTestSignal(undefined)).toBe(false);
    });
});

describe('blocked terminal next steps', () => {
    it.each(['REQUEST_CHANGES', 'REJECT'])('explains a %s review block', (outcome) => {
        const attention = pipelineAttention({
            state: 'BLOCKED',
            reviewDecision: { outcome, findings: [] },
        });
        expect(attention.description).toContain('Atlas blocks deployment');
        expect(attention.nextStep).toBe(
            'Address the implementation findings and start a new pipeline run.',
        );
        expect(attention.action).toBe('View findings');
    });
    it.each([[], ['checks threshold']].map((tests) => ({ tests })))(
        'explains an invalid or failing test signal',
        ({ tests }) => {
            const attention = pipelineAttention({
                state: 'BLOCKED',
                reviewDecision: { outcome: 'APPROVE', findings: [] },
                codeChangeSet: { tests, testsPass: false },
                deploymentDecision: { blockingReasons: ['Test signal blocked'] },
            });
            expect(attention.description).toBe('Test signal blocked');
            expect(attention.nextStep).toContain('Correct the proposed implementation/tests');
        },
    );
    it('distinguishes human rejection from a technical gate failure', () => {
        const attention = pipelineAttention({ state: 'BLOCKED', approvalState: 'REJECTED' });
        expect(attention.title).toBe('Deployment rejected by a human');
        expect(attention.nextStep).toContain('Discuss the rejection with the approver');
    });
    it('does not prescribe another run during clarification or approval', () => {
        expect(
            pipelineAttention({
                state: 'REQUIREMENTS_READY',
                requirementAnalysis: { clarificationQuestions: ['Channel?'] },
            }).nextStep,
        ).toBeUndefined();
        expect(pipelineAttention({ state: 'WAITING_FOR_APPROVAL' }).nextStep).toBeUndefined();
    });
});

describe('optional Confluence stage', () => {
    const started = { agent: 'Confluence', type: 'AGENT_STARTED' };
    const completed = { agent: 'Confluence', type: 'AGENT_COMPLETED' };

    it('keeps the baseline stages without Confluence activity', () => {
        expect(stageStatuses({ state: 'ANALYZING_REQUIREMENTS' })).toEqual([
            'completed',
            'running',
            'pending',
            'pending',
            'pending',
        ]);
        expect(stageStatuses({ state: 'DEPLOYED' })).toHaveLength(5);
        expect(
            confluenceStageStatus([
                { agent: 'Rhea', type: 'TOOL_INVOKED', data: { tool: 'confluence' } },
            ]),
        ).toBeNull();
    });

    it('inserts the running stage before Rhea only after activity arrives', () => {
        expect(stageStatuses({ state: 'ANALYZING_REQUIREMENTS' }, [started])).toEqual([
            'completed',
            'running',
            'pending',
            'pending',
            'pending',
            'pending',
        ]);
        expect(stageStatuses(null, [started])).toHaveLength(6);
    });

    it('shows completed context independently of downstream review or approval', () => {
        expect(stageStatuses({ state: 'ANALYZING_REQUIREMENTS' }, [started, completed])).toEqual([
            'completed',
            'completed',
            'running',
            'pending',
            'pending',
            'pending',
        ]);
        expect(
            stageStatuses({ state: 'BLOCKED', reviewDecision: { outcome: 'REQUEST_CHANGES' } }, [
                started,
                completed,
            ]),
        ).toEqual(['completed', 'completed', 'pending', 'pending', 'rejected', 'blocked']);
    });

    it('attributes a context failure to Confluence, not Rhea', () => {
        expect(stageStatuses({ state: 'FAILED' }, [started, { type: 'PIPELINE_FAILED' }])).toEqual([
            'completed',
            'failed',
            'pending',
            'pending',
            'pending',
            'pending',
        ]);
        expect(
            stageStatuses({ state: 'FAILED' }, [started, completed, { type: 'PIPELINE_FAILED' }]),
        ).toEqual(['completed', 'completed', 'failed', 'pending', 'pending', 'pending']);
    });

    it('uses only the current attempt and resets when the selected run has no activity', () => {
        expect(confluenceStageStatus([started, completed, started])).toBe('running');
        expect(confluenceStageStatus([started, completed, { type: 'PIPELINE_FAILED' }])).toBe(
            'completed',
        );
        expect(stageStatuses({ state: 'CREATED' }, [])).toHaveLength(5);
    });
});
