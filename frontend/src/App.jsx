import React, { useEffect, useRef, useState } from 'react';

import Sidebar from './components/Sidebar.jsx';
import PipelineStages from './components/PipelineStages.jsx';
import AgentActivity from './components/AgentActivity.jsx';
import DiffViewer from './components/DiffViewer.jsx';
import Findings from './components/Findings.jsx';
import ApprovalPanel from './components/ApprovalPanel.jsx';

import { api, streamEvents } from './api.js';

const TERMINAL_STATES = [
    'DEPLOYED',
    'BLOCKED',
    'FAILED'
];

export default function App() {

    const [status, setStatus] = useState(null);
    const [scenario, setScenario] = useState('NORMAL');
    const [pipeline, setPipeline] = useState(null);
    const [events, setEvents] = useState([]);
    const [nav, setNav] = useState('dashboard');

    const [pipelines, setPipelines] = useState([]);
    const [audit, setAudit] = useState([]);
    const [github, setGithub] = useState(null);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const sourceRef = useRef(null);
    const pollRef = useRef(null);
    const actionRef = useRef(false);

    useEffect(() => {

        api.status().then((s) => {
            setStatus(s);
            setScenario(s.scenario);
        }).catch((err) => setError(err.message));

        refreshList();

        return () => {
            sourceRef.current?.close();
            clearInterval(pollRef.current);
        };

    }, []);

    async function refreshList() {

        try {
            setPipelines(await api.listPipelines());
        } catch {
            // ignore
        }
    }

    async function refresh(id) {

        const p =
            await api.getPipeline(id);

        setPipeline(p);

        try {
            setAudit(await api.audit(id));
        } catch {}

        try {
            setGithub(await api.github(id));
        } catch {}

        refreshList();

        if (TERMINAL_STATES.includes(p.state)) {
            clearInterval(pollRef.current);
        }
    }

    async function perform(action) {
        if (actionRef.current) return;
        actionRef.current = true;
        setBusy(true);
        setError('');
        try {
            await action();
        } catch (err) {
            setError(err.message);
        } finally {
            actionRef.current = false;
            setBusy(false);
        }
    }

    async function onScenarioChange(next) {
        await perform(async () => {
            await api.setScenario(next);
            setScenario(next);
        });
    }

    async function runDemo() {
        await perform(async () => {
            sourceRef.current?.close();
            clearInterval(pollRef.current);
            setEvents([]);
            const p = await api.runDemo();

            setPipeline(p);

            await refresh(p.id);

            sourceRef.current = streamEvents(p.id, (evt) => {
                setEvents(prev => [...prev, evt]);
                if (evt.type === 'PIPELINE_FAILED') {
                    setError(evt.message);
                }
                refresh(p.id).catch((err) => setError(err.message));
            });

            pollRef.current = setInterval(
                () => refresh(p.id).catch((err) => setError(err.message)), 1000);
        });
    }

    async function approve() {
        await perform(async () => {
            await api.approve(pipeline.id);
            await refresh(pipeline.id);
        });
    }

    async function reject() {
        await perform(async () => {
            await api.reject(pipeline.id);
            await refresh(pipeline.id);
        });
    }

    async function clarify(answers) {
        await perform(async () => {
            await api.clarify(pipeline.id, answers);
            await refresh(pipeline.id);
        });
    }

    const live =
        status?.aiMode === 'LIVE';

    return (
        <div className="flex h-screen bg-ink text-slate-100">

            <Sidebar
                active={nav}
                onSelect={setNav}
            />

            <main className="flex-1 flex flex-col min-w-0">

                <header className="flex items-center justify-between px-6 py-3 border-b border-edge bg-panel">

                    <div>

                        <div className="text-sm text-slate-400">
                            Ubuntu Bank · Delivery Pipeline
                        </div>

                        <div className="text-lg font-semibold">
                            {
                                pipeline
                                    ? `${pipeline.ticket.key} — ${pipeline.ticket.title}`
                                    : 'UB-4821 — High Value Transaction Notification'
                            }
                        </div>

                    </div>

                    <div className="flex items-center gap-3">

                        <span
                            className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
                                live
                                    ? 'bg-accent/20 text-accent'
                                    : 'bg-ok/20 text-ok'
                            }`}
                        >
                            {!status ? 'CONNECTING' : live
                                ? `LIVE · ${status.provider}`
                                : 'DEMO · DETERMINISTIC'}
                        </span>

                        {status && !live && (
                        <select
                            value={scenario}
                            disabled={busy}
                            onChange={(e) =>
                                onScenarioChange(
                                    e.target.value
                                )
                            }
                            className="bg-panel2 border border-edge rounded-md px-3 py-1.5 text-sm"
                        >
                            {(status?.scenarios || [scenario])
                                .map((s) => (
                                    <option key={s}>
                                        {s}
                                    </option>
                                ))}
                        </select>
                        )}

                        <button
                            onClick={runDemo}
                            disabled={busy || !status}
                            className="bg-accent px-4 py-1.5 rounded-md text-white disabled:opacity-50"
                        >
                            ▶ Run Pipeline
                        </button>

                    </div>

                </header>

                {error && (
                    <div role="alert" className="px-6 py-2 text-sm text-danger border-b border-edge">
                        {error}
                    </div>
                )}

                <div className="flex-1 flex overflow-hidden">

                    <section className="flex-1 overflow-y-auto p-6 space-y-6">

                        {nav === 'dashboard' && (
                            <>
                                <PipelineStages
                                    state={pipeline?.state}
                                />

                                <div className="grid xl:grid-cols-2 gap-6">

                                    <Panel title="🔍 Rhea · Requirement Analysis">

                                        {pipeline?.requirementAnalysis ? (
                                            <Requirements
                                                analysis={pipeline.requirementAnalysis}
                                                awaiting={
                                                    pipeline.state === 'REQUIREMENTS_READY'
                                                    &&
                                                    pipeline.requirementAnalysis.clarificationQuestions?.length > 0
                                                }
                                                onClarify={clarify}
                                                pending={busy}
                                            />
                                        ) : (
                                            <Empty text="No analysis yet." />
                                        )}

                                    </Panel>

                                    <Panel title="💻 Nova · Code Proposal">

                                        <DiffViewer
                                            diff={
                                                pipeline?.codeChangeSet?.unifiedDiff
                                            }
                                        />

                                    </Panel>

                                    <Panel title="🛡️ Sentinel · Review">

                                        <Findings
                                            review={
                                                pipeline?.reviewDecision
                                            }
                                        />

                                    </Panel>

                                    <Panel title="🚀 Atlas · Deploy">

                                        <ApprovalPanel
                                            pipeline={pipeline}
                                            onApprove={approve}
                                            onReject={reject}
                                            pending={busy}
                                        />

                                    </Panel>

                                </div>
                            </>
                        )}

                        {nav === 'issues' && (
                            <IssuesView
                                pipelines={pipelines}
                            />
                        )}

                        {nav === 'agents' && (
                            <AgentsView />
                        )}

                        {nav === 'pulls' && (
                            <PullRequestsView
                                github={github}
                            />
                        )}

                        {nav === 'deployments' && (
                            <DeploymentsView
                                pipeline={pipeline}
                            />
                        )}

                        {nav === 'audit' && (
                            <AuditView
                                audit={audit}
                                pipeline={pipeline}
                                live={live}
                            />
                        )}

                    </section>

                    <section className="w-96 border-l border-edge bg-panel">

                        <AgentActivity
                            events={events}
                        />

                    </section>

                </div>

            </main>

        </div>
    );
}

/* ---------------- Shared UI ---------------- */

function Panel({ title, children }) {
    return (
        <div className="rounded-xl border border-edge bg-panel p-4">
            <div className="text-sm font-semibold mb-3">
                {title}
            </div>
            {children}
        </div>
    );
}

function Empty({ text }) {
    return (
        <div className="text-slate-500 text-sm">
            {text}
        </div>
    );
}

function Requirements({
                          analysis,
                          awaiting,
                          onClarify,
                          pending
                      }) {
    return (
        <div className="space-y-3">

            <p className="text-slate-300">
                {analysis.summary}
            </p>

            {analysis.acceptanceCriteria?.length > 0 && (
                <List
                    title="Acceptance Criteria"
                    items={analysis.acceptanceCriteria}
                />
            )}

            {analysis.complianceConcerns?.length > 0 && (
                <List
                    title="Compliance Concerns"
                    items={analysis.complianceConcerns}
                />
            )}

            {analysis.clarificationQuestions?.length > 0 && (
                <List
                    title="Clarification Questions"
                    items={analysis.clarificationQuestions}
                />
            )}

            {awaiting && (
                <ClarificationForm
                    questions={analysis.clarificationQuestions}
                    onSubmit={onClarify}
                    pending={pending}
                />
            )}
        </div>
    );
}

function List({ title, items }) {
    return (
        <div>
            <div className="text-xs uppercase text-slate-400 mb-1">
                {title}
            </div>

            <ul className="list-disc ml-5 text-sm space-y-1">
                {items.map((i, idx) => (
                    <li key={idx}>{i}</li>
                ))}
            </ul>
        </div>
    );
}

function ClarificationForm({ questions, onSubmit, pending }) {

    const [answers, setAnswers] =
        useState(() =>
            questions.map(() => '')
        );

    const update = (i, value) =>
        setAnswers(prev =>
            prev.map((a, idx) =>
                idx === i ? value : a
            )
        );

    return (
        <div className="rounded-lg border border-warn/40 bg-warn/5 p-3">

            <div className="text-xs text-warn font-semibold mb-2">
                Rhea needs clarification
            </div>

            {questions.map((q, i) => (
                <div key={i} className="mb-2">

                    <div className="text-sm mb-1">
                        {q}
                    </div>

                    <input
                        disabled={pending}
                        className="w-full bg-panel2 border border-edge rounded px-2 py-1"
                        value={answers[i]}
                        onChange={(e) =>
                            update(i, e.target.value)
                        }
                    />

                </div>
            ))}

            <button
                onClick={() => onSubmit(answers)}
                disabled={pending || answers.length !== questions.length || answers.some(answer => !answer.trim())}
                className="bg-accent px-4 py-2 rounded disabled:opacity-50"
            >
                Submit clarifications & resume
            </button>

        </div>
    );
}

function IssuesView({ pipelines }) {
    return (
        <Panel title="◉ Issues">
            {pipelines.length ? (
                <table className="w-full text-sm">
                    <thead>
                    <tr>
                        <th>Ticket</th>
                        <th>Scenario</th>
                        <th>State</th>
                    </tr>
                    </thead>
                    <tbody>
                    {pipelines.map((p) => (
                        <tr key={p.id}>
                            <td>{p.ticket.key}</td>
                            <td>{p.scenario}</td>
                            <td>{p.state}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            ) : (
                <Empty text="No pipelines yet." />
            )}
        </Panel>
    );
}

function AgentsView() {
    const agents = [
        ['🔍', 'Rhea', 'Requirements Analyst'],
        ['💻', 'Nova', 'Senior Java Engineer'],
        ['🛡️', 'Sentinel', 'Security & Compliance Architect'],
        ['🚀', 'Atlas', 'Release Manager']
    ];

    return (
        <Panel title="⬡ AI Agents">
            {agents.map(([e,n,r]) => (
                <div key={n} className="mb-3">
                    <div>{e} {n}</div>
                    <div className="text-slate-400 text-sm">{r}</div>
                </div>
            ))}
        </Panel>
    );
}

function PullRequestsView({ github }) {
    return (
        <Panel title="⇄ Pull Requests">
            {github?.pullRequest
                ? <DiffViewer diff={github.pullRequest.diff} />
                : <Empty text="No pull request yet." />
            }
        </Panel>
    );
}

function DeploymentsView({ pipeline }) {
    return (
        <Panel title="🚀 Deployments">
            <div>{pipeline?.state || 'No deployment yet.'}</div>
        </Panel>
    );
}

function AuditView({ audit, pipeline, live }) {

    return (
        <Panel
            title={
                live
                    ? '📜 Audit Trail (Live)'
                    : '📜 Audit Trail'
            }
        >

            {audit.length ? (

                <div className="space-y-2">

                    {audit.map((e) => (

                        <div
                            key={`${e.id}-${e.createdAt}`}
                            className="flex gap-3 text-sm border-b border-edge pb-2"
                        >

                            <span className="text-xs text-slate-500 w-28 shrink-0">
                                {new Date(e.createdAt).toLocaleTimeString()}
                            </span>

                            <span className="font-semibold text-slate-200 w-24 shrink-0">
                                {e.agent}
                            </span>

                            <span className="text-slate-300">
                                {e.action}
                                {' → '}
                                <span className="text-accent">
                                    {e.decision}
                                </span>

                                {e.policyOutcome ? (
                                    <span className="text-slate-500">
                                        {' · '}
                                        {e.policyOutcome}
                                    </span>
                                ) : null}

                            </span>

                        </div>

                    ))}

                </div>

            ) : (
                <Empty text="No audit events yet." />
            )}

        </Panel>
    );
}