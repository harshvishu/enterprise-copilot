const BASE = '/api';

async function json(res) {
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`${res.status}: ${body}`);
    }
    return res.status === 204
        ? null
        : res.json();
}

export const api = {
    status: () =>
        fetch(`${BASE}/demo/status`).then(json),
    setScenario: (scenario) =>
        fetch(
            `${BASE}/demo/scenario?scenario=${scenario}`,
            { method: 'POST' }
        ).then(json),

    runDemo: () =>
        fetch(
            `${BASE}/demo/run`,
            { method: 'POST' }
        ).then(json),

    listPipelines: () =>
        fetch(`${BASE}/pipelines`).then(json),

    getPipeline: (id) =>
        fetch(`${BASE}/pipelines/${id}`).then(json),

    approve: (id) =>
        fetch(
            `${BASE}/pipelines/${id}/approve`,
            { method: 'POST' }
        ).then(json),

    reject: (id) =>
        fetch(
            `${BASE}/pipelines/${id}/reject`,
            { method: 'POST' }
        ).then(json),

    audit: (id) =>
        fetch(
            `${BASE}/audit/pipelines/${id}`
        ).then(json),

    github: (id) =>
        fetch(
            `${BASE}/github/pipelines/${id}`
        ).then(json)
};

export function streamEvents(id, onEvent) {
    const source =
        new EventSource(
            `${BASE}/pipelines/${id}/events`
        );

    const types = [
        'PIPELINE_STARTED',
        'AGENT_STARTED',
        'AGENT_THINKING',
        'TOOL_INVOKED',
        'AGENT_COMPLETED',
        'FINDING_CREATED',
        'GATE_BLOCKED',
        'APPROVAL_REQUIRED',
        'APPROVAL_GRANTED',
        'APPROVAL_REJECTED',
        'DEPLOYMENT_STARTED',
        'DEPLOYMENT_COMPLETED',
        'PIPELINE_COMPLETED',
        'PIPELINE_FAILED'
    ];

    types.forEach((t) =>
        source.addEventListener(
            t,
            (e) => onEvent(JSON.parse(e.data))
        )
    );

    source.onerror = () => source.close();
    return source;
}