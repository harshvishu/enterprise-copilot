const BASE = '/api';

async function json(res) {
    if (!res.ok) {
        const body = await res.text();
        let message = body;
        try {
            message = JSON.parse(body).message || res.statusText;
        } catch {}
        const error = new Error(message || `Request failed (${res.status})`);
        error.status = res.status;
        throw error;
    }
    return res.status === 204 ? null : res.json();
}

export const api = {
    status: () => fetch(`${BASE}/demo/status`).then(json),
    setMode: (mode) => fetch(`${BASE}/demo/mode?mode=${mode}`, { method: 'POST' }).then(json),
    setScenario: (scenario) =>
        fetch(`${BASE}/demo/scenario?scenario=${scenario}`, { method: 'POST' }).then(json),

    runDemo: (issueKey, executeRepository = false) =>
        fetch(`${BASE}/demo/${executeRepository ? 'run-repository' : 'run'}${issueKey ? `?issueKey=${encodeURIComponent(issueKey)}` : ''}`, {
            method: 'POST',
        }).then(json),

    demoIssues: () => fetch(`${BASE}/demo/issues`).then(json),

    listPipelines: () => fetch(`${BASE}/pipelines`).then(json),

    getPipeline: (id) => fetch(`${BASE}/pipelines/${id}`).then(json),

    approve: (id, candidateCommit) => fetch(`${BASE}/pipelines/${id}/approve`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateCommit }),
    }).then(json),
    merge: (id, candidateCommit) => fetch(`${BASE}/pipelines/${id}/merge`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateCommit }),
    }).then(json),

    reject: (id) => fetch(`${BASE}/pipelines/${id}/reject`, { method: 'POST' }).then(json),

    clarify: (id, answers) =>
        fetch(`${BASE}/pipelines/${id}/clarify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers }),
        }).then(json),

    audit: (id) => fetch(`${BASE}/audit/pipelines/${id}`).then(json),
    reviewFeedback: (id, feedback) =>
        fetch(`${BASE}/pipelines/${id}/review-feedback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feedback }),
        }).then(json),

    github: (id) => fetch(`${BASE}/github/pipelines/${id}`).then(json),
};

export function streamEvents(id, onEvent) {
    const source = new EventSource(`${BASE}/pipelines/${id}/events`);

    const types = [
        'PIPELINE_STARTED',
        'AGENT_STARTED',
        'AGENT_THINKING',
        'TOOL_INVOKED',
        'AGENT_COMPLETED',
        'FINDING_CREATED',
        'GATE_BLOCKED',
        'GATE_EVALUATED',
        'APPROVAL_REQUIRED',
        'APPROVAL_GRANTED',
        'APPROVAL_REJECTED',
        'DEPLOYMENT_STARTED',
        'DEPLOYMENT_COMPLETED',
        'PIPELINE_COMPLETED',
        'PIPELINE_FAILED',
        'AI_FALLBACK',
    ];

    types.forEach((t) => source.addEventListener(t, (e) => onEvent(JSON.parse(e.data))));

    source.onerror = () => source.close();
    return source;
}
