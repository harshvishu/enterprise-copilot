import React, { useEffect, useRef, useState } from 'react';

import Sidebar from './components/Sidebar.jsx';
import PipelineStages from './components/PipelineStages.jsx';
import Findings from './components/Findings.jsx';
import ApprovalPanel from './components/ApprovalPanel.jsx';
import PageHeader from './components/PageHeader.jsx';
import PipelineAlert from './components/PipelineAlert.jsx';
import RequirementsResult from './components/RequirementsResult.jsx';
import CodeProposal from './components/CodeProposal.jsx';
import WorkspaceViews from './components/WorkspaceViews.jsx';
import { TooltipProvider } from './components/ui/tooltip';
import { Skeleton } from './components/ui/skeleton';

import { api, streamEvents } from './api.js';
import { ACTIVE_STATES } from './lib/pipeline.js';

const TERMINAL_STATES = ['DEPLOYED', 'BLOCKED', 'FAILED'];

export default function App() {
    const [status, setStatus] = useState(null);
    const [issues, setIssues] = useState([]);
    const [selectedIssue, setSelectedIssue] = useState('UB-4821');
    const [pipeline, setPipeline] = useState(null);
    const [events, setEvents] = useState([]);
    const [nav, setNav] = useState('dashboard');

    const [pipelines, setPipelines] = useState([]);
    const [audit, setAudit] = useState([]);
    const [github, setGithub] = useState(null);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [loading, setLoading] = useState(true);
    const [pendingAction, setPendingAction] = useState('');

    const sourceRef = useRef(null);
    const pollRef = useRef(null);
    const actionRef = useRef(false);
    const selectedRef = useRef(null);

    useEffect(() => {
        let cancelled = false;
        async function initialize() {
            try {
                const current = await api.status();
                if (cancelled) return;
                setStatus(current);
                const backlog = await api.demoIssues();
                if (cancelled) return;
                setIssues(backlog);
                const list = await api.listPipelines();
                if (cancelled) return;
                setPipelines(list);
                if (list[0]) {
                    if (backlog.some((issue) => issue.key === list[0].ticket.key)) {
                        setSelectedIssue(list[0].ticket.key);
                    }
                    setPipeline(list[0]);
                    connect(list[0].id);
                    await refresh(list[0].id);
                }
            } catch (err) {
                if (!cancelled) setError(err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        initialize();

        return () => {
            cancelled = true;
            selectedRef.current = null;
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
        const p = await api.getPipeline(id);

        if (selectedRef.current !== id) return;
        setPipeline(p);

        try {
            const records = await api.audit(id);
            if (selectedRef.current === id) setAudit(records);
        } catch {}

        try {
            const view = await api.github(id);
            if (selectedRef.current === id) setGithub(view);
        } catch {}

        refreshList();

        if (TERMINAL_STATES.includes(p.state)) {
            clearInterval(pollRef.current);
        }
    }

    function connect(id) {
        sourceRef.current?.close();
        clearInterval(pollRef.current);
        selectedRef.current = id;
        setEvents([]);
        sourceRef.current = streamEvents(id, (event) => {
            if (selectedRef.current !== id) return;
            setEvents((previous) => [...previous, event]);
            refresh(id).catch((err) => setError(err));
        });
        pollRef.current = setInterval(() => refresh(id).catch((err) => setError(err)), 1000);
    }

    async function perform(action, name) {
        if (actionRef.current) return;
        actionRef.current = true;
        setBusy(true);
        setPendingAction(name);
        setError('');
        try {
            await action();
        } catch (err) {
            setError(err);
        } finally {
            actionRef.current = false;
            setBusy(false);
            setPendingAction('');
        }
    }

    async function runIssue(key = selectedIssue) {
        await perform(async () => {
            sourceRef.current?.close();
            clearInterval(pollRef.current);
            setEvents([]);
            const p = await api.runDemo(key);

            setSelectedIssue(key);
            setNav('dashboard');
            setPipeline(p);
            setAudit([]);
            setGithub(null);
            connect(p.id);
            await refresh(p.id);
        }, 'run');
    }

    async function approve() {
        await perform(async () => {
            await api.approve(pipeline.id);
            await refresh(pipeline.id);
        }, 'approve');
    }

    async function reject() {
        await perform(async () => {
            await api.reject(pipeline.id);
            await refresh(pipeline.id);
        }, 'reject');
    }

    async function clarify(answers) {
        await perform(async () => {
            await api.clarify(pipeline.id, answers);
            await refresh(pipeline.id);
        }, 'clarify');
    }

    async function changeMode(mode) {
        await perform(async () => setStatus(await api.setMode(mode)), 'mode');
    }

    async function submitReviewFeedback(feedback) {
        await perform(async () => {
            await api.reviewFeedback(pipeline.id, feedback);
            await refresh(pipeline.id);
        }, 'review-feedback');
    }

    const runStatus = pipeline
        ? { ...status, aiMode: pipeline.aiMode,
            provider: pipeline.aiMode === 'DEMO' ? 'DEMO' : status?.liveProvider || status?.provider }
        : status;

    const running =
        ACTIVE_STATES.includes(pipeline?.state) ||
        (pipeline?.state === 'REQUIREMENTS_READY' &&
            !pipeline?.requirementAnalysis?.clarificationQuestions?.length);

    return (
        <TooltipProvider delayDuration={200}>
            <div className="flex min-h-screen bg-background text-foreground">
                <div className="sticky top-0 hidden h-screen w-[200px] shrink-0 border-r lg:block">
                    <Sidebar active={nav} onSelect={setNav} status={status} onMode={changeMode} pending={busy} />
                </div>
                <main className="min-w-0 flex-1">
                    <div className="mx-auto w-full max-w-[1360px] px-5 pb-10 sm:px-8 xl:px-10">
                        <PageHeader
                            pipeline={pipeline}
                            status={status}
                            issue={issues.find((issue) => issue.key === selectedIssue)}
                            onRun={() => runIssue()}
                            pending={busy}
                            action={pendingAction}
                            events={events}
                            nav={nav}
                            onNavigate={setNav}
                            onMode={changeMode}
                        />
                        {loading ? (
                            <div aria-label="Loading pipeline" className="space-y-6 py-8">
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        ) : nav === 'dashboard' ? (
                            <>
                                <PipelineStages pipeline={pipeline} events={events} />
                                <div className="my-6">
                                    <PipelineAlert
                                        pipeline={pipeline}
                                        events={events}
                                        error={error}
                                    />
                                </div>
                                <div className="mb-1 flex items-center justify-between gap-3">
                                    <h2 className="text-xs font-medium text-muted-foreground">
                                        Agent outputs
                                    </h2>
                                    {pipeline && (
                                        <span
                                            title={pipeline.id}
                                            className="font-mono text-[10px] text-muted-foreground/65"
                                        >
                                            Run {pipeline.id.slice(0, 8)}
                                        </span>
                                    )}
                                </div>
                                <RequirementsResult
                                    pipeline={pipeline}
                                    pending={busy}
                                    onClarify={clarify}
                                    events={events}
                                    status={runStatus}
                                />
                                <CodeProposal pipeline={pipeline} events={events} status={runStatus} />
                                <div className="grid min-w-0 gap-0 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_280px] xl:gap-10">
                                    <Findings
                                        review={pipeline?.reviewDecision}
                                        running={pipeline?.state === 'REVIEWING'}
                                        mode={pipeline?.aiMode || status?.aiMode}
                                        pipeline={pipeline}
                                        pending={busy}
                                        onReviewFeedback={submitReviewFeedback}
                                        feedbackHistory={audit}
                                        events={events}
                                        status={runStatus}
                                    />
                                    <div className="border-t lg:border-l lg:border-t-0 lg:pl-7">
                                        <ApprovalPanel
                                            pipeline={pipeline}
                                            onApprove={approve}
                                            onReject={reject}
                                            pending={busy}
                                            action={pendingAction}
                                            events={events}
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <PipelineAlert error={error} />
                                <WorkspaceViews
                                    nav={nav}
                                    pipelines={pipelines}
                                    issues={issues}
                                    onRunIssue={runIssue}
                                    running={running}
                                    pending={busy}
                                    github={github}
                                    pipeline={pipeline}
                                    audit={audit}
                                    status={runStatus}
                                />
                            </>
                        )}
                    </div>
                </main>
            </div>
        </TooltipProvider>
    );
}
