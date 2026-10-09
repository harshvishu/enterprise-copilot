import { describe, expect, it } from 'vitest';
import { explainEvent, presentationBatch, presentationDelay, presentationPipeline, presentationSections, workshopEntries } from './workshop';

const event = (type, agent = 'System', data = {}, message = 'Recorded application activity') => ({ type, agent, data, message });
const agentRun = (agent, tools) => [
    event('AGENT_STARTED', agent),
    ...tools.map((tool) => event('TOOL_INVOKED', agent, { tool })),
    event('AGENT_THINKING', agent, { step: 'MODEL_CALL' }),
    event('AGENT_COMPLETED', agent),
];
const gates = ['REQUIREMENTS_RESOLVED', 'CODE_PROPOSAL_PRESENT', 'REVIEW_APPROVED', 'NO_CRITICAL_FINDINGS', 'TESTS_PASS', 'HUMAN_APPROVAL'];
// Event order from RequirementsAgent, CodeGenerationAgent, ReviewAgent,
// DeployAgent.decide and PipelineOrchestrator.approve/deploy (baseline NORMAL).
const normal = [
    event('PIPELINE_STARTED'),
    ...agentRun('Rhea', ['compliance', 'architecture', 'git-history', 'api-spec']),
    ...agentRun('Nova', ['architecture', 'api-spec']),
    ...agentRun('Sentinel', ['api-spec', 'compliance', 'architecture']),
    event('AGENT_STARTED', 'Atlas'),
    ...gates.map((gate) => event('GATE_EVALUATED', 'Atlas', { gate, passed: gate !== 'HUMAN_APPROVAL', waiting: gate === 'HUMAN_APPROVAL' })),
    event('APPROVAL_REQUIRED', 'Atlas'),
];
const approved = [
    ...normal,
    event('APPROVAL_GRANTED', 'Human'),
    event('AGENT_THINKING', 'Atlas', { step: 'REVALIDATE' }),
    event('AGENT_COMPLETED', 'Atlas'),
    event('DEPLOYMENT_STARTED', 'Atlas'),
    event('DEPLOYMENT_COMPLETED', 'Atlas'),
    event('PIPELINE_COMPLETED'),
];

describe('source-grounded educational annotations', () => {
    it('keeps every real event in order, without synthesizing activity', () => {
        const entries = workshopEntries(approved, 'DEMO');
        expect(entries.map((entry) => entry.event)).toEqual(approved);
        expect(entries.every((entry) => entry.explanation)).toBe(true);
        for (const entry of entries.filter((entry) => entry.meaningful)) {
            expect(entry.explanation).toMatchObject({
                component: expect.any(String), what: expect.any(String), why: expect.any(String),
            });
        }
        expect(explainEvent(event('UNKNOWN', 'Unknown'), 'DEMO')).toBeNull();
    });
    it('distinguishes scripted responses from actual LIVE ChatClient calls', () => {
        const request = event('AGENT_THINKING', 'Rhea', { step: 'MODEL_CALL' });
        expect(explainEvent(request, 'DEMO').what).toContain('DemoAgentAiClient');
        expect(explainEvent(request, 'DEMO').springAi).toBe(explainEvent(request, 'LIVE').springAi);
        expect(explainEvent(request, 'DEMO').springAi).toContain('ChatClient.builder(ChatModel)');
        expect(explainEvent(request, 'DEMO').springAi).not.toMatch(/\b(DEMO|LIVE)\b/);
        expect(explainEvent(request, 'LIVE').what).toContain('SpringAiAgentAiClient');
        expect(explainEvent(request, 'LIVE').springAi).toContain('call().entity(responseType)');
        const entries = workshopEntries([
            request, event('AI_FALLBACK'), event('AGENT_THINKING', 'Nova', { step: 'MODEL_CALL' }),
        ], 'LIVE');
        expect(entries[0].explanation.what).toContain('SpringAiAgentAiClient');
        expect(entries[2].explanation.what).toContain('DemoAgentAiClient');
    });
    it('describes reference retrieval as direct Java lookups, without invented RAG or tool callbacks', () => {
        for (const tool of ['compliance', 'architecture', 'git-history', 'api-spec', 'confluence']) {
            const explanation = explainEvent(event('TOOL_INVOKED', 'Rhea', { tool }), 'LIVE');
            expect(explanation.component).toContain('ToolResources.read');
            expect(explanation.springAi).toContain('No vector search');
        }
    });
    it('does not introduce Confluence activity into a baseline run', () => {
        expect(workshopEntries(normal, 'DEMO').some((entry) => entry.event.agent === 'Confluence')).toBe(false);
        const entries = workshopEntries([
            event('PIPELINE_STARTED'), event('AGENT_STARTED', 'Confluence'),
            event('TOOL_INVOKED', 'Confluence', { tool: 'confluence' }), event('AGENT_COMPLETED', 'Confluence'),
            ...normal.slice(1),
        ], 'DEMO');
        expect(entries[1].explanation.component).toContain('ConfluenceAgent.gatherContext');
        expect(entries[3].explanation.what).toContain('additional context');
    });
    it.each(gates)('explains the actual %s gate and its result', (gate) => {
        const failed = explainEvent(event('GATE_EVALUATED', 'Atlas', { gate, passed: false }), 'LIVE');
        expect(failed.component).toContain('DeployAgent.decide');
        expect(failed.why).toContain('Approval cannot bypass');
        const waiting = explainEvent(event('GATE_EVALUATED', 'Atlas', { gate, waiting: true }), 'DEMO');
        expect(waiting.why).toContain('waiting is not a passing result');
    });
    it('never presents test signals or deployment transitions as real compilation/test/deployment', () => {
        expect(explainEvent(event('AGENT_COMPLETED', 'Nova'), 'DEMO').why).toContain('not evidence of compiling');
        expect(explainEvent(event('GATE_EVALUATED', 'Atlas', { gate: 'TESTS_PASS' }), 'LIVE').what).toContain('generated tests are not executed');
        for (const mode of ['DEMO', 'LIVE']) {
            expect(explainEvent(event('DEPLOYMENT_STARTED', 'Atlas'), mode).why).toContain('does not compile');
            expect(explainEvent(event('PIPELINE_COMPLETED'), mode).why).toContain('not evidence of a production deployment');
        }
    });
    it('preserves clarification, review feedback, rejection and failure boundaries without inventing completion', () => {
        for (const agent of ['Rhea', 'Sentinel', 'Atlas']) {
            const entries = workshopEntries([event('GATE_BLOCKED', agent, {}, 'Paused at a real boundary')], 'DEMO');
            expect(entries).toHaveLength(1);
            expect(entries[0].explanation.what).toBe('Paused at a real boundary');
            expect(entries[0].meaningful).toBe(true);
        }
        expect(explainEvent(event('APPROVAL_REJECTED', 'Human'), 'DEMO').what).toContain('BLOCKED');
        expect(explainEvent(event('AGENT_COMPLETED', 'Human'), 'DEMO').component).toContain('clarify / reviewFeedback');
        const failed = workshopEntries([event('AGENT_STARTED', 'Confluence'), event('PIPELINE_FAILED')], 'DEMO');
        expect(failed.map((entry) => entry.event.type)).not.toContain('AGENT_COMPLETED');
    });
});

describe('presentation-only pacing', () => {
    it('groups reference/gate details and targets 45–75 seconds at the default pace', () => {
        const entries = workshopEntries(approved, 'DEMO');
        const steps = entries.filter((entry) => entry.meaningful);
        expect(steps).toHaveLength(19);
        // First step is immediate; only the gaps between recorded steps are paced.
        const duration = (steps.length - 1) * presentationDelay(3.5);
        expect(duration).toBe(63000);
        expect(duration).toBeGreaterThanOrEqual(45000);
        expect(duration).toBeLessThanOrEqual(75000);
        expect(workshopEntries(normal, 'DEMO').filter((entry) => entry.meaningful)).toHaveLength(16);
    });
    it('retains all previous steps while advancing through each next meaningful boundary', () => {
        const entries = workshopEntries(approved, 'DEMO');
        let cursor = 0;
        const presented = [];
        while (cursor < entries.length) {
            const next = presentationBatch(entries, cursor);
            const batch = entries.slice(cursor, next);
            expect(batch.filter((entry) => entry.meaningful)).toHaveLength(1);
            presented.push(...batch);
            cursor = next;
        }
        expect(presented.map((entry) => entry.event)).toEqual(approved);
    });
    it('paces a fresh reference boundary on revision instead of dropping the second agent attempt', () => {
        const entries = workshopEntries([
            ...agentRun('Nova', ['architecture', 'api-spec']),
            event('GATE_BLOCKED', 'Sentinel'), event('AGENT_COMPLETED', 'Human'),
            ...agentRun('Nova', ['architecture', 'api-spec']),
        ], 'DEMO');
        expect(entries.filter((entry) => entry.meaningful && entry.event.type === 'TOOL_INVOKED')).toHaveLength(2);
        expect(entries.filter((entry) => entry.meaningful).map((entry) => entry.step)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });
    it('supports normal speed and 3–10 second presentation pacing', () => {
        expect(presentationDelay(3)).toBe(3000);
        expect(presentationDelay(5)).toBe(5000);
        expect(presentationDelay(0)).toBe(0);
        expect(presentationDelay(10)).toBe(10000);
        expect(presentationDelay(12)).toBe(10000);
        expect(presentationDelay(-1)).toBe(3000);
        expect(presentationDelay('invalid')).toBe(3500);
    });
});

describe('merged agent output presentation', () => {
    const snapshot = {
        id: 'run', state: 'WAITING_FOR_APPROVAL', approvalState: 'PENDING',
        requirementAnalysis: { summary: 'Approved requirements', clarificationQuestions: [] },
        codeChangeSet: { explanation: 'Proposed change' },
        reviewDecision: { outcome: 'APPROVE' },
        deploymentDecision: { allowed: false },
    };
    it('keeps results hidden before any events arrive, including on replay', () => {
        expect(presentationPipeline(snapshot, [], 0)).toMatchObject({
            state: 'CREATED', requirementAnalysis: null, codeChangeSet: null, reviewDecision: null,
            deploymentDecision: null,
        });
    });
    it('reveals each typed result only at its presented completion boundary', () => {
        for (const [agent, field] of [['Rhea', 'requirementAnalysis'], ['Nova', 'codeChangeSet'], ['Sentinel', 'reviewDecision']]) {
            const index = normal.findIndex((entry) => entry.agent === agent && entry.type === 'AGENT_COMPLETED');
            expect(presentationPipeline(snapshot, normal, index)[field]).toBeNull();
            expect(presentationPipeline(snapshot, normal, index + 1)[field]).toBe(snapshot[field]);
        }
    });
    it('does not show Nova or Sentinel results while requirements are being presented', () => {
        const completed = normal.findIndex((entry) => entry.agent === 'Rhea' && entry.type === 'AGENT_COMPLETED');
        const projected = presentationPipeline(snapshot, normal, completed + 1);
        expect(projected).toMatchObject({ state: 'REQUIREMENTS_READY', codeChangeSet: null, reviewDecision: null, deploymentDecision: null });
        expect(snapshot.codeChangeSet).not.toBeNull();
        expect(snapshot.state).toBe('WAITING_FOR_APPROVAL');
    });
    it('does not expose artifacts that polling receives before their SSE completion', () => {
        const request = normal.findIndex((entry) => entry.agent === 'Nova' && entry.data?.step === 'MODEL_CALL');
        const received = normal.slice(0, request + 1);
        expect(presentationPipeline(snapshot, received, received.length).codeChangeSet).toBeNull();
    });
    it('withholds a newer revision even when an older completion is visible', () => {
        const revised = [...normal, event('AGENT_COMPLETED', 'Human'), ...agentRun('Nova', ['architecture'])];
        const newer = { ...snapshot, codeChangeSet: { explanation: 'Revised change' }, reviewDecision: null };
        expect(presentationPipeline(newer, revised, normal.length).codeChangeSet).toBeNull();
        expect(presentationPipeline(newer, revised, revised.length).codeChangeSet).toBe(newer.codeChangeSet);
    });
    it('keeps new-attempt artifacts hidden after a revision starts', () => {
        const revising = [...normal, event('AGENT_STARTED', 'Nova')];
        expect(presentationPipeline(snapshot, revising, revising.length).codeChangeSet).toBeNull();
    });
    it('presents deterministic approval and simulated deployment at their real boundaries', () => {
        const deployed = { ...snapshot, state: 'DEPLOYED', approvalState: 'APPROVED' };
        const approval = approved.findIndex((entry) => entry.type === 'APPROVAL_GRANTED');
        expect(presentationPipeline(deployed, approved, approval)).toMatchObject({ state: 'WAITING_FOR_APPROVAL', approvalState: 'PENDING' });
        expect(presentationPipeline(deployed, approved, approved.length)).toMatchObject({ state: 'DEPLOYED', approvalState: 'APPROVED' });
    });
    it('presents clarification, review-feedback and failed gates without later successes', () => {
        for (const [agent, state] of [['Rhea', 'REQUIREMENTS_READY'], ['Sentinel', 'WAITING_FOR_REVIEW_FEEDBACK'], ['Atlas', 'BLOCKED']]) {
            const blocked = [event('PIPELINE_STARTED'), event('GATE_BLOCKED', agent)];
            expect(presentationPipeline(snapshot, blocked, blocked.length).state).toBe(state);
        }
        const failed = [event('PIPELINE_STARTED'), event('PIPELINE_FAILED')];
        expect(presentationPipeline({ ...snapshot, state: 'FAILED' }, failed, failed.length).state).toBe('FAILED');
    });
    it('routes orchestration, optional Confluence and human input into existing sections', () => {
        const input = [event('PIPELINE_STARTED'), event('AGENT_STARTED', 'Confluence'), event('AGENT_STARTED', 'Rhea'),
            event('GATE_BLOCKED', 'Rhea'), event('AGENT_COMPLETED', 'Human'), event('AGENT_STARTED', 'Sentinel'),
            event('GATE_BLOCKED', 'Sentinel'), event('AGENT_COMPLETED', 'Human'), event('APPROVAL_GRANTED', 'Human'), event('PIPELINE_COMPLETED')];
        const routed = presentationSections(workshopEntries(input, 'DEMO'));
        expect(routed.map((entry) => entry.section)).toEqual(['Rhea', 'Rhea', 'Rhea', 'Rhea', 'Rhea', 'Sentinel', 'Sentinel', 'Nova', 'Atlas', 'Atlas']);
        expect(routed.map((entry) => entry.event)).toEqual(input);
        expect(routed.map((entry) => entry.index)).toEqual(input.map((_, index) => index));
    });
});
