export const ACTIVE_STATES = [
    'CREATED',
    'ANALYZING_REQUIREMENTS',
    'GENERATING_CODE',
    'CODE_READY',
    'REVIEWING',
    'REVIEW_PASSED',
    'REVIEW_FAILED',
    'DEPLOYING',
];
export const TERMINAL_STATES = ['DEPLOYED', 'BLOCKED', 'FAILED'];

export const GATE_LABELS = {
    REQUIREMENTS_RESOLVED: 'Requirements resolved',
    CODE_PROPOSAL_PRESENT: 'Code proposal available',
    REVIEW_APPROVED: 'Sentinel review approved',
    NO_CRITICAL_FINDINGS: 'No critical findings',
    TESTS_PASS: 'Proposed test signal',
    HUMAN_APPROVAL: 'Human approval',
};

export function hasProposedTests(proposal) {
    return Boolean(
        Array.isArray(proposal?.tests) &&
            proposal.tests.length &&
            proposal.tests.every((test) => typeof test === 'string' && test.trim()),
    );
}

export function hasPassingTestSignal(proposal) {
    return hasProposedTests(proposal) && proposal.testsPass === true;
}

export function modelLabel(status) {
    if (status?.aiMode === 'DEMO') return 'Deterministic fixture';
    if (status?.provider === 'OPENAI') return 'Model call · OpenAI';
    if (status?.provider === 'OLLAMA') return 'Model call · Ollama';
    return 'Model call';
}

// Steps since the agent's latest start; the last step is current until the agent completes or the pipeline fails.
export function agentProgress(events = [], agent) {
    let start = -1;
    events.forEach((event, index) => {
        if (event.agent === agent && event.type === 'AGENT_STARTED') start = index;
    });
    const result = { steps: [], completed: false, failed: false, failure: '' };
    if (start < 0) return result;
    for (const event of events.slice(start + 1)) {
        if (event.type === 'PIPELINE_FAILED') {
            result.failed = true;
            result.failure = event.message;
        } else if (event.agent === agent && event.type === 'AGENT_COMPLETED') {
            result.completed = true;
        } else if (event.agent === agent && event.data?.step) {
            if (!result.steps.some((step) => step.key === event.data.step)) {
                result.steps.push({ key: event.data.step, label: event.message });
            }
        }
    }
    result.steps = result.steps.map((step, index) => ({
        ...step,
        status:
            result.completed || index < result.steps.length - 1
                ? 'done'
                : result.failed
                  ? 'failed'
                  : 'current',
    }));
    result.failed = result.failed && !result.completed && result.steps.length > 0;
    return result;
}

export function gateResults(events = []) {
    return events
        .filter((event) => event.type === 'GATE_EVALUATED')
        .reduce((gates, event) => ({ ...gates, [event.data.gate]: event.data }), {});
}

export function revalidation(events = []) {
    const granted = events.findIndex((event) => event.type === 'APPROVAL_GRANTED');
    if (granted < 0) return null;
    const after = events.slice(granted + 1).filter((event) => event.agent === 'Atlas');
    if (after.some((event) => event.type === 'AGENT_COMPLETED')) return 'passed';
    if (after.some((event) => event.type === 'GATE_BLOCKED')) return 'failed';
    return 'running';
}

export function readable(value = '') {
    return value
        .toLowerCase()
        .replaceAll('_', ' ')
        .replace(/^./, (first) => first.toUpperCase())
        .replace(/\bapi\b/gi, 'API');
}

export function severityCounts(review) {
    return (review?.findings || []).reduce((counts, finding) => {
        counts[finding.severity] = (counts[finding.severity] || 0) + 1;
        return counts;
    }, {});
}

export function confluenceStageStatus(events = []) {
    const activityTypes = ['AGENT_STARTED', 'AGENT_THINKING', 'TOOL_INVOKED', 'AGENT_COMPLETED'];
    const firstActivity = events.findIndex(
        (event) => event.agent === 'Confluence' && activityTypes.includes(event.type),
    );
    if (firstActivity < 0) return null;
    const latestStart = events.findLastIndex(
        (event) => event.agent === 'Confluence' && event.type === 'AGENT_STARTED',
    );
    const current = events.slice(latestStart < 0 ? firstActivity : latestStart);
    if (current.some((event) => event.agent === 'Confluence' && event.type === 'AGENT_COMPLETED'))
        return 'completed';
    if (current.some((event) => event.type === 'PIPELINE_FAILED')) return 'failed';
    return 'running';
}

function addConfluenceStage(stages, events) {
    const status = confluenceStageStatus(events);
    if (status) {
        stages.splice(1, 0, status);
        if (status !== 'completed') stages[2] = 'pending';
    }
    return stages;
}

export function stageStatuses(pipeline, events = []) {
    const stages = ['pending', 'pending', 'pending', 'pending', 'pending'];
    if (!pipeline) return addConfluenceStage(stages, events);
    stages[0] = 'completed';
    if (pipeline.requirementAnalysis) stages[1] = 'completed';
    if (pipeline.codeChangeSet) stages[2] = 'completed';
    if (pipeline.reviewDecision)
        stages[3] = pipeline.reviewDecision.outcome === 'APPROVE' ? 'completed' : 'rejected';
    const state = pipeline.state;
    if (state === 'ANALYZING_REQUIREMENTS') stages[1] = 'running';
    if (
        state === 'REQUIREMENTS_READY' &&
        pipeline.requirementAnalysis?.clarificationQuestions?.length
    )
        stages[1] = 'waiting';
    if (state === 'GENERATING_CODE') stages[2] = 'running';
    if (state === 'REVIEWING') stages[3] = 'running';
    if (['REVIEW_PASSED', 'REVIEW_FAILED', 'DEPLOYING'].includes(state)) stages[4] = 'running';
    if (state === 'WAITING_FOR_APPROVAL') stages[4] = 'waiting';
    if (state === 'BLOCKED') stages[4] = 'blocked';
    if (state === 'DEPLOYED') stages.fill('completed');
    if (state === 'FAILED') {
        const failedStage = !pipeline.requirementAnalysis
            ? 1
            : !pipeline.codeChangeSet
              ? 2
              : !pipeline.reviewDecision
                ? 3
                : 4;
        stages[failedStage] = 'failed';
    }
    return addConfluenceStage(stages, events);
}

export function pipelineAttention(pipeline, events = []) {
    if (!pipeline) return null;
    const counts = severityCounts(pipeline.reviewDecision);
    const review = pipeline.reviewDecision;
    if (pipeline.state === 'FAILED') {
        const failure = [...events].reverse().find((event) => event.type === 'PIPELINE_FAILED');
        const message = failure?.message || '';
        const provider = message.match(/(OpenAI|Ollama) LIVE/i)?.[1];
        const failedAgent = message.match(/LIVE (REQUIREMENTS|CODE|REVIEW)/i)?.[1]?.toUpperCase();
        const agent = { REQUIREMENTS: 'Rhea', CODE: 'Nova', REVIEW: 'Sentinel' }[failedAgent];
        return {
            tone: 'destructive',
            icon: 'failure',
            title: provider ? `${provider} request failed` : 'Pipeline could not complete',
            description: provider
                ? `${agent || 'An agent'} could not complete the live model stage. No deterministic response was substituted.`
                : 'Execution stopped because of an application error. Start a new run after resolving the issue.',
            detail: message,
        };
    }
    if (
        pipeline.state === 'REQUIREMENTS_READY' &&
        pipeline.requirementAnalysis?.clarificationQuestions?.length
    ) {
        return {
            tone: 'warning',
            icon: 'clarification',
            title: 'Rhea needs clarification',
            description:
                'Implementation is paused. Your answers will supply the missing context before Nova continues.',
            target: 'clarification',
            action: 'Answer questions',
        };
    }
    if (review && review.outcome !== 'APPROVE') {
        return {
            tone: 'destructive',
            icon: 'review',
            title: review.outcome === 'REJECT' ? 'Review rejected' : 'Changes requested',
            description:
                'Sentinel identified issues that prevent this change from progressing. Atlas blocks deployment until the review gate passes.',
            nextStep:
                pipeline.state === 'BLOCKED'
                    ? 'Address the implementation findings and start a new pipeline run.'
                    : undefined,
            counts,
            target: 'review',
            action: 'View findings',
        };
    }
    if (pipeline.state === 'BLOCKED') {
        return {
            tone: 'destructive',
            icon: 'release',
            title:
                pipeline.approvalState === 'REJECTED'
                    ? 'Deployment rejected by a human'
                    : 'Deployment blocked',
            description:
                pipeline.approvalState === 'REJECTED'
                    ? 'The deployment was not authorized. This pipeline will not proceed.'
                    : pipeline.deploymentDecision?.blockingReasons?.join(' ') ||
                      'A required system gate did not pass.',
            nextStep:
                pipeline.approvalState === 'REJECTED'
                    ? 'Discuss the rejection with the approver and address their concerns before starting a new run.'
                    : pipeline.codeChangeSet && !hasPassingTestSignal(pipeline.codeChangeSet)
                      ? 'Correct the proposed implementation/tests before starting another run.'
                      : 'Address the failed release gates before starting a new pipeline run.',
            counts,
            target: 'release',
            action: 'View system gates',
        };
    }
    if (pipeline.state === 'WAITING_FOR_APPROVAL') {
        return {
            tone: 'warning',
            icon: 'release',
            title: 'Ready for human approval',
            description:
                'Review and technical gates passed. A human must authorize the simulated deployment.',
            target: 'release',
            action: 'Review decision',
        };
    }
    if (pipeline.state === 'DEPLOYED') {
        return {
            tone: 'success',
            icon: 'complete',
            title: 'Pipeline completed',
            description: 'Human approval was recorded and the simulated deployment completed.',
        };
    }
    return null;
}

export function splitClarification(summary = '') {
    const marker = '\nHuman clarification:\n';
    const position = summary.indexOf(marker);
    return position < 0
        ? { summary, clarification: '' }
        : {
              summary: summary.slice(0, position),
              clarification: summary.slice(position + marker.length),
          };
}
