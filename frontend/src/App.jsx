import React, {useEffect, useRef, useState} from 'react';
import Sidebar from './components/Sidebar.jsx';
import PipelineStages from './components/PipelineStages.jsx';
import AgentActivity from './components/AgentActivity.jsx';
import DiffViewer from './components/DiffViewer.jsx';
import Findings from './components/Findings.jsx';
import ApprovalPanel from './components/ApprovalPanel.jsx';
import {api, streamEvents} from './api.js';

const TERMINAL_STATES = ['DEPLOYED', 'BLOCKED', 'FAILED'];

export default function App() {
    const [status, setStatus] = useState(null);
    const [scenario, setScenario] = useState('NORMAL');
    const [pipeline, setPipeline] = useState(null);
    const [events, setEvents] = useState([]);
    const [nav, setNav] = useState('dashboard');
    const sourceRef = useRef(null);
    const pollRef = useRef(null);

    useEffect(() => {
        api.status().then((s) => {
            setStatus(s);
            setScenario(s.scenario);
        });
        return () => {
            sourceRef.current?.close();
            clearInterval(pollRef.current);
        };
    }, []);

    async function refresh(id) {
        const p = await api.getPipeline(id);
        setPipeline(p);
        if (TERMINAL_STATES.includes(p.state)) {
            clearInterval(pollRef.current);
        }
    }

    async function onScenarioChange(next) {
        setScenario(next);
        await api.setScenario(next);
    }

    async function runDemo() {
        sourceRef.current?.close();
        clearInterval(pollRef.current);
        const p = await api.runDemo();
        setPipeline(p);
        sourceRef.current = streamEvents(p.id, (evt) => {
            setEvents((prev) => [...prev, evt]);
            refresh(p.id);
        });
        pollRef.current = setInterval(() => refresh(p.id), 1200);
    }

    async function approve() {
        await api.approve(pipeline.id);
        refresh(pipeline.id);
    }

    async function reject() {
        await api.reject(pipeline.id);
        refresh(pipeline.id);
    }

    const live = status?.aiMode === 'LIVE';

    return (
        <div className="flex h-screen">
            <Sidebar active={nav} onSelect={setNav}/>

            <main className="flex-1 flex flex-col min-w-0">
                {/* Top bar */}
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
                            className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                                live
                                    ? 'bg-accent/20 text-accent'
                                    : 'bg-ok/20 text-ok'
                            }`}
                        >
                            {live
                                ? '● LIVE AI MODE'
                                : '● DEMO MODE'}
                        </span>
                        <select
                            value={scenario}
                            onChange={(e) =>
                                onScenarioChange(e.target.value)
                            }
                            className="bg-panel2 border border-edge rounded-md text-sm px-3 py-1.5 text-slate-200"
                        >
                            {(status?.scenarios || [scenario]).map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>

                        <button
                            onClick={runDemo}
                            className="px-4 py-1.5 rounded-md bg-accent hover:bg-accent/90 text-white text-sm font-semibold"
                        >
                            ▶ Run Pipeline
                        </button>

                    </div>

                </header>

                {/* Body */}

                <div className="flex-1 flex min-h-0">

                    <section className="flex-1 overflow-y-auto p-6 space-y-6">

                        <PipelineStages
                            state={pipeline?.state}
                        />

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                            <Panel title="🔍 Rhea · Requirement Analysis">

                                {pipeline?.requirementAnalysis
                                    ? (
                                        <Requirements
                                            analysis={
                                                pipeline.requirementAnalysis
                                            }
                                        />
                                    )
                                    : (
                                        <Empty
                                            text="No analysis yet."
                                        />
                                    )}

                            </Panel>

                            <Panel title="💻 Nova · Code Proposal (Pull Request)">

                                <DiffViewer
                                    diff={
                                        pipeline?.codeChangeSet?.unifiedDiff
                                    }
                                />

                            </Panel>

                            <Panel title="🛡 Sentinel · Security & Compliance Review">

                                <Findings
                                    review={pipeline?.reviewDecision}
                                />

                            </Panel>

                            <Panel title="🚀 Atlas · Deployment">

                                <ApprovalPanel
                                    pipeline={pipeline}
                                    onApprove={approve}
                                    onReject={reject}
                                />

                            </Panel>

                        </div>

                    </section>

                    <section className="w-96 shrink-0 border-l border-edge bg-panel">

                        <AgentActivity
                            events={events}
                        />

                    </section>

                </div>

            </main>

        </div>
    );
}

/* ---------- Small UI Helpers ---------- */

function Panel({title, children}) {

    return (
        <div className="rounded-xl border border-edge bg-panel p-4">

            <div className="text-sm font-semibold text-slate-200 mb-3">
                {title}
            </div>

            {children}

        </div>
    );
}

function Empty({text}) {

    return (
        <div className="text-slate-500 text-sm">
            {text}
        </div>
    );
}

function Requirements({analysis}) {

    return (
        <div className="space-y-3 text-sm">

            <p className="text-slate-300">
                {analysis.summary}
            </p>

            {analysis.clarificationQuestions?.length > 0 && (
                <List
                    title="Clarification questions"
                    items={analysis.clarificationQuestions}
                    tone="warn"
                />
            )}

            {analysis.complianceConcerns?.length > 0 && (
                <List
                    title="Compliance concerns"
                    items={analysis.complianceConcerns}
                    tone="danger"
                />
            )}

            {analysis.acceptanceCriteria?.length > 0 && (
                <List
                    title="Acceptance criteria"
                    items={analysis.acceptanceCriteria}
                    tone="ok"
                />
            )}

        </div>
    );
}

function List({title, items, tone}) {

    const color =
        tone === 'warn'
            ? 'text-warn'
            : tone === 'danger'
                ? 'text-danger'
                : tone === 'ok'
                    ? 'text-ok'
                    : 'text-slate-300';

    return (
        <div>

            <div
                className={`text-xs font-semibold uppercase tracking-wide ${color}`}
            >
                {title}
            </div>

            <ul className="list-disc ml-5 mt-1 text-slate-300 space-y-0.5">

                {items.map((it, i) => (
                    <li key={i}>
                        {it}
                    </li>
                ))}

            </ul>

        </div>
    );
}