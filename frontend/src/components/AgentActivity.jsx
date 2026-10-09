import React, { useEffect, useRef } from 'react';
import { GATE_LABELS } from '@/lib/pipeline';
import { cn } from '@/lib/utils';

const LABELS = {
    PIPELINE_STARTED: 'Pipeline started',
    AGENT_STARTED: 'Started',
    AGENT_THINKING: 'Step',
    TOOL_INVOKED: 'Reference consulted',
    AGENT_COMPLETED: 'Assessment complete',
    FINDING_CREATED: 'Finding identified',
    GATE_BLOCKED: 'Gate blocked',
    GATE_EVALUATED: 'Gate evaluated',
    APPROVAL_REQUIRED: 'Approval needed',
    APPROVAL_GRANTED: 'Human approved',
    APPROVAL_REJECTED: 'Human rejected',
    DEPLOYMENT_STARTED: 'Deployment started',
    DEPLOYMENT_COMPLETED: 'Deployment complete',
    PIPELINE_COMPLETED: 'Pipeline complete',
    PIPELINE_FAILED: 'Execution stopped',
    AI_FALLBACK: 'Fell back to DEMO',
};

// The parent supplies one shared presentation cursor for every agent section.
export default function AgentActivity({ entries = [], agent, follow = true }) {
    const viewportRef = useRef(null);
    useEffect(() => {
        if (follow && viewportRef.current) {
            viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
        }
    }, [entries.length, follow]);
    if (!entries.length) return null;
    return (
        <div ref={viewportRef} role="log" aria-label={`${agent} execution history`}
            aria-live="polite" aria-relevant="additions" tabIndex={0}
            className="mb-6 max-h-[60vh] overflow-y-auto overscroll-contain rounded-lg border bg-card/40 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-5">
            <ol className="ml-1 space-y-5 pl-5">
                {entries.map(({ event, explanation, meaningful, step, index }) => (
                    <li key={index} data-presentation-index={index} className="relative">
                        <span className={cn('absolute -left-[25px] top-1.5 h-2 w-2 rounded-full border border-background',
                            ['GATE_BLOCKED', 'PIPELINE_FAILED'].includes(event.type) || event.data?.severity === 'CRITICAL'
                                ? 'bg-destructive' : event.type === 'APPROVAL_REQUIRED' || event.type === 'AI_FALLBACK'
                                  ? 'bg-warning' : 'bg-primary/70')} />
                        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-medium text-muted-foreground" title={event.type}>
                                Real event · {event.agent} · {LABELS[event.type] || 'Activity recorded'}
                            </span>
                            <time className="text-xs tabular-nums text-muted-foreground">
                                {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </time>
                        </div>
                        <p className="break-anywhere text-sm font-medium leading-6">
                            {event.type === 'GATE_EVALUATED'
                                ? `${GATE_LABELS[event.data?.gate] || event.data?.gate}: ${event.data?.waiting ? 'waiting for a human' : event.data?.passed ? 'passed' : 'failed'}`
                                : ['DEPLOYMENT_STARTED', 'DEPLOYMENT_COMPLETED'].includes(event.type)
                                  ? `Simulated deployment ${event.type === 'DEPLOYMENT_STARTED' ? 'started' : 'completed'}.`
                                  : event.message}
                        </p>
                        {explanation && <div className="mt-2 space-y-2 text-sm leading-6 text-muted-foreground">
                            <p className="text-xs font-medium text-primary">Educational explanation{meaningful ? ` · Step ${step}` : ' · Detail'} · {explanation.title}</p>
                            <p className="break-anywhere font-mono text-xs leading-5 text-foreground">{explanation.component}</p>
                            <p><span className="font-medium text-foreground">What: </span>{explanation.what}</p>
                            <p><span className="font-medium text-foreground">Why: </span>{explanation.why}</p>
                            {explanation.springAi && <p><span className="font-medium text-foreground">Spring AI: </span>{explanation.springAi}</p>}
                        </div>}
                    </li>
                ))}
            </ol>
        </div>
    );
}
