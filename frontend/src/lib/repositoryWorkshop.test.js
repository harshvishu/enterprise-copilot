import { expect, it } from 'vitest';
import { explainEvent, presentationPipeline, workshopEntries, presentationDelay } from './workshop';

it('paces real apply, diff and pytest boundaries separately and labels actual evidence', () => {
    const events = ['APPLY_FILES', 'GIT_DIFF', 'PYTEST'].map(step => ({ type: 'TOOL_INVOKED', agent: 'Nova', data: { repository: true, step } }));
    const entries = workshopEntries(events, 'LIVE');
    expect(entries.map(entry => entry.meaningful)).toEqual([true, true, true]);
    expect(entries[1].explanation.component).toContain('LocalRepositoryTool.diff');
    expect(entries[2].explanation.what).toContain('pytest');
    expect(presentationDelay(10)).toBe(10000);
    expect(presentationDelay(0)).toBe(0);
});

it('keeps real test evidence behind the paced Nova result and merge behind its real event', () => {
    const events = [
        { type: 'AGENT_STARTED', agent: 'Nova' },
        { type: 'AGENT_COMPLETED', agent: 'Nova', data: { repository: true } },
        { type: 'APPROVAL_GRANTED', agent: 'Human' },
        { type: 'AGENT_THINKING', agent: 'Atlas', data: { repository: true, step: 'LOCAL_MERGE' } },
    ];
    const pipeline = { codeChangeSet: { unifiedDiff: 'actual diff' }, repositoryExecution: { candidateCommit: 'candidate', testRun: { exitCode: 0 }, approvedCommit: 'candidate', mergedCommit: 'candidate' } };
    expect(presentationPipeline(pipeline, events, 1).repositoryExecution.testRun).toBeNull();
    expect(presentationPipeline(pipeline, events, 2).repositoryExecution.testRun.exitCode).toBe(0);
    expect(presentationPipeline(pipeline, events, 3).repositoryExecution.mergedCommit).toBeNull();
    expect(presentationPipeline(pipeline, events, 4).repositoryExecution.mergedCommit).toBe('candidate');
});

it('explains the actual Atlas test gate without claiming a simulated signal', () => {
    const detail = explainEvent({ type: 'GATE_EVALUATED', agent: 'Atlas', data: { gate: 'TESTS_PASS', repository: true, passed: true } }, 'LIVE');
    expect(detail.what).toContain('server-recorded pytest');
    expect(detail.what).not.toContain('model-provided');
});
