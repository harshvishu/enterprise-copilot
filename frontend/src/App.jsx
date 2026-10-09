import React, { useEffect, useMemo, useRef, useState } from 'react';

import Sidebar from './components/Sidebar.jsx';
import PipelineStages from './components/PipelineStages.jsx';
import Findings from './components/Findings.jsx';
import ApprovalPanel from './components/ApprovalPanel.jsx';
import PageHeader from './components/PageHeader.jsx';
import PipelineAlert from './components/PipelineAlert.jsx';
import RequirementsResult from './components/RequirementsResult.jsx';
import CodeProposal from './components/CodeProposal.jsx';
import WorkspaceViews from './components/WorkspaceViews.jsx';
import { Button } from './components/ui/button';
import { useWorkshopPlayback } from './lib/useWorkshopPlayback';
import { presentationDelay, presentationPipeline, presentationSections, workshopEntries } from './lib/workshop';
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
    const [presentationPace, setPresentationPace] = useState(0);
    const [followLatest, setFollowLatest] = useState(true);
    const outputRef = useRef(null);
    const entries = useMemo(() => presentationSections(workshopEntries(events, pipeline?.aiMode || status?.aiMode)), [events, pipeline?.aiMode, status?.aiMode]);
    const paced = presentationPace > 0;
    const { count, skip, skipped } = useWorkshopPlayback(entries, pipeline?.id, paced, presentationDelay(presentationPace));
    const visibleEntries = entries.slice(0, count);
    const visibleEvents = visibleEntries.map((entry) => entry.event);
    const displayedPipeline = paced ? presentationPipeline(pipeline, events, count) : pipeline;
    const resultVisibility = [displayedPipeline?.requirementAnalysis, displayedPipeline?.codeChangeSet, displayedPipeline?.reviewDecision]
        .map(Boolean).join(':');
    const lastEntry = visibleEntries.at(-1);
    const activity = (agent) => ({
        entries: visibleEntries.filter((entry) => entry.section === agent),
        agent, follow: followLatest,
    });
    useEffect(() => {
        if (!followLatest || nav !== 'dashboard' || !lastEntry || !outputRef.current) return;
        // Let presenters fill human-input forms without later events moving the page.
        if (document.activeElement?.closest('form, [data-human-controls]')) return;
        const result = lastEntry.event.type === 'AGENT_COMPLETED'
            ? outputRef.current.querySelector(`[data-result-for="${lastEntry.event.agent}"]`) : null;
        const event = outputRef.current.querySelector(`[data-presentation-index="${count - 1}"]`);
        (result || event?.closest('[role="log"]'))?.scrollIntoView({ block: 'nearest' });
    }, [count, followLatest, nav, pipeline?.id, resultVisibility]);

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
            api.status().then(setStatus).catch(() => {});

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
                            presentationPace={presentationPace}
                            onPresentationPace={setPresentationPace}
                            followLatest={followLatest}
                            onFollowLatest={setFollowLatest}
                        />
                        {loading ? (
                            <div aria-label="Loading pipeline" className="space-y-6 py-8">
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        ) : nav === 'dashboard' ? (
                            <>
                                <PipelineStages pipeline={displayedPipeline} events={visibleEvents} />
                                <div className="my-6">
                                    <PipelineAlert
                                        pipeline={pipeline}
                                        events={events}
                                        error={error}
                                    />
                                </div>
                                <div className="mb-1 flex items-center justify-between gap-3">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h2 className="text-xs font-medium text-muted-foreground">Agent outputs</h2>
                                        {paced && <Button variant="outline" size="sm" onClick={skip} disabled={skipped || !entries.length}>
                                            {skipped ? 'Delays skipped for this run' : 'Skip remaining delays'}
                                        </Button>}
                                    </div>
                                    {pipeline && (
                                        <span
                                            title={pipeline.id}
                                            className="font-mono text-[10px] text-muted-foreground/65"
                                        >
                                            Run {pipeline.id.slice(0, 8)}
                                        </span>
                                    )}
                                </div>
                                <div ref={outputRef}>
                                <RequirementsResult
                                    pipeline={displayedPipeline}
                                    actionPipeline={pipeline}
                                    activity={activity('Rhea')}
                                    pending={busy}
                                    onClarify={clarify}
                                    events={visibleEvents}
                                    status={runStatus}
                                />
                                <CodeProposal pipeline={displayedPipeline} events={visibleEvents} status={runStatus} activity={activity('Nova')} />
                                <div className="min-w-0 divide-y">
                                    <Findings
                                        review={displayedPipeline?.reviewDecision}
                                        running={displayedPipeline?.state === 'REVIEWING'}
                                        mode={pipeline?.aiMode || status?.aiMode}
                                        pipeline={displayedPipeline}
                                        actionPipeline={pipeline}
                                        activity={activity('Sentinel')}
                                        pending={busy}
                                        onReviewFeedback={submitReviewFeedback}
                                        feedbackHistory={audit}
                                        events={visibleEvents}
                                        status={runStatus}
                                    />
                                    <div>
                                        <ApprovalPanel
                                            pipeline={displayedPipeline}
                                            actionPipeline={pipeline}
                                            activity={activity('Atlas')}
                                            onApprove={approve}
                                            onReject={reject}
                                            pending={busy}
                                            action={pendingAction}
                                            events={visibleEvents}
                                        />
                                    </div>
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
